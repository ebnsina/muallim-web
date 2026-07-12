import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { OWNER, OWNER_STATE, STUDENT, STUDENT_STATE } from './accounts';
import { publishedCourse, quizCourse } from './course';
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
			await expect(page.getByRole('button', { name: 'Account' }), path).toBeVisible();
		}

		// Whose session this is, and the way out of it, live behind the avatar now.
		await ready(page);
		await page.getByRole('button', { name: 'Account' }).click();
		const account = page.getByRole('menu', { name: 'Account' });
		await expect(account.getByText(OWNER.name)).toBeVisible();
		await expect(account.getByRole('button', { name: 'Sign out' })).toBeVisible();
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
		await ready(page);
		await page.getByRole('button', { name: 'Account' }).click();
		await page.getByRole('button', { name: 'Sign out' }).click();

		await expect(page).toHaveURL('/');
		await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
	});
});

test.describe('what the header offers', () => {
	test.use({ storageState: STUDENT_STATE });

	// A courtesy, not a control: muallim-api refuses a student who types the URL. But a
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

/**
 * A trail, not a back button.
 *
 * Every nested page used to carry one link — "Back to the quiz" — which says
 * where the button goes and not where you are. A learner four levels into a
 * course could not name the course they were in.
 */
test.describe('breadcrumbs', () => {
	test.use({ storageState: STUDENT_STATE });

	/**
	 * Enrol, then open the quiz.
	 *
	 * The lesson a quiz hangs off is gated, and muallim-api answers 404 to a learner who
	 * may not read it — not 403, because admitting it exists would leak it. A test
	 * that skipped this would be testing the error page.
	 */
	async function enrolled(page: Page, slug: string) {
		await page.goto(`/courses/${slug}`);
		await page.getByRole('button', { name: 'Enrol', exact: true }).click();
		await expect(page.getByText('Your progress')).toBeVisible();
	}

	test('name every level above the page you are on', async ({ page, request }) => {
		const course = await quizCourse(request, slug('crumbs'));
		await enrolled(page, course.slug);

		await page.goto(`/courses/${course.slug}/lessons/${course.lessonId}/quiz`);

		const trail = page.getByRole('navigation', { name: 'Breadcrumb' });
		await expect(trail).toBeVisible();

		// Courses › <course> › <lesson> › Quiz
		await expect(trail.getByRole('link', { name: 'Courses' })).toBeVisible();
		await expect(trail.getByRole('link', { name: `Course ${course.slug}` })).toBeVisible();
		await expect(trail.getByRole('link', { name: 'The quiz' })).toBeVisible();
		await expect(trail.getByText('Quiz', { exact: true })).toBeVisible();
	});

	/**
	 * The page you are on is not a link. A link to here does nothing, and announces
	 * itself to a screen reader as somewhere else to go.
	 */
	test('mark the current page, and do not link it', async ({ page, request }) => {
		const course = await quizCourse(request, slug('current'));
		await enrolled(page, course.slug);
		await page.goto(`/courses/${course.slug}/lessons/${course.lessonId}/quiz`);

		const trail = page.getByRole('navigation', { name: 'Breadcrumb' });
		const current = trail.locator('[aria-current="page"]');

		await expect(current).toHaveText('Quiz');
		await expect(trail.getByRole('link', { name: 'Quiz', exact: true })).toHaveCount(0);
	});

	test('climb back to the course', async ({ page, request }) => {
		const course = await quizCourse(request, slug('climb'));
		await enrolled(page, course.slug);
		await page.goto(`/courses/${course.slug}/lessons/${course.lessonId}/quiz`);

		await page
			.getByRole('navigation', { name: 'Breadcrumb' })
			.getByRole('link', { name: `Course ${course.slug}` })
			.click();

		await expect(page).toHaveURL(`/courses/${course.slug}`);
		await expect(page.getByRole('heading', { name: `Course ${course.slug}` })).toBeVisible();
	});
});
