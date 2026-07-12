import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/*
	Settings is only what muallim-api can actually change.

	The theme is the browser's and never leaves it. The digest is a real preference
	with a real endpoint. There is no name field and no password field here, because
	there is no endpoint behind either — a form that silently discards what a person
	typed is worse than no form.
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
				message: problemMessage(problem, 'Could not save that. Try again shortly.')
			});
		}

		return { saved: true };
	},

	resendVerification: async ({ locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/auth/email/verify/resend'
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not send that email. Try again shortly.')
			});
		}

		return { resent: true };
	}
};
