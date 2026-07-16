import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { logHifzSchema } from '$lib/hifz';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 50;

/** The window the summary counts over. muallim-api defaults it; the page names 30 days. */
const SUMMARY_DAYS = 30;

/*
	One student's hifz: the log newest first, and a summary — the current Sabaq position
	and the counts by kind over the last month. The student is loaded for their name; a
	student in another workspace is the API's 404, shown as it came.
*/
export const load: PageServerLoad = async ({ locals, params, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	const [studentRes, logRes, summaryRes] = await Promise.all([
		api.GET('/v1/students/{id}', { params: { path: { id: params.id } } }),
		api.GET('/v1/students/{id}/hifz', {
			params: { path: { id: params.id }, query: { limit: PAGE_SIZE } }
		}),
		api.GET('/v1/students/{id}/hifz/summary', {
			params: { path: { id: params.id }, query: { days: SUMMARY_DAYS } }
		})
	]);

	if (studentRes.error || !studentRes.data) {
		error(
			studentRes.response?.status ?? 500,
			problemMessage(studentRes.error, 'That student could not be loaded.')
		);
	}
	if (logRes.error || !logRes.data) {
		error(
			logRes.response?.status ?? 500,
			problemMessage(logRes.error, 'The hifz log could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		student: studentRes.data.student,
		log: pageOf(logRes.data.entries, logRes.data.next_cursor, logRes.data.has_more),
		summary: summaryRes.data?.summary ?? { counts: {}, current_sabaq: undefined },
		summaryDays: SUMMARY_DAYS
	};
};

export const actions: Actions = {
	/*
		Log a recitation. The ayah range travels as two numbers the schema has already
		ordered; the note is left off the wire when blank rather than sent empty.
	*/
	log: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(logHifzSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { on_date, kind, surah, ayah_from, ayah_to, rating, note } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/students/{id}/hifz', {
			params: { path: { id: params.id } },
			body: { on_date, kind, surah, ayah_from, ayah_to, rating, ...(note ? { note } : {}) }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That recitation could not be logged.')
			});
		}

		return { logged: data.entry };
	},

	/** Remove a log entry. The API answers 204; the row goes and nothing comes back. */
	remove: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const id = String((await request.formData()).get('entry_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/hifz/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That entry could not be removed.')
			});
		}

		return { removed: id };
	},

	/** The next page of the log. The cursor is opaque and goes back to the API unread. */
	more: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const cursor = String((await request.formData()).get('cursor') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/students/{id}/hifz', {
			params: { path: { id: params.id }, query: { limit: PAGE_SIZE, cursor } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of the log could not be loaded.')
			});
		}

		return { more: pageOf(data.entries, data.next_cursor, data.has_more) };
	}
};
