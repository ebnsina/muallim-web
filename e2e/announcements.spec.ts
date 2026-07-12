import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER_STATE } from './accounts';
import { publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

test.describe('course announcements', () => {
	test.use({ storageState: OWNER_STATE });

	test('an instructor posts one, it shows on the course, and can be removed', async ({
		page,
		request
	}) => {
		const course = await publishedCourse(request, slug('ann'));
		const headline = `Exam moved ${randomUUID().slice(0, 6)}`;

		// Posted from the course editor…
		await page.goto(`/teach/${course.slug}`);
		await ready(page);
		await page.getByLabel('Title', { exact: true }).fill(headline);
		await page.getByLabel('Message').fill('The exam is next Friday.');
		await page.getByRole('button', { name: 'Post announcement' }).click();
		await expect(page.getByText(headline)).toBeVisible();

		// …it appears on the course page a learner reads. The headline is the row; the
		// body is behind it, so a notice costs a line until somebody wants it.
		await page.goto(`/courses/${course.slug}`);
		await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible();
		await expect(page.getByText(headline)).toBeVisible();
		await page.getByRole('button', { name: headline }).click();
		await expect(page.getByText('The exam is next Friday.')).toBeVisible();

		// Removing it takes it off both.
		await page.goto(`/teach/${course.slug}`);
		await page
			.getByRole('listitem')
			.filter({ hasText: headline })
			.getByRole('button', { name: 'Remove' })
			.click();
		await expect(page.getByText(headline)).toHaveCount(0);

		await page.goto(`/courses/${course.slug}`);
		await expect(page.getByRole('heading', { name: 'Announcements' })).toHaveCount(0);
	});
});
