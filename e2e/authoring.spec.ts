import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
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

	await page.goto('/teach');
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
 * lms-api rewrites every position in one statement, from an array that must name
 * every sibling exactly once. Moving one section is the smallest thing that can
 * get that wrong.
 */
test('sections reorder, and the ends refuse to move further', async ({ page }) => {
	const title = `Ordering ${slug('e2e')}`;

	await page.goto('/teach');
	await page.getByLabel('Title').fill(title);
	await page.getByRole('button', { name: 'Create course' }).click();
	await page.getByRole('link', { name: title }).click();

	for (const section of ['First', 'Second', 'Third']) {
		await page.getByPlaceholder('New section').fill(section);
		await page.getByRole('button', { name: 'Add section' }).click();
		await expect(
			page.getByRole('textbox', { name: 'Section title', exact: true }).last()
		).toHaveValue(section);
	}

	/*
		`expect.poll`, because reading the inputs once samples whatever the DOM held
		at that instant. `use:enhance` re-renders the list after the reorder lands,
		and a plain read races it — which looked exactly like the reorder having no
		effect. Every other assertion here is a web-first one and retries on its own;
		this is the only place that reads a collection.
	*/
	const titles = () =>
		page
			.getByRole('textbox', { name: 'Section title', exact: true })
			.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

	await expect.poll(titles).toEqual(['First', 'Second', 'Third']);

	await page.getByRole('button', { name: 'Move section Third up' }).click();
	await expect.poll(titles).toEqual(['First', 'Third', 'Second']);

	// The first section has nowhere to go, and the button says so rather than
	// posting an order the API would refuse.
	await expect(page.getByRole('button', { name: 'Move section First up' })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Move section Second down' })).toBeDisabled();
});

/**
 * The toggle PATCHes one field. Sending the whole form from a page that never
 * showed the lesson body would carry an empty `content` and erase it.
 */
test('toggling a preview does not erase the lesson body', async ({ page }) => {
	const title = `Preserving ${slug('e2e')}`;

	await page.goto('/teach');
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
