import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER_STATE } from './accounts';
import { quizCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

test.describe('content bank', () => {
	test.use({ storageState: OWNER_STATE });

	test('an author saves a question to the bank and adds it back to the quiz', async ({
		page,
		request
	}) => {
		const course = await quizCourse(request, slug('bank'));

		await page.goto(`/teach/${course.slug}/lessons/${course.lessonId}/quiz`);
		await ready(page);

		// The prompt is this course's own: the bank is workspace-wide and outlives the
		// run, so counting a fixed prompt would count every previous run's copies.
		const prompt = course.choicePrompt;

		// Save the first question to the bank under a category.
		const question = page.getByRole('listitem').filter({ hasText: prompt }).first();
		await question.getByLabel('Bank category').fill('Reuse');
		await question.getByRole('button', { name: 'Save to bank' }).click();

		// It appears in the bank section.
		const banked = page.getByRole('listitem').filter({ hasText: prompt });
		await expect(banked).toHaveCount(2); // once in the quiz, once in the bank

		// Add it back — the quiz now has a second copy of that question.
		await page
			.getByRole('listitem')
			.filter({ hasText: prompt })
			.filter({ has: page.getByRole('button', { name: 'Add to this quiz' }) })
			.getByRole('button', { name: 'Add to this quiz' })
			.click();

		await expect(page.getByText(prompt)).toHaveCount(3); // two in quiz, one in bank
	});
});
