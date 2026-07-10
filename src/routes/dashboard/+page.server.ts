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

	/*
		Three reads, in parallel, none of which depends on another.

		`/v1/me/courses` is asked for even by a student, whose answer is 403. Waiting
		to learn the role from `/v1/me` before deciding whether to ask would put the
		two calls in series to save a request that costs nothing — and the role is
		not the authority anyway. lms-api is, and it says no.
	*/
	const [me, enrolments, teaching] = await Promise.all([
		api.GET('/v1/me'),
		api.GET('/v1/me/enrolments'),
		api.GET('/v1/me/courses', { params: { query: { limit: 6 } } })
	]);
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

	// A failure to list either is not a failure to show the profile. The section
	// renders empty rather than taking the page down with it — and for a student,
	// the 403 on `/v1/me/courses` *is* the expected answer.
	return {
		user: data.user,
		enrolments: enrolments.data?.enrolments ?? [],
		teaching: teaching.data?.courses ?? []
	};
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
