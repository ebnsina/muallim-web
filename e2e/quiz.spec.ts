import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { OWNER_STATE, STUDENT, STUDENT_STATE } from './accounts';
import { quizCourse } from './course';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

/**
 * Waits for the worker to grade the attempt.
 *
 * The review page polls, so this is a wait on the DOM rather than on a request.
 * If it times out, grading did not happen: the worker is not running, or the job
 * was never enqueued.
 */
async function graded(page: Page) {
	await expect(page.getByText('Grading…', { exact: false })).toHaveCount(0, { timeout: 15_000 });
}

test.describe('taking a quiz', () => {
	test.use({ storageState: STUDENT_STATE });

	test('a learner answers, submits, waits for grading, and reads the result', async ({
		page,
		request
	}) => {
		const course = await quizCourse(request, slug('take'));

		await page.goto(`/courses/${course.slug}`);
		await page.getByRole('button', { name: 'Enrol', exact: true }).click();
		await expect(page.getByText('0 of 1 lessons')).toBeVisible();

		await page.goto(`/courses/${course.slug}/lessons/${course.lessonId}/quiz`);
		await expect(page.getByRole('heading', { name: 'Chapter one' })).toBeVisible();

		// The answers are not in the page. This is the invariant the whole assess
		// package exists to keep, asserted where a browser can see it.
		const body = (await page.content()).toLowerCase();
		expect(body).not.toContain('is_correct');
		expect(body).not.toContain('lutetia');
		expect(body).not.toContain('because it is');

		await page.getByRole('button', { name: 'Start the quiz' }).click();

		// One right, one wrong. 3 of 5 against a 60% bar is a pass.
		await page.getByRole('radio', { name: 'Go' }).check();
		await page.getByLabel('Roman name for Paris?').fill('Lyon');
		await page.getByRole('button', { name: 'Submit for grading' }).click();

		// Submitting lands on the review, which is still grading. That it says so at
		// all is the point: nothing was graded in the request that submitted.
		await expect(page.getByRole('heading', { name: 'Attempt 1' })).toBeVisible();
		await graded(page);

		await expect(page.getByText('3 of 5')).toBeVisible();
		await expect(page.getByText('Passed')).toBeVisible();

		// Now, and only now, the author's explanation.
		await expect(page.getByText('Because it is compiled.')).toBeVisible();

		// And the lesson is complete, because passing its quiz completes it.
		await page.goto(`/courses/${course.slug}`);
		await expect(page.getByText('1 of 1 lessons')).toBeVisible();
		await expect(page.getByText('100%')).toBeVisible();
	});

	test('an essay leaves the attempt waiting for a person', async ({ page, request }) => {
		const course = await quizCourse(request, slug('essay'), { essay: true });

		await page.goto(`/courses/${course.slug}`);
		await page.getByRole('button', { name: 'Enrol', exact: true }).click();
		await expect(page.getByText('0 of 1 lessons')).toBeVisible();

		await page.goto(`/courses/${course.slug}/lessons/${course.lessonId}/quiz`);
		await page.getByRole('button', { name: 'Start the quiz' }).click();

		await page.getByRole('radio', { name: 'Go' }).check();
		await page.getByLabel('Roman name for Paris?').fill('Lutetia');
		await page.getByLabel('Why?').fill('Because errors are values.');
		await page.getByRole('button', { name: 'Submit for grading' }).click();

		await graded(page);
		await expect(page.getByText('Waiting to be marked')).toBeVisible();

		// The machine's five points are in; the essay's are not, and there is no pass
		// to report while a person still has to look at it.
		await expect(page.getByText('5 of 15')).toBeVisible();
		await expect(page.getByText('Not marked', { exact: false })).toBeVisible();

		// And the lesson is not complete: the attempt has not passed anything yet.
		await page.goto(`/courses/${course.slug}`);
		await expect(page.getByText('0 of 1 lessons')).toBeVisible();
	});
});

test.describe('authoring and marking a quiz', () => {
	test.use({ storageState: OWNER_STATE });

	test('an author builds a quiz through the pages', async ({ page, request }) => {
		const course = await quizCourse(request, slug('build'), { withQuiz: false });

		await page.goto(`/teach/${course.slug}/lessons/${course.lessonId}/quiz`);
		await page.getByLabel('Title').fill('Built by hand');
		await page.getByRole('button', { name: 'Create the quiz' }).click();

		await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

		// A single-choice question with no correct option is one nobody can answer.
		// lms-api refuses it, and this page is where the author finds out.
		// `getByLabel('Option 1')` would also match the "is correct" checkbox beside
		// it, which shares the name. The role separates them.
		const option = (n: number) => page.getByRole('textbox', { name: `Option ${n}` });

		await page.getByLabel('Prompt').fill('Which is compiled?');
		await option(1).fill('Python');
		await option(2).fill('Go');
		await page.getByRole('button', { name: 'Add the question' }).click();
		await expect(page.getByRole('alert')).toContainText('exactly one correct option');

		await page.getByLabel('Prompt').fill('Which is compiled?');
		await option(1).fill('Python');
		await option(2).fill('Go');
		await page.getByRole('checkbox', { name: 'Option 2 is correct' }).check();
		await page.getByLabel('Explanation').fill('Go compiles to a native binary.');
		await page.getByRole('button', { name: 'Add the question' }).click();

		await expect(page.getByText('1. Which is compiled?')).toBeVisible();
		await expect(page.getByText('— correct')).toBeVisible();
	});

	test('an instructor marks an essay, and the score settles', async ({ page, request }) => {
		const course = await quizCourse(request, slug('mark'), { essay: true });
		await course.studentAttempt(request);

		await page.goto(`/teach/${course.slug}/lessons/${course.lessonId}/quiz/submissions`);
		await expect(page.getByText(STUDENT.email)).toBeVisible();

		await page.getByRole('link', { name: 'Mark 1 answer' }).click();
		await expect(page.getByText('Because errors are values.')).toBeVisible();

		// The machine-graded questions carry no form. Its verdict is not the
		// instructor's to overturn.
		await expect(page.getByText('graded automatically')).toHaveCount(2);

		await page.getByLabel('Points').fill('8');
		await page.getByLabel('Feedback').fill('Right, but you never mention panic.');
		await page.getByRole('button', { name: 'Record the mark' }).click();

		await expect(page.getByText('13 of 15')).toBeVisible();
		await expect(page.getByText('passed')).toBeVisible();

		// The queue is empty, and marking the last essay settled the grade for good.
		await page.goto(`/teach/${course.slug}/lessons/${course.lessonId}/quiz/submissions`);
		// The queue's empty state, as `EmptyState` renders it — a title with no full
		// stop, like every other one in the system.
		await expect(page.getByText('Nothing is waiting to be marked')).toBeVisible();
	});
});
