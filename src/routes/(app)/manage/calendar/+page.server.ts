import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { EVENT_KINDS, createEventSchema, editEventSchema, type EventKind } from '$lib/calendar';
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
			problemMessage(eventsRes.error, 'We couldn’t load your calendar. Please try again.')
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
				message: problemMessage(problem, 'We couldn’t add that event. Please try again.')
			});
		}

		return { created: data.event };
	},

	/*
		Edit an event. PATCH, not its PUT alias: muallim-api leaves an absent field alone,
		which is a patch whichever verb asks for it, and PATCH is the one that says so.
		The whole form is sent because the form holds the whole event.
	*/
	edit: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fcalendar');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		const parsed = parseForm(editEventSchema, form);
		if (!parsed.ok) return fail(400, { editId: id, errors: parsed.errors });

		const { title, kind, starts_on, ends_on, description } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PATCH('/v1/calendar/events/{id}', {
			params: { path: { id } },
			body: {
				title,
				kind,
				starts_on,
				...(ends_on ? { ends_on } : {}),

				// A cleared note is a real edit, so it goes as an empty string; a cleared end
				// date cannot be sent that way — the API would read it as a date and refuse.
				description
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				editId: id,
				message: problemMessage(problem, 'We couldn’t save that event. Please try again.')
			});
		}

		return { edited: data.event };
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
				message: problemMessage(problem, 'We couldn’t delete that event. Please try again.')
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
				message: problemMessage(problem, 'We couldn’t load more events. Please try again.')
			});
		}

		return { more: pageOf(data.events, data.next_cursor, data.has_more) };
	}
};
