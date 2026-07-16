import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { createExamSchema } from '$lib/exams';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** muallim-api caps a page of exams; the rest is behind a cursor. */
const PAGE_SIZE = 50;

/*
	The exams, and everything a new one is composed from: the grading scales, the
	classes, and the terms. A workspace is guaranteed one scale — the Bangladesh GPA-5,
	seeded idempotently — so the create form always has something to grade against and
	the bands can be shown beside the list.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	// Seed the default scale before listing, so the very first visit already has one.
	const defaultRes = await api.POST('/v1/exam-scales/default', {});
	if (defaultRes.error) {
		error(
			defaultRes.response?.status ?? 500,
			problemMessage(defaultRes.error, 'We couldn’t set up your grading scale. Please try again.')
		);
	}

	const [scalesRes, examsRes, classesRes] = await Promise.all([
		api.GET('/v1/exam-scales'),
		api.GET('/v1/exams', { params: { query: { limit: PAGE_SIZE } } }),
		api.GET('/v1/classes')
	]);

	if (scalesRes.error || !scalesRes.data) {
		error(
			scalesRes.response?.status ?? 500,
			problemMessage(scalesRes.error, 'We couldn’t load your grading scales. Please try again.')
		);
	}
	if (examsRes.error || !examsRes.data) {
		error(
			examsRes.response?.status ?? 500,
			problemMessage(examsRes.error, 'We couldn’t load your exams. Please try again.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		defaultScale: defaultRes.data?.scale ?? null,
		scales: scalesRes.data.scales ?? [],
		exams: pageOf(examsRes.data.exams, examsRes.data.next_cursor, examsRes.data.has_more),
		classes: classesRes.data?.classes ?? []
	};
};

export const actions: Actions = {
	/*
		Create an exam. The name and the scale are required; the class, term, and the day
		it was held are the optional placement, left off the wire rather than sent blank.
	*/
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(createExamSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, scale_id, grade_level_id, term_id, held_on } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/exams', {
			body: {
				name,
				scale_id,
				...(grade_level_id ? { grade_level_id } : {}),
				...(term_id ? { term_id } : {}),
				...(held_on ? { held_on } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t create that exam. Please try again.')
			});
		}

		return { created: data.exam };
	},

	/*
		One-click the traditional madrasa grading scale (the Qawmi ladder — Mumtaz down
		to Rasib) alongside the board's GPA 5.0, for a workspace that grades that way.
	*/
	madrasaScale: async ({ locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/exam-scales',
			{
				body: {
					name: 'Madrasa (traditional)',
					bands: [
						{ letter: 'Mumtaz', min_percent: 80, gpa_point: 5, is_pass: true },
						{ letter: 'Jayyid Jiddan', min_percent: 65, gpa_point: 4, is_pass: true },
						{ letter: 'Jayyid', min_percent: 50, gpa_point: 3, is_pass: true },
						{ letter: 'Maqbul', min_percent: 33, gpa_point: 2, is_pass: true },
						{ letter: 'Rasib', min_percent: 0, gpa_point: 0, is_pass: false }
					]
				}
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t add the madrasa scale. Please try again.')
			});
		}

		return { madrasaAdded: true };
	},

	/*
		Publish an exam. Once published its report cards can be read, and it is no longer
		marked — the page moves the row to its published state without a re-read.
	*/
	publish: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const id = String((await request.formData()).get('id') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/exams/{id}/publish', {
			params: { path: { id } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t publish that exam. Please try again.')
			});
		}

		return { published: data.exam };
	},

	/** Remove an exam. The API answers 204; the row goes and there is nothing to return. */
	remove: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/exams/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t remove that exam. Please try again.')
			});
		}

		return { removed: id };
	},

	/** The next page. The cursor is opaque and goes back to the API unread. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const cursor = String((await request.formData()).get('cursor') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/exams', {
			params: { query: { limit: PAGE_SIZE, cursor } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t load more exams. Please try again.')
			});
		}

		return { more: pageOf(data.exams, data.next_cursor, data.has_more) };
	}
};
