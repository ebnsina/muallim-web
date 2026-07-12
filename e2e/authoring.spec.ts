import { randomUUID } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ready } from './hydration';
import { OWNER_STATE } from './accounts';

test.use({ storageState: OWNER_STATE });

/**
 * Unique per call, not merely per run: a retry re-executes the test body, and a
 * slug shared with its own first attempt collides with the course that attempt
 * already created.
 */
const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

/**
 * The whole authoring loop, through the pages an author actually uses: nothing
 * to nothing-but-a-title to a published course a stranger can find.
 */
test('a course goes from nothing to published', async ({ page }) => {
	const title = `Composing ${slug('e2e')}`;

	await page.goto('/teach/new');
	await page.getByLabel('Title').fill(title);
	await page.getByRole('button', { name: 'Create course' }).click();

	const course = page.getByRole('link', { name: title });
	await expect(course).toBeVisible();

	// An empty course cannot be published, and the reason says what to do next.
	await page
		.getByRole('listitem')
		.filter({ hasText: title })
		.getByRole('button', { name: 'Publish' })
		.click();
	await expect(page.getByRole('alert')).toContainText('at least one lesson');

	await course.click();
	await expect(page.getByRole('heading', { name: title })).toBeVisible();

	await page.getByPlaceholder('New section').fill('Beginnings');
	await page.getByRole('button', { name: 'Add section' }).click();
	await expect(page.getByRole('textbox', { name: 'Section title', exact: true })).toHaveValue(
		'Beginnings'
	);

	await page.getByPlaceholder('New lesson').fill('The first lesson');
	await page.getByRole('button', { name: 'Add lesson' }).click();
	await expect(page.getByRole('link', { name: 'The first lesson' })).toBeVisible();

	await page.goto('/teach');
	await page
		.getByRole('listitem')
		.filter({ hasText: title })
		.getByRole('button', { name: 'Publish' })
		.click();
	await expect(page.getByRole('alert')).toHaveCount(0);

	// A stranger can now find it.
	await page.goto('/courses');
	await expect(page.getByRole('link', { name: title })).toBeVisible();
});

/**
 * muallim-api rewrites every position in one statement, from an array that must name
 * every sibling exactly once. Moving one section is the smallest thing that can
 * get that wrong.
 */
/**
 * Drags one grip handle over another, in small steps.
 *
 * sveltednd is pointer-driven, so a single move does not register as a drag: it
 * wants a press, a few moves to cross its threshold, a move onto the target, and
 * a release. Playwright's own `dragTo` fires HTML5 drag events, which is the other
 * half of the library and not the half the handle uses.
 */
async function dragHandleOnto(page: Page, source: Locator, target: Locator) {
	const from = await source.boundingBox();
	const to = await target.boundingBox();
	if (!from || !to) throw new Error('a drag handle has no box');

	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
	await page.mouse.down();
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 - 8, { steps: 4 });
	await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
	// Onto the top of the target, so it lands before it rather than after.
	await page.mouse.move(to.x + to.width / 2, to.y + 2, { steps: 4 });
	await page.mouse.up();
}

test('sections reorder by dragging, and the new order sticks', async ({ page }) => {
	const title = `Ordering ${slug('e2e')}`;

	await page.goto('/teach/new');
	await page.getByLabel('Title').fill(title);
	await page.getByRole('button', { name: 'Create course' }).click();
	await page.getByRole('link', { name: title }).click();
	await ready(page);

	for (const section of ['First', 'Second', 'Third']) {
		await page.getByPlaceholder('New section').fill(section);
		await page.getByRole('button', { name: 'Add section' }).click();
		await expect(
			page.getByRole('textbox', { name: 'Section title', exact: true }).last()
		).toHaveValue(section);
	}

	/*
		`expect.poll`, because reading the inputs once samples whatever the DOM held
		at that instant. The reorder re-renders the list, and a plain read races it —
		which looked exactly like the reorder having no effect.
	*/
	const titles = () =>
		page
			.getByRole('textbox', { name: 'Section title', exact: true })
			.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

	await expect.poll(titles).toEqual(['First', 'Second', 'Third']);

	// Drag the last section up above the first.
	await dragHandleOnto(
		page,
		page.getByRole('button', { name: 'Reorder section Third' }),
		page.getByRole('button', { name: 'Reorder section First' })
	);

	// It moved up, and the order survives the round trip to the server: a reload
	// reads it back from the database, not from the page's optimistic copy.
	await expect.poll(titles).not.toEqual(['First', 'Second', 'Third']);
	await page.reload();
	const order = await titles();
	expect(order.indexOf('Third')).toBeLessThan(order.indexOf('Second'));
});

test('sections reorder from the keyboard, and the new order sticks', async ({ page }) => {
	const title = `Keyed ${slug('e2e')}`;

	await page.goto('/teach/new');
	await page.getByLabel('Title').fill(title);
	await page.getByRole('button', { name: 'Create course' }).click();
	await page.getByRole('link', { name: title }).click();
	await ready(page);

	for (const section of ['First', 'Second', 'Third']) {
		await page.getByPlaceholder('New section').fill(section);
		await page.getByRole('button', { name: 'Add section' }).click();
		await expect(
			page.getByRole('textbox', { name: 'Section title', exact: true }).last()
		).toHaveValue(section);
	}

	const titles = () =>
		page
			.getByRole('textbox', { name: 'Section title', exact: true })
			.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

	await expect.poll(titles).toEqual(['First', 'Second', 'Third']);

	// The grip is a real control: focus the last one and press Up to move it.
	await page.getByRole('button', { name: 'Reorder section Third' }).focus();
	await page.keyboard.press('ArrowUp');

	await expect.poll(titles).toEqual(['First', 'Third', 'Second']);
	await page.reload();
	await expect.poll(titles).toEqual(['First', 'Third', 'Second']);
});

/**
 * The toggle PATCHes one field. Sending the whole form from a page that never
 * showed the lesson body would carry an empty `content` and erase it.
 */
test('toggling a preview does not erase the lesson body', async ({ page }) => {
	const title = `Preserving ${slug('e2e')}`;

	await page.goto('/teach/new');
	await page.getByLabel('Title').fill(title);
	await page.getByRole('button', { name: 'Create course' }).click();
	await page.getByRole('link', { name: title }).click();

	await page.getByPlaceholder('New section').fill('Only section');
	await page.getByRole('button', { name: 'Add section' }).click();
	await page.getByPlaceholder('New lesson').fill('Has a body');
	await page.getByRole('button', { name: 'Add lesson' }).click();

	await page.getByRole('link', { name: 'Has a body' }).click();
	await page.getByLabel('Content').fill('A body worth keeping.');
	await page.getByRole('button', { name: 'Save lesson' }).click();

	await page.getByRole('button', { name: 'Make preview' }).click();
	await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeVisible();

	await page.getByRole('link', { name: 'Has a body' }).click();
	await expect(page.getByLabel('Content')).toHaveValue('A body worth keeping.');
});

/**
 * An `iframe` src is executed content on this origin, so what an author types is
 * never what gets framed. A watch link — which does not even play in a frame —
 * becomes a player URL the API wrote, and a page on a host nobody allowed is
 * refused rather than stored.
 */
test('a video lesson frames a player the server wrote, and nothing else', async ({ page }) => {
	const title = `Watching ${slug('e2e')}`;

	await page.goto('/teach/new');
	await page.getByLabel('Title').fill(title);
	await page.getByRole('button', { name: 'Create course' }).click();
	await page.getByRole('link', { name: title }).click();

	await page.getByPlaceholder('New section').fill('Only section');
	await page.getByRole('button', { name: 'Add section' }).click();
	await page.getByPlaceholder('New lesson').fill('The lecture');
	await page.getByRole('button', { name: 'Add lesson' }).click();

	await page.getByRole('link', { name: 'The lecture' }).click();

	// The selects drive each other through Svelte state: choosing `video` is what
	// reveals "Video source". Before hydration the change event goes nowhere, and
	// the second select never appears — a flake that failed about one run in six.
	await ready(page);

	await page.getByLabel('Type').selectOption('video');
	await page.getByLabel('Video source').selectOption('embed');

	// A page on a host this workspace does not embed. The API decides that, and it
	// says so rather than saving it.
	await page.getByLabel('Video URL').fill('https://evil.test/steal');
	await page.getByRole('button', { name: 'Save lesson' }).click();
	await expect(page.getByRole('alert')).toContainText('evil.test');

	// A YouTube watch link, with a playlist and a tracker riding along.
	await page.getByLabel('Video source').selectOption('youtube');
	await page
		.getByLabel('Video URL')
		.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1&si=track');
	await page.getByRole('button', { name: 'Save lesson' }).click();

	// Back on the curriculum, which is where a successful save lands.
	await expect(page.getByRole('heading', { name: title })).toBeVisible();

	// What was stored is the canonical link, not what was typed.
	await page.getByRole('link', { name: 'The lecture' }).click();
	await expect(page.getByLabel('Video URL')).toHaveValue(
		'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
	);

	// And the reading page frames the no-cookie player the API built from the id.
	// The editor's own address names both halves: /teach/{slug}/lessons/{id}.
	const [, , courseSlug, , lessonId] = new URL(page.url()).pathname.split('/');
	await page.goto(`/courses/${courseSlug}/lessons/${lessonId}`);

	await expect(page.locator('iframe')).toHaveAttribute(
		'src',
		'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
	);
});
