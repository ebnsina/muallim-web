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

	test('a highlighted passage is annotated, listed, and removed', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('hl'));
		await page.goto(`/courses/${course.slug}/lessons/${course.previewLessonId}`);
		await ready(page);

		// Select the lesson text; the add pill appears over the selection.
		await page.getByText('The body of A free preview.').selectText();
		await page.getByRole('button', { name: 'Add note' }).click();

		// The passage joins the list, where its note is written and saved on blur.
		await expect(page.getByRole('heading', { name: 'Highlighted passages' })).toBeVisible();
		const note = page.getByLabel('Note on this passage');
		await note.fill('Worth remembering.');
		await note.blur();

		// It survives a reload — mark, quote, and note all read back from the server.
		// The quote now appears twice (in the marked text and in the list), which is
		// the mark doing its job; the note is the unambiguous thing to assert on.
		await page.reload();
		await expect(page.getByRole('heading', { name: 'Highlighted passages' })).toBeVisible();
		await expect(page.getByLabel('Note on this passage')).toHaveValue('Worth remembering.');

		// Removing it takes the passage out of the list.
		await page.getByRole('button', { name: 'Remove this highlight' }).click();
		await expect(page.getByRole('heading', { name: 'Highlighted passages' })).toHaveCount(0);
	});
});
