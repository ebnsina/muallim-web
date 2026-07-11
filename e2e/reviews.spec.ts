import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER_STATE } from './accounts';
import { publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

test.describe('course reviews', () => {
	test.use({ storageState: OWNER_STATE });

	test('an enrolled learner rates a course, it shows on the wall, then is removed', async ({
		page,
		request
	}) => {
		const course = await publishedCourse(request, slug('rev'));
		const body = `Genuinely useful ${randomUUID().slice(0, 6)}`;

		// You must be enrolled to review, so enrol first from the course page.
		await page.goto(`/courses/${course.slug}`);
		await ready(page);
		await page.getByRole('button', { name: 'Enrol', exact: true }).click();

		// The review form appears for an enrolled learner.
		await page.getByTitle('4 of 5').click();
		await page.getByPlaceholder('What would you tell someone').fill(body);
		await page.getByRole('button', { name: 'Post review' }).click();

		// It lands on the wall (a paragraph, distinct from the prefilled textarea).
		const onWall = page.getByRole('paragraph').filter({ hasText: body });
		await expect(onWall).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();

		// Reloading proves it persisted, and the form now offers to update or remove.
		await page.goto(`/courses/${course.slug}`);
		await expect(page.getByRole('paragraph').filter({ hasText: body })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Update review' })).toBeVisible();

		await page.getByRole('button', { name: 'Remove' }).click();
		await expect(page.getByRole('paragraph').filter({ hasText: body })).toHaveCount(0);
	});
});
