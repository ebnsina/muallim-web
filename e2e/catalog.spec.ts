import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { STUDENT_STATE } from './accounts';
import { publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

test.describe('the catalogue', () => {
	test.use({ storageState: STUDENT_STATE });

	test('searches by title, and says so when nothing matches', async ({ page, request }) => {
		const marker = slug('findme');
		await publishedCourse(request, marker); // titled "Course <marker>"

		await page.goto('/courses');
		await ready(page);

		// The whole catalogue is here; a search narrows it to the one course.
		await page.getByPlaceholder('Search by title…').fill(marker);
		await page.getByRole('button', { name: 'Search', exact: true }).click();
		await expect(page.getByText(`Course ${marker}`)).toBeVisible();

		// The search rides in the URL, so it survives a reload.
		await expect(page).toHaveURL(new RegExp(`q=${marker}`));
		await page.reload();
		await expect(page.getByText(`Course ${marker}`)).toBeVisible();

		// A search nothing matches is a stated empty, not a blank page.
		await page.goto('/courses?q=zzz-no-such-course-zzz');
		await expect(page.getByText('No courses match')).toBeVisible();
	});
});
