import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { scheduleSessionSchema, toRFC3339 } from '$lib/liveclass';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of sessions; muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/*
	The instructor's live-session desk for one course. `course` and the private,
	no-store header both come from the `teach/[slug]` layout, which every page
	beneath it needs anyway — setting the header twice would 500, so it is not set
	here.
*/
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const { data, error: problem } = await authedApi(url.origin, locals.accessToken).GET(
		'/v1/courses/{slug}/live-sessions',
		{ params: { path: { slug: params.slug }, query: { limit: PAGE_SIZE } } }
	);

	// A failed list is not fatal to the desk: the scheduler still stands, so it
	// degrades to a notice rather than an error page over the whole thing.
	const sessionsError = problem
		? problemMessage(problem, 'The live sessions could not be loaded.')
		: null;

	return {
		sessions: pageOf(data?.sessions, data?.next_cursor, data?.has_more ?? false),
		sessionsError
	};
};

export const actions: Actions = {
	/*
		Schedule a session. The times arrive as `datetime-local` in the browser's own
		zone and are sent to the API as RFC 3339 in UTC. A blank end is simply absent.
	*/
	schedule: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(scheduleSessionSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { title, description, join_url, starts_at, ends_at } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/courses/{slug}/live-sessions', {
			params: { path: { slug: params.slug } },
			body: {
				title,
				join_url,
				starts_at: toRFC3339(starts_at),
				...(description ? { description } : {}),
				...(ends_at ? { ends_at: toRFC3339(ends_at) } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That session could not be scheduled.')
			});
		}

		return { scheduledSession: data.session };
	},

	/*
		Edit a session. The edit dialog carries every field, so a cleared end time or
		description is sent as an explicit clear — `null` removes the end, an empty
		description blanks it — rather than left to drift.
	*/
	update: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		const parsed = parseForm(scheduleSessionSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors, editingId: id });

		const { title, description, join_url, starts_at, ends_at } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PATCH('/v1/live-sessions/{id}', {
			params: { path: { id } },
			body: {
				title,
				join_url,
				starts_at: toRFC3339(starts_at),
				description,
				ends_at: ends_at ? toRFC3339(ends_at) : null
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That session could not be updated.'),
				editingId: id
			});
		}

		return { updatedSession: data.session };
	},

	/** Delete a session. The API answers 204; the row is gone. */
	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/live-sessions/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That session could not be deleted.')
			});
		}

		return { deletedSession: id };
	},

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
