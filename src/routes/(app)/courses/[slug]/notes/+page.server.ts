import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * The learner's own notes and marks across a whole course, for revision.
 *
 * `course` and `topics` come from the course layout, which also sets the
 * `private, no-store` header for everything beneath it — so this page adds only
 * the annotations, and the grouping by lesson happens against the curriculum the
 * layout already loaded.
 */
export const load: PageServerLoad = async ({ locals, params, parent, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const annotations = authedApi(url.origin, locals.accessToken).GET(
		'/v1/courses/{slug}/annotations',
		{ params: { path: { slug: params.slug } } }
	);

	await parent();
	const { data, error: problem, response } = await annotations;

	if (problem || !data) {
		error(
			response?.status ?? 500,
			problemMessage(problem, "We couldn't load your notes. Please try again.")
		);
	}

	return {
		notes: data.notes ?? [],
		highlights: data.highlights ?? []
	};
};
