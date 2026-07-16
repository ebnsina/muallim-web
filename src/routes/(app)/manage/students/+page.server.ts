import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { admitStudentSchema } from '$lib/schemas';
import type { Section } from '$lib/students';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of the roster. muallim-api caps at 100; the rest is behind a cursor. */
const PAGE_SIZE = 50;

/*
	The roster, and the classes it is placed into.

	The class list is small and unpaginated, so its sections are loaded alongside it —
	a handful of parallel reads, once per page, not one per student. That map names
	every class and section a student can sit in, which both the table (to show a
	placement by name) and the admit form (to offer the pickers) read from.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fstudents');

	const api = authedApi(url.origin, locals.accessToken);

	// A blank filter is "everyone"; the API takes no `grade_level_id` at all.
	const gradeLevelId = url.searchParams.get('class') ?? '';

	const [classesRes, studentsRes] = await Promise.all([
		api.GET('/v1/classes'),
		api.GET('/v1/students', {
			params: {
				query: { limit: PAGE_SIZE, ...(gradeLevelId ? { grade_level_id: gradeLevelId } : {}) }
			}
		})
	]);

	if (classesRes.error || !classesRes.data) {
		error(
			classesRes.response?.status ?? 500,
			problemMessage(classesRes.error, 'We couldn’t load your classes. Please try again.')
		);
	}
	if (studentsRes.error || !studentsRes.data) {
		error(
			studentsRes.response?.status ?? 500,
			problemMessage(studentsRes.error, 'We couldn’t load your students. Please try again.')
		);
	}

	const classes = classesRes.data.classes ?? [];

	// Sections per class, in parallel. Bounded by the class list, which does not page.
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
		students: pageOf(
			studentsRes.data.students,
			studentsRes.data.next_cursor,
			studentsRes.data.has_more
		),
		classes,
		sectionsByClass,
		gradeLevelId
	};
};

export const actions: Actions = {
	/*
		Admit a student. The admission number and name are required; the placement is
		optional, so an unplaced student is a legal one. A duplicate admission number is
		the API's 409, and the page prints the sentence it came with.
	*/
	admit: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fstudents');

		const parsed = parseForm(admitStudentSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/students', {
			body: parsed.value
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t admit that student. Please try again.')
			});
		}

		// The row itself, so the page can put the new student at the head of the list
		// without re-reading a roster a reader may be several pages into.
		return { admitted: data.student };
	},

	/*
		The next page. The cursor is opaque and goes back unread; the filter travels
		with it so a page-two of a filtered roster stays filtered.
	*/
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fstudents');

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
				message: problemMessage(problem, 'We couldn’t load more students. Please try again.')
			});
		}

		return { more: pageOf(data.students, data.next_cursor, data.has_more) };
	}
};
