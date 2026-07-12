import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { STUDENT_STATE } from './accounts';
import { ownerToken, publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

async function ownerAuth(request: APIRequestContext) {
	return { Authorization: `Bearer ${await ownerToken(request)}` };
}

test.describe('announcement fan-out', () => {
	test.use({ storageState: STUDENT_STATE });

	test('posting an announcement notifies an enrolled learner', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('fanout'));
		const headline = `Exam moved ${randomUUID().slice(0, 6)}`;

		// The student enrolls through the browser (its session is the student's).
		await page.goto(`/courses/${course.slug}`);
		await ready(page);
		await page.getByRole('button', { name: 'Enroll', exact: true }).click();
		await expect(page.getByText('Your progress')).toBeVisible();

		// The owner posts an announcement over the API.
		const auth = await ownerAuth(request);
		const posted = await request.post(`/api/v1/courses/${course.slug}/announcements`, {
			headers: auth,
			data: { title: headline, body: 'It has moved to next Friday.' }
		});
		expect(posted.ok(), `post: ${posted.status()} ${await posted.text()}`).toBe(true);

		// The fan-out is a background job, so the bell fills a moment later. Reload
		// the notifications page until it arrives.
		await expect(async () => {
			await page.goto('/notifications');
			await expect(page.getByText(headline)).toBeVisible({ timeout: 1000 });
		}).toPass({ timeout: 20_000 });
	});
});
