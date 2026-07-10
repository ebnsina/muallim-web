import { error, fail } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/**
 * Every learner's grade in the course, and the scales it could grade by.
 *
 * Two reads, issued together. The scales do not depend on the gradebook, and
 * `/teach/+layout.server.ts` has already established that whoever is here may
 * author something.
 *
 * `cache-control` is set by the `[slug]` layout, for every page under it.
 */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) error(401, 'Sign in to open this gradebook.');

	const api = authedApi(url.origin, locals.accessToken);

	const [book, scales] = await Promise.all([
		api.GET('/v1/courses/{slug}/gradebook', { params: { path: { slug: params.slug } } }),
		api.GET('/v1/grading-scales')
	]);

	if (book.error || !book.data) {
		error(
			book.response?.status ?? 500,
			problemMessage(book.error, 'That gradebook could not be loaded.')
		);
	}

	return {
		slug: params.slug,
		scale: book.data.scale,
		items: book.data.items ?? [],
		learners: book.data.learners ?? [],

		// A failure to list the scales is not a failure to show the gradebook. The
		// picker renders with the one in use and nothing to change it to.
		scales: scales.data?.scales ?? []
	};
};

export const actions: Actions = {
	/**
	 * Choose how this course grades.
	 *
	 * The empty value is the built-in default, which is not a row and has no id.
	 * `null` is how the API says so, and it is a different thing from an absent
	 * field — that would mean "leave it alone".
	 */
	setScale: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to change how this course grades.');

		const form = await request.formData();
		const chosen = String(form.get('scale_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/courses/{slug}/grading-scale',
			{
				params: { path: { slug: params.slug } },
				body: { scale_id: chosen === '' ? null : chosen }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That grading scale could not be applied.')
			});
		}

		return { saved: true };
	}
};
