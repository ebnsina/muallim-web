import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { addPeriodSchema } from '$lib/timetable';
import type { Section } from '$lib/students';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/*
	A section's week. A class and section name the timetable; the periods come back with
	their day, times, subject, teacher and room. Subjects are loaded alongside so the
	picker can offer them and the grid can name the one a period teaches.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) {
		redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}

	const api = authedApi(url.origin, locals.accessToken);

	const classId = url.searchParams.get('class') ?? '';
	const sectionId = url.searchParams.get('section') ?? '';

	const [classesRes, subjectsRes] = await Promise.all([
		api.GET('/v1/classes'),
		api.GET('/v1/subjects')
	]);

	if (classesRes.error || !classesRes.data) {
		error(
			classesRes.response?.status ?? 500,
			problemMessage(classesRes.error, 'This institution’s classes could not be loaded.')
		);
	}

	const classes = classesRes.data.classes ?? [];

	const sectionLists = await Promise.all(
		classes.map((klass) =>
			api.GET('/v1/classes/{id}/sections', { params: { path: { id: klass.id } } })
		)
	);
	const sectionsByClass: Record<string, Section[]> = {};
	classes.forEach((klass, index) => {
		sectionsByClass[klass.id] = sectionLists[index].data?.sections ?? [];
	});

	// The timetable, once a section is chosen.
	const timetableRes = sectionId
		? await api.GET('/v1/sections/{id}/timetable', { params: { path: { id: sectionId } } })
		: undefined;
	if (timetableRes?.error) {
		error(
			timetableRes.response?.status ?? 500,
			problemMessage(timetableRes.error, 'This section’s timetable could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		classes,
		sectionsByClass,
		subjects: subjectsRes.data?.subjects ?? [],
		classId,
		sectionId,
		periods: timetableRes?.data?.periods ?? null
	};
};

export const actions: Actions = {
	/*
		Add a period. The section is on the path; the day, times, and the optional
		subject, teacher and room are the body. A clash with a period already in the slot
		is the API's 422, printed with the sentence it came with.
	*/
	add: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const sectionId = String(form.get('section_id') ?? '');
		if (!sectionId) return fail(400, { message: 'Choose a section first.' });

		const parsed = parseForm(addPeriodSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { day_of_week, starts_at, ends_at, subject_id, teacher_name, room } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/sections/{id}/timetable', {
			params: { path: { id: sectionId } },
			body: {
				day_of_week,
				starts_at,
				ends_at,
				...(subject_id ? { subject_id } : {}),
				...(teacher_name ? { teacher_name } : {}),
				...(room ? { room } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That period could not be added.')
			});
		}

		return { added: data.period };
	},

	/** Remove a period. The API answers 204 and the slot is free; the grid reloads without it. */
	remove: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const periodId = String((await request.formData()).get('period_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/timetable/{id}',
			{ params: { path: { id: periodId } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That period could not be removed.')
			});
		}

		return { removed: periodId };
	}
};
