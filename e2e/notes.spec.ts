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

		// Nothing typed is nothing to save.
		await expect(page.getByRole('button', { name: 'Save note' })).toBeDisabled();

		// Written and saved, it comes back after a full reload — it was read from the
		// server, not kept in the page. The outcome is a toast.
		const note = `Remember this: ${randomUUID().slice(0, 8)}`;
		await box.fill(note);
		await page.getByRole('button', { name: 'Save note' }).click();
		await expect(page.getByText('Note saved.')).toBeVisible();

		await page.reload();
		await expect(page.getByLabel('Your notes on this lesson')).toHaveValue(note);

		// Emptied and saved, it is gone the same way — a cleared note and one never
		// written are the same thing. Emptying a saved note is a change, so the button
		// offers to make it.
		await page.getByLabel('Your notes on this lesson').fill('');
		await page.getByRole('button', { name: 'Clear note' }).click();
		await expect(page.getByText('Note cleared.')).toBeVisible();

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

		// The passage joins the list under its own tab, where its note is written and
		// saved on blur. The save is awaited rather than assumed: blur fires it and
		// does not wait for it, so reloading on the next line would race it.
		await page.getByRole('tab', { name: /Highlights/ }).click();
		const note = page.getByLabel('Note on this passage');
		await note.fill('Worth remembering.');

		const saved = page.waitForResponse((r) => r.url().includes('editHighlight'));
		await note.blur();
		await saved;

		// It survives a reload — mark, quote, and note all read back from the server.
		// The quote now appears twice (in the marked text and in the list), which is
		// the mark doing its job; the note is the unambiguous thing to assert on.
		await page.reload();
		await page.getByRole('tab', { name: /Highlights/ }).click();
		await expect(page.getByLabel('Note on this passage')).toHaveValue('Worth remembering.');

		// Removing it takes the passage out of the list.
		await page.getByRole('button', { name: 'Remove this highlight' }).click();
		await expect(page.getByLabel('Note on this passage')).toHaveCount(0);
	});

	test('the revision page gathers a note and a highlight under their lesson', async ({
		page,
		request
	}) => {
		const course = await publishedCourse(request, slug('rev'));
		await page.goto(`/courses/${course.slug}/lessons/${course.previewLessonId}`);
		await ready(page);

		// A whole-lesson note…
		await page.getByLabel('Your notes on this lesson').fill('Revise the method.');
		await page.getByRole('button', { name: 'Save note' }).click();
		await expect(page.getByText('Note saved.')).toBeVisible();

		// …and a highlight with its own remark.
		await page.getByText('The body of A free preview.').selectText();
		await page.getByRole('button', { name: 'Add note' }).click();
		await page.getByRole('tab', { name: /Highlights/ }).click();
		const passageNote = page.getByLabel('Note on this passage');
		await passageNote.fill('Key line.');
		await passageNote.blur();

		// Both turn up on the course's revision page, under the lesson.
		await page.goto(`/courses/${course.slug}/notes`);
		await expect(page.getByRole('heading', { name: 'Your notes' })).toBeVisible();
		await expect(page.getByRole('link', { name: /A free preview/ })).toBeVisible();
		await expect(page.getByText('Revise the method.')).toBeVisible();
		await expect(page.getByText('Key line.')).toBeVisible();
	});
});
