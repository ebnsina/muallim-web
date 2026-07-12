import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * A learner's own grades in a course.
 *
 * muallim-api reads the learner from the token. There is no path here — and none
 * there — that takes a user id from a request, so this page cannot be pointed at
 * somebody else by changing a query string.
 *
 * `cache-control` is set by the `[slug]` layout, for every page under it. Setting
 * it again here throws.
 */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/courses/{slug}/grades', {
		params: { path: { slug: params.slug } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Your grades could not be loaded.'));
	}

	return {
		slug: params.slug,
		scale: data.scale,
		items: data.items ?? [],
		entries: data.entries ?? [],
		result: data.result
	};
};
