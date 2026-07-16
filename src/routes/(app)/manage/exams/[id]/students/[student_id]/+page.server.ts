import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import type { Exam } from '$lib/exams';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

type Api = ReturnType<typeof authedApi>;

/** The exam's name, found in the keyset list — muallim-api has no single-exam read. */
async function findExam(api: Api, id: string): Promise<Exam | null> {
	let cursor: string | undefined;
	for (let page = 0; page < 20; page++) {
		const { data, error: problem } = await api.GET('/v1/exams', {
			params: { query: { limit: 100, ...(cursor ? { cursor } : {}) } }
		});
		if (problem || !data) return null;

		const found = data.exams?.find((exam) => exam.id === id);
		if (found) return found;

		if (!data.has_more || !data.next_cursor) return null;
		cursor = data.next_cursor;
	}
	return null;
}

/*
	One student's report card for one exam: the subjects graded, the totals, and the
	overall verdict — all computed by muallim-api against the exam's scale. The student
	is loaded for their name and admission number; the exam for its own name.
*/
export const load: PageServerLoad = async ({ locals, params, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	const [cardRes, studentRes, exam] = await Promise.all([
		api.GET('/v1/exams/{id}/students/{student_id}/report-card', {
			params: { path: { id: params.id, student_id: params.student_id } }
		}),
		api.GET('/v1/students/{id}', { params: { path: { id: params.student_id } } }),
		findExam(api, params.id)
	]);

	if (cardRes.error || !cardRes.data) {
		error(
			cardRes.response?.status ?? 500,
			problemMessage(cardRes.error, 'That report card could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		reportCard: cardRes.data.report_card,
		student: studentRes.data?.student ?? null,
		exam
	};
};
