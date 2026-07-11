import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { STUDENT_STATE } from './accounts';
import { publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

test.describe("a learner's private lesson note", () => {
	test.use({ storageState: STUDENT_STATE });

	test('is saved, survives a reload, and clears when emptied', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('notes'));
		const url = `/courses/${course.slug}/lessons/${course.previewLessonId}`;

		await page.goto(url);
		await ready(page);

		const box = page.getByLabel('Your notes on this lesson');
		await expect(box).toHaveValue('');

		// Written and saved, it comes back after a full reload — it was read from the
		// server, not kept in the page.
		const note = `Remember this: ${randomUUID().slice(0, 8)}`;
		await box.fill(note);
		await page.getByRole('button', { name: 'Save note' }).click();
		await expect(page.getByText('Saved.')).toBeVisible();

		await page.reload();
		await expect(page.getByLabel('Your notes on this lesson')).toHaveValue(note);

		// Emptied and saved, it is gone the same way — a cleared note and one never
		// written are the same thing.
		await page.getByLabel('Your notes on this lesson').fill('');
		await page.getByRole('button', { name: 'Save note' }).click();
		await expect(page.getByText('Saved.')).toBeVisible();

		await page.reload();
		await expect(page.getByLabel('Your notes on this lesson')).toHaveValue('');
	});
});
