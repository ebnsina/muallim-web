import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { changePasswordSchema, renameSchema } from '$lib/schemas';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/*
	Settings is only what muallim-api can actually change.

	The theme is the browser's and never leaves it. Everything else here has an
	endpoint behind it — a form that silently discards what a person typed is worse
	than no form.
*/
export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	// The layout's profile is nullable — a session that stopped verifying is cleared
	// there. If it is gone, this page has nobody to be about.
	const { user } = await parent();
	if (!user) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	const prefs = await authedApi(url.origin, locals.accessToken).GET(
		'/v1/notifications/preferences'
	);

	return { user, emailDigest: prefs.data?.email_digest ?? true };
};

export const actions: Actions = {
	rename: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(renameSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'name', errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/me',
			{ body: parsed.value }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				scope: 'name',
				message: problemMessage(problem, "We couldn't save your name. Please try again.")
			});
		}

		return { saved: 'name' };
	},

	/*
		The current password goes with it. The API insists, and it is right to: a token
		alone is the cheapest thing to steal, and one that could set a new password
		would turn a stolen session into a lost account.
	*/
	changePassword: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(changePasswordSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'password', errors: parsed.errors });

		const { current_password, new_password } = parsed.value;
		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/me/password',
			{ body: { current_password, new_password } }
		);

		if (problem) {
			// 401 here is the current password, not the session: say which, or somebody
			// will think they have been signed out and reload into the same wall.
			const fallback =
				response?.status === 401
					? "That current password doesn't match. Please try again."
					: "We couldn't change your password. Please try again.";

			return fail(response?.status ?? 500, {
				scope: 'password',
				message: problemMessage(problem, fallback)
			});
		}

		return { saved: 'password' };
	},

	setDigest: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const emailDigest = form.get('email_digest') === 'true';

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/notifications/preferences',
			{ body: { email_digest: emailDigest } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				scope: 'digest',
				message: problemMessage(problem, "We couldn't save that. Please try again in a moment.")
			});
		}

		return { saved: 'digest' };
	},

	resendVerification: async ({ locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/auth/email/verify/resend'
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				scope: 'email',
				message: problemMessage(
					problem,
					"We couldn't send that email. Please try again in a moment."
				)
			});
		}

		return { resent: true };
	}
};
