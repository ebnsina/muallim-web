import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * The marking queue.
 *
 * `submission:grade` is what opens this, not `course:write` — a teaching
 * assistant marks work without being able to rewrite the course. lms-api decides
 * that; a student who follows this link gets 403 rather than an empty page.
 *
 * This is also the only place an attempt's id appears. A learner reaches their own
 * attempts by number, so none of theirs is ever guessable.
 */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const awaiting = url.searchParams.get('all') !== '1';

	const submissions = await authedApi(url.origin, locals.accessToken).GET(
		'/v1/lessons/{id}/quiz/submissions',
		{ params: { path: { id: params.id }, query: { awaiting, limit: 50 } } }
	);

	if (submissions.error || !submissions.data) {
		error(
			submissions.response?.status ?? 500,
			problemMessage(submissions.error, 'The marking queue could not be loaded.')
		);
	}

	return {
		slug: params.slug,
		lessonId: params.id,
		awaiting,
		submissions: submissions.data.submissions
	};
};
