import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { EVENT_KINDS, createEventSchema, type EventKind } from '$lib/calendar';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of the calendar. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/** A blank filter is "any kind"; anything else must be one the API knows. */
function kindFilter(raw: string | null): EventKind | '' {
	return EVENT_KINDS.includes(raw as EventKind) ? (raw as EventKind) : '';
}

/** A date filter is passed through only when it looks like YYYY-MM-DD; junk is dropped. */
function dateFilter(raw: string | null): string {
	return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

/*
	The academic calendar: holidays, exams, term markers and one-off events, newest
	first. The kind and the date window narrow it; the API keeps the order and hands
	the rest back behind a cursor.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fcalendar');

	const api = authedApi(url.origin, locals.accessToken);

	const kind = kindFilter(url.searchParams.get('kind'));
	const from = dateFilter(url.searchParams.get('from'));
	const to = dateFilter(url.searchParams.get('to'));

	const eventsRes = await api.GET('/v1/calendar/events', {
		params: {
			query: {
				limit: PAGE_SIZE,
				...(kind ? { kind } : {}),
				...(from ? { from } : {}),
				...(to ? { to } : {})
			}
		}
	});

	if (eventsRes.error || !eventsRes.data) {
		error(
			eventsRes.response?.status ?? 500,
			problemMessage(eventsRes.error, 'The calendar could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		events: pageOf(eventsRes.data.events, eventsRes.data.next_cursor, eventsRes.data.has_more),
		kind,
		from,
		to
	};
};

export const actions: Actions = {
	/*
		Add an event. The API decides its place in the order and answers 422 when the
		span runs backwards — shown as it came, over the schema's own catch.
	*/
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fcalendar');

		const parsed = parseForm(createEventSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { title, kind, starts_on, ends_on, description } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/calendar/events', {
			body: {
				title,
				kind,
				starts_on,
				...(ends_on ? { ends_on } : {}),
				...(description ? { description } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That event could not be added.')
			});
		}

		return { created: data.event };
	},

	/** Delete an event. The API answers 204; the row is gone. */
	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fcalendar');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/calendar/events/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That event could not be deleted.')
			});
		}

		return { deleted: id };
	},

	/** The next page. The cursor is opaque and the filters travel with it. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fcalendar');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const kind = kindFilter(String(form.get('kind') ?? ''));
		const from = dateFilter(String(form.get('from') ?? ''));
		const to = dateFilter(String(form.get('to') ?? ''));

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/calendar/events', {
			params: {
				query: {
					limit: PAGE_SIZE,
					cursor,
					...(kind ? { kind } : {}),
					...(from ? { from } : {}),
					...(to ? { to } : {})
				}
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of the calendar could not be loaded.')
			});
		}

		return { more: pageOf(data.events, data.next_cursor, data.has_more) };
	}
};
