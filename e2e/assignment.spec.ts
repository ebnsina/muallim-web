import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { OWNER_STATE, STUDENT_STATE } from './accounts';
import { assignmentCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

/**
 * A file to upload, made here rather than committed.
 *
 * `setInputFiles` takes a buffer, so nothing touches the disk and the size is
 * whatever the test says it is — which is the number the presigned URL is signed
 * against.
 */
/**
 * The attached file, in the list — not in the toast that says it attached.
 *
 * `getByText('essay.txt')` matches both, and a toast that has not faded yet
 * would satisfy an assertion about a row that was never drawn.
 */
const attached = (page: Page, filename: string) =>
	page.getByRole('main').getByTitle(filename, { exact: true });

const essay = (bytes = 32) => ({
	name: 'essay.txt',
	mimeType: 'text/plain',
	buffer: Buffer.alloc(bytes, 'a')
});

test.describe('handing in an assignment', () => {
	test.use({ storageState: STUDENT_STATE });

	/**
	 * The whole of it, through a browser.
	 *
	 * This is the only test that exercises the leg nothing else can: the browser
	 * PUTs the bytes straight to the object store, on another origin, with a URL
	 * this server signed and headers it cannot set. If MinIO's CORS is wrong, or
	 * `Content-Length` is no longer supplied by the browser at the value that was
	 * signed, this is where it shows.
	 */
	test('a learner uploads a file, hands it in, and cannot change it afterwards', async ({
		page,
		request
	}) => {
		const course = await assignmentCourse(request, slug('hand-in'));

		await page.goto(`/courses/${course.slug}/lessons/${course.lessonId}/assignment`);
		await expect(page.getByRole('heading', { name: 'Essay: the House of Wisdom' })).toBeVisible();
		await expect(page.getByText('Nothing attached yet')).toBeVisible();

		await ready(page);
		await page.getByLabel('Add files').setInputFiles(essay());

		// The row appears only after lms-api has asked the store what is really at
		// that key. Its size is the store's answer, not the browser's claim.
		await expect(attached(page, 'essay.txt')).toBeVisible();
		await expect(page.getByRole('main').getByText('32 B')).toBeVisible();

		await page.getByRole('button', { name: 'Hand in' }).click();

		await expect(page.getByRole('status')).toContainText('waiting to be marked');
		await expect(page.getByRole('button', { name: 'Hand in' })).toHaveCount(0);
		await expect(page.getByLabel(/^Remove/)).toHaveCount(0);
	});

	/**
	 * The size limit is enforced by the signature, but a learner should not have to
	 * watch a doomed upload finish to be told so.
	 */
	test('a file over the limit is refused before it is uploaded', async ({ page, request }) => {
		const course = await assignmentCourse(request, slug('too-big'), { max_bytes: 1024 });

		await page.goto(`/courses/${course.slug}/lessons/${course.lessonId}/assignment`);
		await ready(page);
		await page.getByLabel('Add files').setInputFiles(essay(2048));

		// The refusal is a toast, and it names both numbers: what was chosen, and
		// what is allowed. Nothing left the browser — no presign, no PUT.
		await expect(page.getByText('essay.txt is 2.0 KB. The limit is 1.0 KB.')).toBeVisible();
		await expect(page.getByText('Nothing attached yet')).toBeVisible();
	});

	test('a draft can lose a file again', async ({ page, request }) => {
		const course = await assignmentCourse(request, slug('remove'));

		await page.goto(`/courses/${course.slug}/lessons/${course.lessonId}/assignment`);
		await ready(page);
		await page.getByLabel('Add files').setInputFiles(essay());
		await expect(attached(page, 'essay.txt')).toBeVisible();

		await page.getByLabel('Remove essay.txt').click();
		await expect(page.getByText('Nothing attached yet')).toBeVisible();
	});
});

test.describe('marking an assignment', () => {
	test.use({ storageState: OWNER_STATE });

	/**
	 * A grade at or above the pass mark completes the lesson, in the transaction
	 * that recorded it. The learner's page is where that is visible.
	 */
	test('a marker grades what was handed in, and the queue empties', async ({
		page,
		browser,
		request
	}) => {
		const course = await assignmentCourse(request, slug('mark'));

		// The learner hands in, in their own context. Marking is the part under test.
		const learner = await browser.newContext({ storageState: STUDENT_STATE });
		const learnerPage = await learner.newPage();
		await learnerPage.goto(`/courses/${course.slug}/lessons/${course.lessonId}/assignment`);
		await ready(learnerPage);
		await learnerPage.getByLabel('Add files').setInputFiles(essay());
		await expect(attached(learnerPage, 'essay.txt')).toBeVisible();
		await learnerPage.getByRole('button', { name: 'Hand in' }).click();
		await expect(learnerPage.getByRole('status')).toContainText('waiting to be marked');

		await page.goto(`/teach/${course.slug}/lessons/${course.lessonId}/assignment/submissions`);
		await page.getByRole('link', { name: /E2E Student/ }).click();

		await expect(page.getByRole('heading', { name: 'Essay: the House of Wisdom' })).toBeVisible();
		await page.getByLabel('Grade').fill('80');
		await expect(page.getByText('Passes')).toBeVisible();

		await page.getByLabel('Feedback').fill('Clear and well argued.');
		await page.getByRole('button', { name: 'Record grade' }).click();

		// Back on the queue, with nothing left waiting.
		await expect(page.getByText('Nothing is waiting to be marked')).toBeVisible();

		// And the learner sees the grade and the feedback.
		await learnerPage.reload();
		await expect(learnerPage.getByText('Clear and well argued.')).toBeVisible();
		await expect(learnerPage.getByRole('main')).toContainText('80');

		await learner.close();
	});

	/**
	 * A deadline can be taken off again.
	 *
	 * `due_at: null` is the only way to say it, and for a while there was no way at
	 * all: the schema typed the field as a string, `merge` ignored it, and the
	 * repository's COALESCE could not have written a NULL if the other two had let
	 * it through.
	 */
	test('an author sets a deadline and then removes it', async ({ page, request }) => {
		const course = await assignmentCourse(request, slug('deadline'), {
			due_at: '2027-01-01T00:00:00Z'
		});

		await page.goto(`/teach/${course.slug}/lessons/${course.lessonId}/assignment`);
		await expect(page.getByLabel('Deadline', { exact: true })).not.toHaveValue('');

		await page.getByLabel('Deadline', { exact: true }).fill('');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByRole('status')).toContainText('Saved');

		await page.reload();
		await expect(page.getByLabel('Deadline', { exact: true })).toHaveValue('');
	});
});
