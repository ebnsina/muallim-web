import { error } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs, authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;

// The category and tag vocabularies are bounded per workspace; one page each is
// the whole list, so the filter bar needs no cursor of its own.
const VOCAB_LIMIT = 100;

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

	// Category and tag, both by id — muallim-api resolves each to a set of course
	// ids and confines the listing to it, intersecting the two when both are set.
	const category = url.searchParams.get('category') ?? '';
	const tag = url.searchParams.get('tag') ?? '';

	// The catalog itself is public, but the taxonomy vocabularies are not, so the
	// filter bar only appears for a signed-in reader. The URL filter still works
	// signed-out — muallim-api resolves the id server-side — there is just no
	// picker to build without the names.
	const vocab = locals.accessToken ? authedApi(url.origin, locals.accessToken) : null;

	const [coursesRes, categoriesRes, tagsRes] = await Promise.all([
		apiAs(url.origin, locals.accessToken).GET('/v1/courses', {
			params: {
				query: {
					limit: PAGE_SIZE,
					...(cursor ? { cursor } : {}),
					...(q ? { q } : {}),
					...(difficulty ? { difficulty } : {}),
					...(author ? { author } : {}),
					...(category ? { category } : {}),
					...(tag ? { tag } : {})
				}
			}
		}),
		vocab?.GET('/v1/course-categories', { params: { query: { limit: VOCAB_LIMIT } } }),
		vocab?.GET('/v1/course-tags', { params: { query: { limit: VOCAB_LIMIT } } })
	]);

	const { data, error: problem, response } = coursesRes;

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Could not load the catalog.'));
	}

	// A vocabulary that fails to load costs the filter, not the page — the listing
	// still renders, so the empty picker just does not appear.
	const categories = categoriesRes?.data?.categories ?? [];
	const tags = tagsRes?.data?.tags ?? [];

	return {
		courses: data.courses ?? [],
		nextCursor: data.has_more ? (data.next_cursor ?? null) : null,
		signedIn: Boolean(locals.accessToken),
		q,
		difficulty,
		author,
		category,
		tag,
		categories,
		tags,

		// The name to put in the heading when the page is one person's work. It comes
		// from the rows themselves — every course on a filtered page has the same
		// author — rather than from a second request for a name we were already sent.
		authorName: author
			? ((data.courses ?? []).find((c) => c.instructor_id === author)?.instructor ?? '')
			: ''
	};
};
