import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/** muallim-api's own ceiling for a page of courses. */
const COURSE_PAGE_SIZE = 100;

/*
	Enough pages to name the courses on any reasonable path, and a stop either way.
	A path whose courses lie beyond this still renders — the rows just lose their
	link — which is the same handling an unpublished course already gets.
*/
const MAX_COURSE_PAGES = 5;

type CourseRef = { title: string; slug: string };

/*
	Names for the path's course ids, from the published listing — the reader's view of
	the catalog. `/v1/me/courses` is the authored one and demands course:write, which a
	learner does not hold; it would answer 403 and leave the page with no titles at all.
	Paging stops as soon as every id the path names has been found.
*/
async function courseRefs(
	api: ReturnType<typeof authedApi>,
	wanted: Set<string>
): Promise<Map<string, CourseRef>> {
	const found = new Map<string, CourseRef>();
	let cursor = '';

	for (let page = 0; page < MAX_COURSE_PAGES && found.size < wanted.size; page++) {
		const { data } = await api.GET('/v1/courses', {
			params: { query: { limit: COURSE_PAGE_SIZE, ...(cursor ? { cursor } : {}) } }
		});
		if (!data) break;

		for (const course of data.courses ?? []) {
			if (wanted.has(course.id)) found.set(course.id, { title: course.title, slug: course.slug });
		}

		if (!data.has_more || !data.next_cursor) break;
		cursor = data.next_cursor;
	}

	return found;
}

/*
	One learning path, its courses in the path's own order, and this learner's progress
	through each. muallim-api answers 404 for a path a learner may not see, so a draft
	never reaches this page.
*/
export const load: PageServerLoad = async ({ locals, params, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	const [pathRes, progressRes] = await Promise.all([
		api.GET('/v1/learning-paths/{slug}', { params: { path: { slug: params.slug } } }),
		api.GET('/v1/learning-paths/{slug}/progress', { params: { path: { slug: params.slug } } })
	]);

	if (pathRes.error || !pathRes.data) {
		error(
			pathRes.response?.status ?? 500,
			problemMessage(pathRes.error, 'That learning path could not be found.')
		);
	}

	if (progressRes.error || !progressRes.data) {
		error(
			progressRes.response?.status ?? 500,
			problemMessage(
				progressRes.error,
				'Your progress through this learning path could not be loaded.'
			)
		);
	}

	const path = pathRes.data.path;
	const courseIds = path.course_ids ?? [];
	const refs = await courseRefs(api, new Set(courseIds));

	const progressById = new Map(progressRes.data.courses?.map((row) => [row.course_id, row]) ?? []);

	// The path's order is the meaning of a path, so the rows are built from its own
	// list rather than from anything the lookups happened to return.
	const courses = courseIds.map((id) => {
		const ref = refs.get(id);
		const progress = progressById.get(id);

		return {
			id,
			title: ref?.title ?? '',
			slug: ref?.slug ?? '',
			lessonsCompleted: progress?.lessons_completed ?? 0,
			lessonsTotal: progress?.lessons_total ?? 0,
			percent: progress?.percent ?? 0
		};
	});

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		path,
		courses,
		overallPercent: progressRes.data.overall_percent
	};
};
