import { error } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs } from '$lib/server/api';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;

/**
 * The cursor is opaque and lives in the URL, so a page of results is a place a
 * learner can bookmark, share, and return to. lms-api pages by keyset rather
 * than OFFSET, which is why there is a `next_cursor` and no page number: there
 * is no "page 7" to link to, and asking for one would read and discard the six
 * pages in front of it.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	const cursor = url.searchParams.get('cursor');

	const {
		data,
		error: problem,
		response
	} = await apiAs(url.origin, locals.accessToken).GET('/v1/courses', {
		params: { query: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Could not load the catalog.'));
	}

	return {
		courses: data.courses ?? [],
		nextCursor: data.has_more ? (data.next_cursor ?? null) : null,
		signedIn: Boolean(locals.accessToken)
	};
};
