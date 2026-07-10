import type { Page } from '@playwright/test';

/**
 * Waits until the page has its event handlers.
 *
 * Most of this app works before hydration: a form posts, a link navigates. The
 * exceptions are the controls that only exist in script — a file input's `change`
 * listener, a menu button's `onclick` — and they fail in the worst way. The event
 * fires into nothing, and the page looks exactly as it does when nobody clicked.
 *
 * No assertion catches that, because there is nothing to assert on: the button is
 * there, it is visible, it is enabled, and `aria-expanded` stays false. Both times
 * this bit, the symptom read as a broken component.
 *
 * The root layout stamps the document once Svelte has hydrated it. A person is
 * never fast enough for this to matter; Playwright always is.
 */
export async function ready(page: Page) {
	await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}
