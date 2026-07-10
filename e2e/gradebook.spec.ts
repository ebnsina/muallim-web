import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER_STATE, STUDENT, STUDENT_STATE } from './accounts';
import { assignmentCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

const essay = () => ({ name: 'essay.txt', mimeType: 'text/plain', buffer: Buffer.alloc(32, 'a') });

/*
	The gradebook is written by the transaction that awards a mark. Nothing else
	fills it — no job, no nightly roll-up — so these tests hand work in and mark it
	through the pages, rather than seeding rows a reader would then read back.
*/

test.describe('the gradebook', () => {
	test.use({ storageState: OWNER_STATE });

	test('fills when work is marked, and both sides agree', async ({ page, browser, request }) => {
		const course = await assignmentCourse(request, slug('gb'), {
			title: 'Essay: the House of Wisdom',
			points: 20,
			passing_points: 10
		});

		// Before anything is marked: the learner is listed, with no grade at all.
		await page.goto(`/teach/${course.slug}/gradebook`);
		await expect(page.getByRole('heading', { name: 'Gradebook' })).toBeVisible();

		const row = page.getByRole('row', { name: new RegExp(STUDENT.name) });
		await expect(row).toContainText('Nothing marked');

		// The learner hands in.
		const learner = await browser.newContext({ storageState: STUDENT_STATE });
		const learnerPage = await learner.newPage();
		await learnerPage.goto(`/courses/${course.slug}/lessons/${course.lessonId}/assignment`);
		await ready(learnerPage);
		await learnerPage.getByLabel('Add files').setInputFiles(essay());
		await expect(learnerPage.getByRole('main').getByTitle('essay.txt')).toBeVisible();
		await learnerPage.getByRole('button', { name: 'Hand in' }).click();
		await expect(learnerPage.getByRole('status')).toContainText('waiting to be marked');

		// Nothing is graded yet, so the learner has no band — not an F.
		await learnerPage.goto(`/courses/${course.slug}/grades`);
		await expect(learnerPage.getByText('Not graded yet')).toBeVisible();

		// The owner marks it 17 of 20.
		await page.goto(`/teach/${course.slug}/lessons/${course.lessonId}/assignment/submissions`);
		await page.getByRole('link', { name: new RegExp(STUDENT.name) }).click();
		await page.getByLabel('Grade').fill('17');
		await page.getByLabel('Feedback').fill('Clear and well argued.');
		await page.getByRole('button', { name: 'Record grade' }).click();

		/*
			Wait for the redirect the mark causes.

			`click()` returns once the event is dispatched, and `use:enhance` posts after
			that. Navigating here aborts the request in flight — the mark never lands,
			and the gradebook honestly reports nothing marked. It looks exactly like a
			bug in the page.
		*/
		await expect(page.getByText('Nothing is waiting to be marked')).toBeVisible();

		// 17 of 20 is 85%, which is a B on the default scale.
		await page.goto(`/teach/${course.slug}/gradebook`);
		const marked = page.getByRole('row', { name: new RegExp(STUDENT.name) });
		await expect(marked).toContainText('85%');
		await expect(marked).toContainText('B');

		// And the learner sees the same number, from the other endpoint. `85%` appears
		// twice — the course total and the row for the one assessment — so the
		// assertion names which.
		await learnerPage.goto(`/courses/${course.slug}/grades`);
		await expect(learnerPage.getByText('85%').first()).toBeVisible();
		await expect(learnerPage.getByText('17 of 20 points')).toBeVisible();
		await expect(learnerPage.getByText('B', { exact: true })).toBeVisible();

		await learner.close();
	});

	/**
	 * The scale the course grades by, and what its bands mean.
	 *
	 * The empty value is the built-in default, which is not a row and has no id. Its
	 * bands are shown so a marker can see what a percentage will be called before
	 * committing the course to a scale.
	 *
	 * Changing the scale is not tested here: there is no page that creates one yet,
	 * and a test that pointed a course at a scale it invented through the API would
	 * be testing the API. `internal/grade` covers that.
	 */
	test('shows which scale a course grades by, and its bands', async ({ page, request }) => {
		const course = await assignmentCourse(request, slug('scale'));

		await page.goto(`/teach/${course.slug}/gradebook`);

		await expect(page.getByLabel('Grading scale')).toHaveValue('');
		await expect(page.getByText('90%+')).toBeVisible();
		await expect(page.getByText('60%+')).toBeVisible();
	});
});

test.describe('a learner without marks', () => {
	test.use({ storageState: STUDENT_STATE });

	// Nothing marked is not a zero, and not an F. An absence has no band.
	test('is told nothing is graded, not that they failed', async ({ page, request }) => {
		const course = await assignmentCourse(request, slug('empty'));

		await page.goto(`/courses/${course.slug}/grades`);

		await expect(page.getByText('Not graded yet')).toBeVisible();
		await expect(page.getByText('F', { exact: true })).toHaveCount(0);
		await expect(page.getByRole('main')).not.toContainText('0%');
	});
});
