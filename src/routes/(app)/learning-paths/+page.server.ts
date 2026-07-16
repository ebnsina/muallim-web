import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/** muallim-api caps a page of paths; the rest is behind a cursor. */
const PAGE_SIZE = 50;

/*
	The learning paths a learner may follow. No `status` travels with this request:
	muallim-api decides what a reader may see from their permission, and a reader
	without course:write is shown published paths whatever the query asks for.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const cursor = url.searchParams.get('cursor') ?? '';

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/learning-paths', {
		params: { query: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Learning paths could not be loaded.'));
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return { paths: pageOf(data.paths, data.next_cursor, data.has_more) };
};
