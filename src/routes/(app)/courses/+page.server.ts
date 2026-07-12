import { error } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs } from '$lib/server/api';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;

/**
 * The cursor is opaque and lives in the URL, so a page of results is a place a
 * learner can bookmark, share, and return to. muallim-api pages by keyset rather
 * than OFFSET, which is why there is a `next_cursor` and no page number: there
 * is no "page 7" to link to, and asking for one would read and discard the six
 * pages in front of it.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	const cursor = url.searchParams.get('cursor');
	// The search and the filter live in the URL, so a filtered page is a place a
	// learner can bookmark and share — the same reason the cursor does.
	const q = url.searchParams.get('q')?.trim() ?? '';
	const difficulty = url.searchParams.get('difficulty') ?? '';

	// The author, by id and never by name: two people in a workspace may be called
	// the same thing, and muallim-api keys the filter on who they are.
	const author = url.searchParams.get('author') ?? '';

	const {
		data,
		error: problem,
		response
	} = await apiAs(url.origin, locals.accessToken).GET('/v1/courses', {
		params: {
			query: {
				limit: PAGE_SIZE,
				...(cursor ? { cursor } : {}),
				...(q ? { q } : {}),
				...(difficulty ? { difficulty } : {}),
				...(author ? { author } : {})
			}
		}
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Could not load the catalog.'));
	}

	return {
		courses: data.courses ?? [],
		nextCursor: data.has_more ? (data.next_cursor ?? null) : null,
		signedIn: Boolean(locals.accessToken),
		q,
		difficulty,
		author,

		// The name to put in the heading when the page is one person's work. It comes
		// from the rows themselves — every course on a filtered page has the same
		// author — rather than from a second request for a name we were already sent.
		authorName: author
			? ((data.courses ?? []).find((c) => c.instructor_id === author)?.instructor ?? '')
			: ''
	};
};
