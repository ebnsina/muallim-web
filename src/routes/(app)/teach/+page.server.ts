import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 20;

/**
 * This page is only reachable by someone holding course:write. lms-api enforces
 * that and answers 403 otherwise; the redirect below is for the unauthenticated
 * case, where the useful instruction is "sign in" rather than "you may not".
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const cursor = url.searchParams.get('cursor');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/me/courses', {
		params: { query: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) } }
	});

	if (problem || !data) {
		// 403 renders as a 403: a student who follows this link is being told they
		// need a different role, not that the page is missing.
		error(response?.status ?? 500, problemMessage(problem, 'Could not load your courses.'));
	}

	return {
		courses: data.courses ?? [],
		nextCursor: data.has_more ? (data.next_cursor ?? null) : null
	};
};

export const actions: Actions = {
	publish: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach');

		const slug = String((await request.formData()).get('slug') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/publish',
			{ params: { path: { slug } } }
		);

		if (problem) {
			// A course with no lessons is refused with 409. That is the message worth
			// showing: it tells the author what to do next.
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not publish that course.')
			});
		}
		return { published: slug };
	},

	unpublish: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach');

		const slug = String((await request.formData()).get('slug') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/unpublish',
			{ params: { path: { slug } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not unpublish that course.')
			});
		}
		return { unpublished: slug };
	}
};
