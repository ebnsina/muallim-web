import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import type { Exam, MarkInput } from '$lib/exams';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

type Api = ReturnType<typeof authedApi>;

/*
	muallim-api has no "get one exam", so the exam is found in the keyset list. A handful
	of pages is walked at most — the workspace's exams are few, and the walk stops the
	moment the id is met.
*/
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
	One exam, with the students and subjects a mark is entered against. A draft is marked;
	a published exam is read as report cards. Both share the roster and the subject list,
	so both are loaded here.
*/
export const load: PageServerLoad = async ({ locals, params, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	const exam = await findExam(api, params.id);
	if (!exam) error(404, 'That exam could not be found.');

	const [subjectsRes, studentsRes, classesRes] = await Promise.all([
		api.GET('/v1/subjects'),
		api.GET('/v1/students', {
			params: {
				query: {
					limit: 100,
					...(exam.grade_level_id ? { grade_level_id: exam.grade_level_id } : {})
				}
			}
		}),
		api.GET('/v1/classes')
	]);

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		exam,
		subjects: subjectsRes.data?.subjects ?? [],
		students: studentsRes.data?.students ?? [],
		classes: classesRes.data?.classes ?? []
	};
};

export const actions: Actions = {
	/*
		Enter marks. The grid names a full mark per subject and an obtained mark per
		student × subject; a cell left blank is not a zero, so only the cells that were
		filled become marks. The numbers are checked here before the request leaves, and
		muallim-api checks them again.
	*/
	enterMarks: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const formData = await request.formData();

		const marks: MarkInput[] = [];
		for (const [key, raw] of formData) {
			// obtained:<student_id>:<subject_id> — a colon, because the ids are UUIDs and
			// carry hyphens of their own.
			if (!key.startsWith('obtained:')) continue;
			const value = String(raw).trim();
			if (value === '') continue;

			const [, studentId, subjectId] = key.split(':');
			if (!studentId || !subjectId) continue;

			const obtained = Number(value);
			const fullRaw = String(formData.get(`full:${subjectId}`) ?? '').trim();
			const full_marks = Number(fullRaw);

			if (!Number.isFinite(obtained) || obtained < 0) {
				return fail(400, { message: 'A mark must be a number, zero or more.' });
			}
			if (!Number.isFinite(full_marks) || full_marks <= 0) {
				return fail(400, { message: 'Give each marked subject a full mark greater than zero.' });
			}
			if (obtained > full_marks) {
				return fail(400, { message: 'A mark cannot be more than the subject’s full marks.' });
			}

			marks.push({ student_id: studentId, subject_id: subjectId, full_marks, obtained });
		}

		if (marks.length === 0) {
			return fail(400, { message: 'Enter at least one mark before saving.' });
		}

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/exams/{id}/marks', {
			params: { path: { id: params.id } },
			body: { marks }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Those marks could not be saved.')
			});
		}

		return { entered: data.entered };
	}
};
