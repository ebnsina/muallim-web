import { redirect } from '@sveltejs/kit';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);
	const [board, mine] = await Promise.all([
		api.GET('/v1/leaderboard', { params: { query: { limit: 50 } } }),
		api.GET('/v1/me/gamification')
	]);

	return {
		entries: board.data?.entries ?? [],
		me: mine.data ?? null
	};
};
