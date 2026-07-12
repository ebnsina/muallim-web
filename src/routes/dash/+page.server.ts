import { redirect } from '@sveltejs/kit';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * A board view of the same learning the dashboard lists, at its own address.
 *
 * Deliberately outside the `(app)` group: that layout draws the header and holds
 * every page inside a centered container, and this page is a full-bleed band with a
 * sheet on it. It cannot be that from inside a container, so it does not sit in one
 * — and it loads the person itself, since the layout that used to hand them over is
 * the layout it just stepped out of.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	const [me, enrolments, notifications, gamification] = await Promise.all([
		api.GET('/v1/me'),
		api.GET('/v1/me/enrolments', { params: { query: { limit: 100 } } }),
		api.GET('/v1/notifications', { params: { query: { limit: 6 } } }),
		api.GET('/v1/me/gamification')
	]);

	if (!me.data?.user) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	return {
		user: me.data.user,
		unread: (notifications.data?.notifications ?? []).filter((n) => !n.read).length,
		enrolments: enrolments.data?.enrolments ?? [],
		notifications: notifications.data?.notifications ?? [],
		gamification: gamification.data ?? null
	};
};
