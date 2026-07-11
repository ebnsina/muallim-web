import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

/** Sends an unauthenticated visitor to sign in, and back here afterwards. */
function toLogin(pathname: string): never {
	redirect(303, `/login?next=${encodeURIComponent(pathname)}`);
}

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!locals.accessToken) toLogin(url.pathname);

	/*
		The profile comes from the layout, which every page under it needs anyway to
		draw a name in the header. Asking `/v1/me` again here would be a second
		request for an answer already in hand — and the layout is where a session that
		has stopped verifying gets cleared.
	*/
	const { user } = await parent();
	if (!user) toLogin(url.pathname);

	const api = authedApi(url.origin, locals.accessToken);

	/*
		Two reads, in parallel, neither depending on the other.

		`/v1/me/courses` is asked for even by a student, whose answer is 403. Deciding
		from the role whether to ask would trade a request that costs nothing for a
		rule that can disagree with lms-api. lms-api is the authority, and it says no.
	*/
	const [enrolments, teaching, gamification] = await Promise.all([
		api.GET('/v1/me/enrolments'),
		api.GET('/v1/me/courses', { params: { query: { limit: 6 } } }),
		api.GET('/v1/me/gamification')
	]);

	// A failure to list either is not a failure to show the profile. The section
	// renders empty rather than taking the page down with it — and for a student,
	// the 403 on `/v1/me/courses` *is* the expected answer.
	return {
		user,
		enrolments: enrolments.data?.enrolments ?? [],
		teaching: teaching.data?.courses ?? [],
		gamification: gamification.data ?? null
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
