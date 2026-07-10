import { authedApi } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { LayoutServerLoad } from './$types';

/**
 * Who is signed in, for every page under this layout.
 *
 * Not a guard. The catalogue is readable by a stranger — that is what a published
 * course and a preview lesson are for — so an anonymous visitor gets `user: null`
 * and a header offering to sign them in. Pages that do need a session say so
 * themselves, because the rule differs page by page and a layout that redirected
 * would take the catalogue down with it.
 *
 * Loaded once here rather than in each page. Every signed-in page draws the
 * person's name in the header, and asking `/v1/me` from all of them would be one
 * request per page for an answer that does not change between them.
 */
export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
	if (!locals.accessToken) return { user: null };

	const { data, response } = await authedApi(url.origin, locals.accessToken).GET('/v1/me');

	/*
		The token verified when `handle` ran and no longer does: the membership was
		revoked, or the role changed and lms-api swept the sessions.

		Drop the cookies and carry on as a stranger. Redirecting to /login from a
		layout would do it from every page at once, including the ones a stranger is
		welcome on — and the page below still redirects if it needs a session.
	*/
	if (response?.status === 401 || response?.status === 403) {
		clearSession(cookies);
		return { user: null };
	}

	return { user: data?.user ?? null };
};
