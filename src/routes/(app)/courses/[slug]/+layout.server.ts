import { error } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs } from '$lib/server/api';
import type { LayoutServerLoad } from './$types';

/**
 * The course, for itself and for every page beneath it.
 *
 * A lesson page knows a lesson id and a slug. A quiz page knows even less. Neither
 * could name the course it sits in, so the trail at the top of each read "Back to
 * the lesson" — true, and useless for telling you where you are.
 *
 * SvelteKit merges this into the `data` of every page below, so a breadcrumb costs
 * those pages nothing but a `<Breadcrumbs>`. It costs one request, on pages that
 * were making one anyway; `/v1/courses/{slug}` is three queries whatever the size
 * of the course.
 *
 * What comes back depends on who asked — an author sees their own drafts — so it
 * is never shared-cacheable, and this layout is where that is said for every page
 * beneath it.
 */
export const load: LayoutServerLoad = async ({ locals, params, setHeaders, url }) => {
	const {
		data,
		error: problem,
		response
	} = await apiAs(url.origin, locals.accessToken).GET('/v1/courses/{slug}', {
		params: { path: { slug: params.slug } }
	});

	if (problem || !data) {
		// 404 for a draft, and for a course that never existed. Which one it is is not
		// a stranger's business, and muallim-api has already declined to say.
		error(
			response?.status ?? 500,
			problemMessage(problem, "We couldn't open that course. Please try again.")
		);
	}

	/*
		Set here, and nowhere below.

		Every page under this layout renders something that depends on who asked — a
		draft, a grade, a half-finished attempt — so none of it may sit in a shared
		cache. `setHeaders` throws if the same header is set twice in one request, so
		the layout owning it is not a style preference: a page that also set it would
		500, on every request, which is exactly what happened.
	*/
	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		course: data.course,
		topics: data.topics ?? [],
		lessonCount: data.lesson_count,
		durationSeconds: data.duration_seconds
	};
};
