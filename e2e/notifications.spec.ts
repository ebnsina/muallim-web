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

test.describe('notifications', () => {
	test.use({ storageState: STUDENT_STATE });

	test('answering a question notifies the asker', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('notif'));
		const question = `Stuck on step two ${randomUUID().slice(0, 6)}?`;

		// The student asks through the browser, on the preview lesson (readable to all).
		await page.goto(`/courses/${course.slug}/lessons/${course.previewLessonId}`);
		await ready(page);
		await page.getByLabel('Ask a question').fill(question);
		await page.getByRole('button', { name: 'Ask', exact: true }).click();
		await expect(page.getByText(question)).toBeVisible();

		// The owner finds that question and answers it, over the API.
		const auth = await ownerAuth(request);
		const listed = await request.get(`/api/v1/lessons/${course.previewLessonId}/questions`, {
			headers: auth
		});
		const questions = (await listed.json()).questions as { id: string; body: string }[];
		const mine = questions.find((q) => q.body === question);
		expect(mine, 'the owner should see the student question').toBeTruthy();

		const answered = await request.post(`/api/v1/lesson-questions/${mine!.id}/answers`, {
			headers: auth,
			data: { body: 'Re-read the definition in the first paragraph.' }
		});
		expect(answered.ok(), `answer: ${answered.status()} ${await answered.text()}`).toBe(true);

		// The student sees the bell badge and the notification.
		await page.goto('/dashboard');
		await ready(page);
		await expect(page.getByLabel(/Notifications, \d+ unread/)).toBeVisible();

		await page.goto('/notifications');
		await expect(page.getByText('New answer to your question')).toBeVisible();

		// Opening it marks it read (asserted at the domain level) and follows the
		// link to the lesson.
		await page.getByRole('button', { name: /New answer to your question/ }).click();
		await expect(page).toHaveURL(new RegExp(`/courses/${course.slug}/lessons/`));
	});

	test('the email digest can be turned off and stays off', async ({ page }) => {
		await page.goto('/notifications');
		await ready(page);

		const digest = page.getByLabel('Email me a daily digest of unread notifications');
		await expect(digest).toBeChecked(); // on by default

		await digest.uncheck();
		// The change submits and reloads; it must come back off.
		await expect(
			page.getByLabel('Email me a daily digest of unread notifications')
		).not.toBeChecked();
		await page.reload();
		await expect(
			page.getByLabel('Email me a daily digest of unread notifications')
		).not.toBeChecked();

		// Put it back, so the account is left as it was found.
		await page.getByLabel('Email me a daily digest of unread notifications').check();
		await expect(page.getByLabel('Email me a daily digest of unread notifications')).toBeChecked();
	});
});
