import { redirect } from '@sveltejs/kit';
import { authedApi } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

/**
 * Nothing to see. Signing out is something you do, not somewhere you go.
 *
 * A GET that ended a session would be a session ended by a link preview, a
 * prefetch, or an image tag on somebody else's page.
 */
export const load: PageServerLoad = () => redirect(303, '/');

export const actions: Actions = {
	/**
	 * Sign out, from wherever you were.
	 *
	 * The header used to post to `/dashboard?/logout`, which worked on the one page
	 * that drew the header. From anywhere else it would have signed you out and left
	 * you on the dashboard, wondering.
	 */
	default: async ({ locals, cookies, url }) => {
		// Revoke server-side first. If that fails the cookies are cleared anyway: a
		// session this browser cannot present is one it cannot use, and the access
		// token expires on its own within fifteen minutes.
		if (locals.accessToken) {
			await authedApi(url.origin, locals.accessToken).POST('/v1/auth/logout');
		}

		clearSession(cookies);
		redirect(303, '/');
	}
};
