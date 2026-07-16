import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * One of the learner's own attempts.
 *
 * Addressed by number within the quiz, never by an id — there is nothing here to
 * increment into somebody else's result, because muallim-api scopes the number to the
 * caller.
 */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const number = Number(params.number);
	if (!Number.isInteger(number) || number < 1) error(404, "We couldn't find that attempt.");

	const review = await authedApi(url.origin, locals.accessToken).GET(
		'/v1/lessons/{id}/quiz/attempts/{number}',
		{ params: { path: { id: params.id, number } } }
	);

	if (review.error || !review.data) {
		error(
			review.response?.status ?? 500,
			problemMessage(review.error, "We couldn't open that attempt. Please try again.")
		);
	}

	return {
		slug: params.slug,
		lessonId: params.id,
		attempt: review.data.attempt,
		items: review.data.items
	};
};
