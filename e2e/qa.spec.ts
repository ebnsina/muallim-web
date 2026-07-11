import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER_STATE } from './accounts';
import { publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

test.describe('lesson discussion', () => {
	test.use({ storageState: OWNER_STATE });

	test('an author asks, answers with an instructor badge, then removes it', async ({
		page,
		request
	}) => {
		const course = await publishedCourse(request, slug('qa'));
		const question = `How does this work ${randomUUID().slice(0, 6)}?`;
		const answer = `It works like this ${randomUUID().slice(0, 6)}.`;

		// The preview lesson is readable, so its discussion is open.
		await page.goto(`/courses/${course.slug}/lessons/${course.previewLessonId}`);
		await ready(page);

		await page.getByLabel('Ask a question').fill(question);
		await page.getByRole('button', { name: 'Ask', exact: true }).click();
		await expect(page.getByText(question)).toBeVisible();

		// Answer it — the owner can author, so the answer is badged.
		await page.getByRole('button', { name: 'Answer', exact: true }).click();
		await page.getByLabel('Write an answer').fill(answer);
		await page.getByRole('button', { name: 'Post answer' }).click();
		await expect(page.getByText(answer)).toBeVisible();
		await expect(page.getByText('Instructor')).toBeVisible();

		// Removing the question takes its answer with it.
		await page.getByRole('button', { name: 'Remove this question' }).click();
		await expect(page.getByText(question)).toHaveCount(0);
		await expect(page.getByText(answer)).toHaveCount(0);
		await expect(page.getByText('No questions yet.')).toBeVisible();
	});
});
