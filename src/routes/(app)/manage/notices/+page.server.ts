import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { postNoticeSchema } from '$lib/notices';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import type { Section } from '$lib/students';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of the board. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/*
	The board, and the classes and sections a notice can be aimed at.

	The class list is small and unpaginated, so its sections are loaded alongside it —
	a handful of parallel reads, once per page. That map names every class and section
	a class/section audience can target.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fnotices');

	const api = authedApi(url.origin, locals.accessToken);

	const [noticesRes, classesRes] = await Promise.all([
		api.GET('/v1/notices', { params: { query: { limit: PAGE_SIZE } } }),
		api.GET('/v1/classes')
	]);

	if (noticesRes.error || !noticesRes.data) {
		error(
			noticesRes.response?.status ?? 500,
			problemMessage(noticesRes.error, 'We couldn’t load your notice board. Please try again.')
		);
	}

	const classes = classesRes.data?.classes ?? [];
	const sectionLists = await Promise.all(
		classes.map((klass) =>
			api.GET('/v1/classes/{id}/sections', { params: { path: { id: klass.id } } })
		)
	);
	const sectionsByClass: Record<string, Section[]> = {};
	classes.forEach((klass, index) => {
		sectionsByClass[klass.id] = sectionLists[index].data?.sections ?? [];
	});

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		notices: pageOf(noticesRes.data.notices, noticesRes.data.next_cursor, noticesRes.data.has_more),
		classes,
		sectionsByClass
	};
};

export const actions: Actions = {
	/*
		Post a notice. The API decides who it reaches and answers 422 when the audience
		has nobody, or when a class/section audience arrives without a target — both are
		shown as they came.
	*/
	post: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fnotices');

		const parsed = parseForm(postNoticeSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { title, body, audience, channel, target_id } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/notices', {
			body: { title, body, audience, channel, ...(target_id ? { target_id } : {}) }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t post that notice. Please try again.')
			});
		}

		return { posted: data.notice };
	},

	/** The next page. The cursor is opaque and goes back unread. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fnotices');

		const cursor = String((await request.formData()).get('cursor') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/notices', {
			params: { query: { limit: PAGE_SIZE, cursor } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t load more notices. Please try again.')
			});
		}

		return { more: pageOf(data.notices, data.next_cursor, data.has_more) };
	}
};
