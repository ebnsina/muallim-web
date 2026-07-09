import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER_STATE, STUDENT_STATE } from './accounts';
import { draftCourse, publishedCourse, requirePrerequisite, setDripMode } from './course';

/**
 * Unique per call, not merely per run: a retry re-executes the test body, and a
 * slug shared with its own first attempt collides with the course that attempt
 * already created.
 */
const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

test.describe('what a stranger may see', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('a draft is invisible: absent from the catalog, and 404 by its own address', async ({
		page,
		request
	}) => {
		const draft = await draftCourse(request, slug('hidden'));

		await page.goto('/courses');
		await expect(page.getByRole('link', { name: `Draft ${draft}` })).toHaveCount(0);

		// 404 rather than 403. Admitting the course exists is the leak.
		const response = await page.goto(`/courses/${draft}`);
		expect(response?.status()).toBe(404);
	});

	test('a preview lesson is readable, and a gated one is 404', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('gates'));

		await page.goto(`/courses/${course.slug}`);
		await expect(page.getByRole('heading', { name: `Course ${course.slug}` })).toBeVisible();
		// `Button href=` renders an anchor, so this is a link, not a button.
		await expect(page.getByRole('link', { name: 'Sign in to enrol' })).toBeVisible();

		const preview = await page.goto(`/courses/${course.slug}/lessons/${course.previewLessonId}`);
		expect(preview?.status()).toBe(200);
		await expect(page.getByText('The body of A free preview.')).toBeVisible();

		// The reader may not have it, and is not told that it exists.
		const gated = await page.goto(`/courses/${course.slug}/lessons/${course.gatedLessonId}`);
		expect(gated?.status()).toBe(404);
	});

	test('the authoring pages send an anonymous visitor to sign in', async ({ page }) => {
		await page.goto('/teach');
		await expect(page).toHaveURL(/\/login\?next=%2Fteach/);
	});
});

test.describe('what a student may see', () => {
	test.use({ storageState: STUDENT_STATE });

	// The regression this suite exists for. /teach/{slug} loads a course through
	// the public endpoint, so a published course rendered the editor for anybody
	// signed in. Every write was refused, but the buttons were there.
	test('the authoring pages are forbidden, not merely ineffective', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('locked'));

		for (const path of ['/teach', `/teach/${course.slug}`]) {
			const response = await page.goto(path);
			expect(response?.status(), `${path} should be forbidden for a student`).toBe(403);
		}
	});

	test('enrolling opens the gated lesson, and completing it reaches 100%', async ({
		page,
		request
	}) => {
		const course = await publishedCourse(request, slug('learn'));

		// Before enrolling, the paywalled lesson does not exist as far as they know.
		const before = await page.goto(`/courses/${course.slug}/lessons/${course.gatedLessonId}`);
		expect(before?.status()).toBe(404);

		await page.goto(`/courses/${course.slug}`);
		await page.getByRole('button', { name: 'Enrol', exact: true }).click();
		await expect(page.getByText('0 of 2 lessons')).toBeVisible();

		// Both lessons, including the preview: completing a course requires an
		// enrolment, so an enrolled learner completes the preview too. Were it
		// otherwise, a course with a preview lesson could never reach 100%.
		for (const id of [course.previewLessonId, course.gatedLessonId]) {
			await page.goto(`/courses/${course.slug}/lessons/${id}`);
			await page.getByRole('button', { name: 'Mark as complete' }).click();
			await expect(page.getByRole('button', { name: 'Reopen lesson' })).toBeVisible();
		}

		await page.goto(`/courses/${course.slug}`);
		await expect(page.getByText('2 of 2 lessons')).toBeVisible();
		await expect(page.getByText('100%')).toBeVisible();

		// Reopening one must drop the roll-up. It is recomputed in the transaction
		// that changed the rows, so the summary cannot disagree with them.
		await page.goto(`/courses/${course.slug}/lessons/${course.gatedLessonId}`);
		await page.getByRole('button', { name: 'Reopen lesson' }).click();

		// Wait for the reopen to land before navigating away. `click()` returns once
		// the event is dispatched, and `use:enhance` posts afterwards — leaving the
		// page would abandon the request, and the roll-up would still read 100%.
		await expect(page.getByRole('button', { name: 'Mark as complete' })).toBeVisible();

		await page.goto(`/courses/${course.slug}`);
		await expect(page.getByText('1 of 2 lessons')).toBeVisible();
	});
});

test.describe('gates a learner meets', () => {
	test.use({ storageState: STUDENT_STATE });

	// The refusal names the course. A 404 here would hide the reason along with
	// the button.
	test('a prerequisite blocks enrolment until it is finished', async ({ page, request }) => {
		const basics = await publishedCourse(request, slug('basics'));
		const advanced = await publishedCourse(request, slug('advanced'));
		await requirePrerequisite(request, advanced.slug, basics.slug);

		await page.goto(`/courses/${advanced.slug}`);
		await expect(page.getByRole('heading', { name: 'Before you enrol' })).toBeVisible();
		await expect(page.getByText('not finished yet')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Enrol', exact: true })).toBeDisabled();

		// Finish the prerequisite. Wait for the enrolment to land: `click()` returns
		// once the event is dispatched and `use:enhance` posts afterwards, so
		// navigating away here abandons the request.
		await page.goto(`/courses/${basics.slug}`);
		await page.getByRole('button', { name: 'Enrol', exact: true }).click();
		await expect(page.getByText('0 of 2 lessons')).toBeVisible();

		for (const id of [basics.previewLessonId, basics.gatedLessonId]) {
			await page.goto(`/courses/${basics.slug}/lessons/${id}`);
			await page.getByRole('button', { name: 'Mark as complete' }).click();
			await expect(page.getByRole('button', { name: 'Reopen lesson' })).toBeVisible();
		}

		// The gate opens. `finished` alone would also match "not finished yet", so
		// the button's state is what this asserts.
		await page.goto(`/courses/${advanced.slug}`);
		const enrol = page.getByRole('button', { name: 'Enrol', exact: true });
		await expect(enrol).toBeEnabled();

		await enrol.click();
		await expect(page.getByText('0 of 2 lessons')).toBeVisible();
	});

	// Sequential drip: the lesson exists and the learner is enrolled, so the answer
	// is "come back", not "no such lesson".
	test('sequential drip locks the next lesson until the previous one is done', async ({
		page,
		request
	}) => {
		const course = await publishedCourse(request, slug('drip'));
		await setDripMode(request, course.slug, 'sequential');

		await page.goto(`/courses/${course.slug}`);
		await expect(page.getByText('Lessons open one at a time')).toBeVisible();
		await page.getByRole('button', { name: 'Enrol', exact: true }).click();
		await expect(page.getByText('0 of 2 lessons')).toBeVisible();

		// The preview is never dripped.
		await page.goto(`/courses/${course.slug}/lessons/${course.previewLessonId}`);
		await expect(page.getByRole('button', { name: 'Mark as complete' })).toBeVisible();

		// The next one is locked, with 403 and a reason.
		const locked = await page.goto(`/courses/${course.slug}/lessons/${course.gatedLessonId}`);
		expect(locked?.status()).toBe(403);
		await expect(page.getByText('Finish the previous lesson')).toBeVisible();

		// Finish the preview; the next lesson opens.
		await page.goto(`/courses/${course.slug}/lessons/${course.previewLessonId}`);
		await page.getByRole('button', { name: 'Mark as complete' }).click();
		await expect(page.getByRole('button', { name: 'Reopen lesson' })).toBeVisible();

		const open = await page.goto(`/courses/${course.slug}/lessons/${course.gatedLessonId}`);
		expect(open?.status()).toBe(200);
		await expect(page.getByText('The body of Behind the paywall.')).toBeVisible();
	});
});

test.describe('what an author may see', () => {
	test.use({ storageState: OWNER_STATE });

	test('their own draft, which nobody else can reach', async ({ page, request }) => {
		const draft = await draftCourse(request, slug('mine'));

		await page.goto('/teach');
		await expect(page.getByRole('link', { name: `Draft ${draft}` })).toBeVisible();

		const response = await page.goto(`/teach/${draft}`);
		expect(response?.status()).toBe(200);
	});
});
