import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

/** Sends an unauthenticated visitor to sign in, and back here afterwards. */
function toLogin(pathname: string): never {
	redirect(303, `/login?next=${encodeURIComponent(pathname)}`);
}

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
	if (!locals.accessToken) toLogin(url.pathname);

	const api = authedApi(url.origin, locals.accessToken);

	// Both are needed to render the page and neither depends on the other.
	const [me, enrolments] = await Promise.all([api.GET('/v1/me'), api.GET('/v1/me/enrolments')]);
	const { data, error: problem, response } = me;

	// The token verified when `handle` ran, and no longer does: the membership was
	// revoked, or the role changed and lms-api swept the sessions. Drop the cookies
	// rather than loop through a refresh that will fail the same way.
	if (response?.status === 401 || response?.status === 403) {
		clearSession(cookies);
		toLogin(url.pathname);
	}

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Could not load your profile.'));
	}

	// A failure to list enrolments is not a failure to show the profile. The
	// section renders empty rather than taking the page down with it.
	return { user: data.user, enrolments: enrolments.data?.enrolments ?? [] };
};

export const actions: Actions = {
	logout: async ({ locals, cookies, url }) => {
		// Revoke server-side first. If that fails the cookies are cleared anyway:
		// a session this browser cannot present is one it cannot use, and the
		// access token expires on its own within fifteen minutes.
		if (locals.accessToken) {
			await authedApi(url.origin, locals.accessToken).POST('/v1/auth/logout');
		}
		clearSession(cookies);
		redirect(303, '/');
	},

	resendVerification: async ({ locals, url }) => {
		if (!locals.accessToken) toLogin('/dashboard');

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
