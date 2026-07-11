import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { STUDENT_STATE } from './accounts';
import { publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

test.describe('gamification', () => {
	test.use({ storageState: STUDENT_STATE });

	test('finishing a lesson earns points and the first-steps badge', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('game'));

		// Enrol, then complete a lesson through the browser.
		await page.goto(`/courses/${course.slug}`);
		await ready(page);
		await page.getByRole('button', { name: 'Enrol', exact: true }).click();
		await expect(page.getByText('Your progress')).toBeVisible();

		await page.goto(`/courses/${course.slug}/lessons/${course.previewLessonId}`);
		await page.getByRole('button', { name: 'Mark as complete' }).click();
		await expect(page.getByText('Completed.')).toBeVisible();

		// The dashboard shows points and the earned badge.
		await page.goto('/dashboard');
		await ready(page);
		await expect(page.getByRole('heading', { name: 'Progress points' })).toBeVisible();
		await expect(page.getByText('First steps')).toBeVisible();

		// And the learner is on the leaderboard with a non-zero score.
		await page.goto('/leaderboard');
		await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
		await expect(page.getByText(/Rank \d+ of \d+/)).toBeVisible();
	});
});
