import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 50;

/*
	Hifz is kept per student, so the section opens on the roster: choose whose recitation
	to log. The class filter narrows a large school to one room, the same way the student
	roster does; the classes it offers are loaded alongside the first page.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);
	const gradeLevelId = url.searchParams.get('class') ?? '';

	const [classesRes, studentsRes] = await Promise.all([
		api.GET('/v1/classes'),
		api.GET('/v1/students', {
			params: {
				query: { limit: PAGE_SIZE, ...(gradeLevelId ? { grade_level_id: gradeLevelId } : {}) }
			}
		})
	]);

	if (studentsRes.error || !studentsRes.data) {
		error(
			studentsRes.response?.status ?? 500,
			problemMessage(studentsRes.error, 'The student roster could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		students: pageOf(
			studentsRes.data.students,
			studentsRes.data.next_cursor,
			studentsRes.data.has_more
		),
		classes: classesRes.data?.classes ?? [],
		gradeLevelId
	};
};

export const actions: Actions = {
	/** The next page of the roster. The cursor and the filter travel back together. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const gradeLevelId = String(form.get('class') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/students', {
			params: {
				query: {
					limit: PAGE_SIZE,
					cursor,
					...(gradeLevelId ? { grade_level_id: gradeLevelId } : {})
				}
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of students could not be loaded.')
			});
		}

		return { more: pageOf(data.students, data.next_cursor, data.has_more) };
	}
};
