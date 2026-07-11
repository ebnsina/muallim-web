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

		await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
		await expect(page.getByText('Enrolments', { exact: true })).toBeVisible();
		await expect(page.getByText('Completion', { exact: true })).toBeVisible();
		// A brand-new course has no reviews yet.
		await expect(page.getByText('No reviews yet.')).toBeVisible();
	});
});
