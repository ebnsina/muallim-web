import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/** One page of sessions; muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/*
	A learner's view of a course's live sessions. `course` and the private, no-store
	header both come from the `courses/[slug]` layout — the header is set there and
	nowhere below, so it is not set again here.

	Only enrolled learners and instructors get results; everyone else is answered
	404 by the API. A 404 is not an error to this page — it is "enrol first", and
	the page says so rather than showing a red banner.
*/
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/courses/{slug}/live-sessions', {
		params: { path: { slug: params.slug }, query: { limit: PAGE_SIZE } }
	});

	if (response?.status === 404) {
		return { notEnrolled: true, sessions: pageOf([], undefined, false) };
	}

	const sessionsError = problem
		? problemMessage(problem, 'The live sessions could not be loaded.')
		: null;

	return {
		notEnrolled: false,
		sessions: pageOf(data?.sessions, data?.next_cursor, data?.has_more ?? false),
		sessionsError
	};
};

export const actions: Actions = {
	/** The next page of sessions. The cursor is opaque; it came from the API. */
	more: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const cursor = String((await request.formData()).get('cursor') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/courses/{slug}/live-sessions', {
			params: { path: { slug: params.slug }, query: { limit: PAGE_SIZE, cursor } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of sessions could not be loaded.')
			});
		}

		return { more: pageOf(data.sessions, data.next_cursor, data.has_more) };
	}
};
