import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/*
	The institution at a glance: the counts muallim-api aggregates for the admin home.
	The section's layout already refused anyone without `academics:manage`, so a
	failure here is the API's own sentence, shown as it came.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/overview');

	if (problem || !data) {
		error(
			response?.status ?? 500,
			problemMessage(problem, 'We couldn’t load your dashboard. Please try again.')
		);
	}

	// A workspace's own numbers, and no two workspaces share a page.
	setHeaders({ 'cache-control': 'private, no-store' });

	return { overview: data.overview };
};
