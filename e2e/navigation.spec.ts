import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER, OWNER_STATE, STUDENT, STUDENT_STATE } from './accounts';
import { publishedCourse } from './course';
import { ready } from './hydration';

const slug = (name: string) =>
	`${name}-${process.env.E2E_RUN_ID ?? 'local'}-${randomUUID().slice(0, 8)}`;

/**
 * Every page a signed-in person can reach draws the same header.
 *
 * It used to be mounted by hand on `/dashboard` and nowhere else, so every other
 * page was reachable only by typing its URL. A route group means one layout
 * decides, and a page cannot forget.
 */
test.describe('the signed-in header', () => {
	test.use({ storageState: OWNER_STATE });

	test('follows an author from the dashboard down to a lesson', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('nav'));

		for (const path of [
			'/dashboard',
			'/courses',
			'/teach',
			`/courses/${course.slug}`,
			`/courses/${course.slug}/lessons/${course.previewLessonId}`,
			`/teach/${course.slug}`
		]) {
			await page.goto(path);

			await expect(page.getByRole('navigation', { name: 'Main' }), path).toBeVisible();
			await expect(page.getByRole('button', { name: 'Sign out' }), path).toBeVisible();
			await expect(page.getByText(OWNER.name), path).toBeVisible();
		}
	});

	test('marks where you are', async ({ page }) => {
		await page.goto('/courses');

		const nav = page.getByRole('navigation', { name: 'Main' });
		await expect(nav.getByRole('link', { name: 'Courses' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		await expect(nav.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
			'aria-current',
			'page'
		);
	});

	/**
	 * A nested page lights up the section it belongs to. `startsWith` on a trailing
	 * slash, so `/teaching` would not light up `/teach`.
	 */
	test('marks the section a nested page belongs to', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('nested'));
		await page.goto(`/teach/${course.slug}`);

		await expect(
			page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Teach' })
		).toHaveAttribute('aria-current', 'page');
	});

	/**
	 * Sign out from wherever you are.
	 *
	 * The form used to post to `/dashboard?/logout`, which worked on the one page
	 * that drew it. From a lesson it would have signed you out by way of a dashboard
	 * you never asked for.
	 */
	test('signs out from a lesson, and lands on the landing page', async ({ page, request }) => {
		const course = await publishedCourse(request, slug('signout'));

		await page.goto(`/courses/${course.slug}/lessons/${course.previewLessonId}`);
		await page.getByRole('button', { name: 'Sign out' }).click();

		await expect(page).toHaveURL('/');
		await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
	});
});

test.describe('what the header offers', () => {
	test.use({ storageState: STUDENT_STATE });

	// A courtesy, not a control: lms-api refuses a student who types the URL. But a
	// link to a page that answers 403 is a link nobody should be shown.
	test('a student is not shown Teach', async ({ page }) => {
		await page.goto('/courses');

		const nav = page.getByRole('navigation', { name: 'Main' });
		await expect(nav.getByRole('link', { name: 'Courses' })).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Teach' })).toHaveCount(0);
	});
});

test.describe('a stranger', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	/**
	 * The catalogue is readable without a session — that is what a published course
	 * is for — so the layout offers a way in rather than redirecting.
	 */
	test('browses the catalogue and is offered a way in', async ({ page }) => {
		await page.goto('/courses');

		await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
		await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
		await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
	});
});

test.describe('the menu on a small screen', () => {
	test.use({ storageState: STUDENT_STATE, viewport: { width: 390, height: 844 } });

	test('opens, navigates, and closes behind itself', async ({ page }) => {
		await page.goto('/dashboard');
		await ready(page);

		// The links are not reachable until it is opened.
		await expect(page.getByRole('link', { name: 'Courses' })).toHaveCount(0);

		const toggle = page.getByRole('button', { name: 'Open menu' });
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await toggle.click();

		await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		// Scoped to the panel: the dashboard prints the same address in its own body.
		const panel = page.locator('#mobile-nav');
		await expect(panel.getByText(STUDENT.email)).toBeVisible();

		await panel.getByRole('link', { name: 'Courses' }).click();
		await expect(page).toHaveURL('/courses');

		// Navigating closes it. Left open, it covers the page it just took you to.
		await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Courses' })).toHaveCount(0);
	});
});
