import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER_STATE } from './accounts';
import { publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

test.describe('instructor analytics', () => {
	test.use({ storageState: OWNER_STATE });

	test('the teach page shows the at-a-glance summary', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('an'));

		await page.goto(`/teach/${course.slug}`);
		await ready(page);

		// The editor is four tools behind a tablist now, and the summary is one of them.
		await page.getByRole('tab', { name: /Insights/ }).click();

		await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
		await expect(page.getByText('Completion', { exact: true })).toBeVisible();

		// The enrollment mix is a donut with its legend beside it. A brand-new course has
		// nobody in it, so the ring is empty and says why rather than showing a zero and
		// leaving the instructor to guess.
		await expect(page.getByText('Nobody has enrolled yet.')).toBeVisible();

		// A brand-new course has no reviews yet.
		await expect(page.getByText('No reviews yet.')).toBeVisible();
	});
});
