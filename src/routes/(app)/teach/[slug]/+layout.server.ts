import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { LayoutServerLoad } from './$types';

/**
 * The course as its author sees it — drafts and all — for every page beneath it.
 *
 * The same job as the learner's `[slug]` layout, and a separate file because the
 * request is not the same one: this is the authenticated read, and an author's
 * curriculum contains lessons a learner is never shown.
 *
 * `/teach/+layout.server.ts` has already established that whoever is here may
 * author something. This establishes that this particular course exists for them.
 */
export const load: LayoutServerLoad = async ({ locals, params, setHeaders, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/courses/{slug}', {
		params: { path: { slug: params.slug } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'That course could not be loaded.'));
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
		lessonCount: data.lesson_count
	};
};
