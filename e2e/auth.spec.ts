import { expect, test } from '@playwright/test';
import { OWNER } from './accounts';
import { ready } from './hydration';

test.use({ storageState: { cookies: [], origins: [] } });

test('a wrong password is refused, and the address survives the failed submit', async ({
	page
}) => {
	await page.goto('/login');
	await page.getByLabel('Email').fill(OWNER.email);
	await page.getByLabel('Password').fill('not-the-right-password');
	await page.getByRole('button', { name: 'Sign in' }).click();

	await expect(page.getByRole('alert')).toContainText('Those credentials are not valid.');
	await expect(page.getByLabel('Email')).toHaveValue(OWNER.email);
});

/**
 * The email is echoed back so the field survives a failed submit; the password
 * never is. Asserting on the input's DOM value would prove nothing — the browser
 * keeps whatever was typed, and should. What matters is that the server does not
 * put the password in the page it renders, where it would reach a proxy, a cache,
 * or a screenshot.
 */
test('a rejected password is never rendered back into the page', async ({ request }) => {
	const password = 'a-password-that-must-not-be-echoed';

	const response = await request.post('/login', {
		headers: { Accept: 'text/html' },
		form: { email: OWNER.email, password },
		maxRedirects: 0
	});

	expect(response.status()).toBe(401);

	const html = await response.text();
	expect(html).toContain(OWNER.email);
	expect(html).not.toContain(password);
});

/**
 * muallim-api answers 202 whether or not the address belongs to a member here, and
 * this page must not undo that by rendering two different outcomes. If it did,
 * a stranger could read off which addresses belong to the workspace — on a
 * school's, that is a roster.
 */
test('forgot-password says the same thing about a real address and an unknown one', async ({
	page
}) => {
	const confirmations: string[] = [];

	for (const email of [OWNER.email, 'nobody-at-all@example.test']) {
		await page.goto('/forgot-password');
		await page.getByLabel('Email').fill(email);
		await page.getByRole('button', { name: 'Send reset link' }).click();

		const status = page.getByRole('status');
		await expect(status).toBeVisible();
		confirmations.push((await status.textContent())?.trim() ?? '');
	}

	expect(confirmations[0]).toBe(confirmations[1]);
	expect(confirmations[0]).toContain('If that address belongs to an account here');
});

test('signing in and out', async ({ page }) => {
	await page.goto('/login');
	await page.getByLabel('Email').fill(OWNER.email);
	await page.getByLabel('Password').fill(OWNER.password);
	await page.getByRole('button', { name: 'Sign in' }).click();

	await expect(page).toHaveURL('/dashboard');

	// The dashboard greets by first name, so the email is what identifies whose
	// session this is. Asserting on the greeting alone would pass for anyone whose
	// name happens to start the same way.
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');
	await expect(page.getByText(OWNER.email)).toBeVisible();

	await ready(page);
	await page.getByRole('button', { name: 'Account' }).click();
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page).toHaveURL('/');

	// The session is gone, not merely hidden.
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/login/);
});

test('a post-login redirect cannot be pointed off-site', async ({ page }) => {
	await page.goto('/login?next=//evil.test');
	await page.getByLabel('Email').fill(OWNER.email);
	await page.getByLabel('Password').fill(OWNER.password);
	await page.getByRole('button', { name: 'Sign in' }).click();

	await expect(page).toHaveURL('/dashboard');
});
