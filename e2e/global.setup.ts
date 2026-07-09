import { expect, test as setup, type APIRequestContext } from '@playwright/test';
import { OWNER, OWNER_STATE, STUDENT, STUDENT_STATE, tokenOf, waitForLink } from './accounts';

/**
 * Signs the owner in against lms-api, registering them if the workspace is still
 * unclaimed, and returns a bearer token.
 *
 * Registration claims an unclaimed workspace and nothing else, so this succeeds
 * once against a fresh `lms_test` and signs in on every run after. The API is
 * reached at `/api` on this app's origin, exactly as the app reaches it, so the
 * Host header names the workspace.
 */
async function ownerToken(request: APIRequestContext): Promise<string> {
	const credentials = { email: OWNER.email, password: OWNER.password };

	let response = await request.post('/api/v1/auth/login', { data: credentials });

	if (response.status() === 401) {
		response = await request.post('/api/v1/auth/register', {
			data: { ...credentials, name: OWNER.name }
		});
	}

	expect(
		response.ok(),
		'could not sign in as the owner, nor register one — the workspace is claimed by ' +
			'somebody else. Recreate it with: make migrate && make seed'
	).toBe(true);

	const { tokens } = await response.json();
	return tokens.access_token;
}

setup('provision the owner', async ({ page, request }) => {
	await ownerToken(request);

	// Signed in through the browser, so the cookies saved are the ones a browser
	// holds: httpOnly, and set by this app rather than by lms-api.
	await page.goto('/login');
	await page.getByLabel('Email').fill(OWNER.email);
	await page.getByLabel('Password').fill(OWNER.password);
	await page.getByRole('button', { name: 'Sign in' }).click();

	await expect(page).toHaveURL('/dashboard');
	await page.context().storageState({ path: OWNER_STATE });
});

/**
 * Joining is by invitation, and lms-api mails the link rather than returning it.
 * Reading the worker's mail file is therefore the only route to a student — and
 * it walks the same path a real one walks.
 */
setup('provision a student', async ({ page, request }) => {
	const token = await ownerToken(request);

	const invite = await request.post('/api/v1/invitations', {
		headers: { Authorization: `Bearer ${token}` },
		data: { email: STUDENT.email, role: 'student' }
	});
	expect(invite.ok(), `invite failed: ${invite.status()} ${await invite.text()}`).toBe(true);

	const link = await waitForLink(STUDENT.email, '/accept-invitation');

	await page.goto(`/accept-invitation?token=${tokenOf(link)}`);
	await page.getByLabel('Name').fill(STUDENT.name);
	await page.getByLabel('Password').fill(STUDENT.password);
	await page.getByRole('button', { name: 'Accept invitation' }).click();

	await expect(page).toHaveURL('/dashboard');
	await page.context().storageState({ path: STUDENT_STATE });
});
