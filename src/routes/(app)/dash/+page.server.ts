import { redirect } from '@sveltejs/kit';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * A board view of the same learning the dashboard lists.
 *
 * It is a proposal, kept at its own address so it can be looked at beside the page
 * it might replace rather than instead of it. Nothing here is new data: the columns
 * are the enrolments the dashboard already loads, and every card is a course this
 * learner is actually on.
 */
export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const { user } = await parent();
	if (!user) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	const [enrolments, notifications, gamification] = await Promise.all([
		api.GET('/v1/me/enrolments', { params: { query: { limit: 100 } } }),
		api.GET('/v1/notifications', { params: { query: { limit: 6 } } }),
		api.GET('/v1/me/gamification')
	]);

	return {
		user,
		enrolments: enrolments.data?.enrolments ?? [],
		notifications: notifications.data?.notifications ?? [],
		gamification: gamification.data ?? null
	};
};
