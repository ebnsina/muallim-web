import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { markAttendanceSchema, today } from '$lib/attendance';
import type { Section } from '$lib/students';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/*
	Taking the register. A class and section name the room; a date names the day —
	today, unless the reader picks another. The register the API hands back is the
	section's whole roster with each student's status already on it, so one read gives
	both the names to mark and whatever was marked before.

	A separate lookup — a student and a window of dates — reads one learner's history.
	Both travel in the URL so a marked day, or a looked-up history, is a link.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) {
		redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}

	const api = authedApi(url.origin, locals.accessToken);

	const classId = url.searchParams.get('class') ?? '';
	const sectionId = url.searchParams.get('section') ?? '';
	const date = url.searchParams.get('date') || today();

	const studentId = url.searchParams.get('student') ?? '';
	const from = url.searchParams.get('from') ?? '';
	const to = url.searchParams.get('to') ?? '';

	const classesRes = await api.GET('/v1/classes');
	if (classesRes.error || !classesRes.data) {
		error(
			classesRes.response?.status ?? 500,
			problemMessage(classesRes.error, 'We couldn’t load your classes. Please try again.')
		);
	}

	const classes = classesRes.data.classes ?? [];

	// Sections per class, in parallel — bounded by the class list, which does not page.
	const sectionLists = await Promise.all(
		classes.map((klass) =>
			api.GET('/v1/classes/{id}/sections', { params: { path: { id: klass.id } } })
		)
	);
	const sectionsByClass: Record<string, Section[]> = {};
	classes.forEach((klass, index) => {
		sectionsByClass[klass.id] = sectionLists[index].data?.sections ?? [];
	});

	// The register, once a section is chosen — the roster and its statuses for the day.
	const registerRes = sectionId
		? await api.GET('/v1/attendance', { params: { query: { section_id: sectionId, date } } })
		: undefined;
	if (registerRes?.error) {
		error(
			registerRes.response?.status ?? 500,
			problemMessage(
				registerRes.error,
				'We couldn’t load the register for this section. Please try again.'
			)
		);
	}

	// One student's history, only when a whole valid window is asked for.
	const historyRes =
		studentId && from && to
			? await api.GET('/v1/students/{id}/attendance', {
					params: { path: { id: studentId }, query: { from, to } }
				})
			: undefined;
	if (historyRes?.error) {
		error(
			historyRes.response?.status ?? 500,
			problemMessage(
				historyRes.error,
				'We couldn’t load that student’s attendance. Please try again.'
			)
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		classes,
		sectionsByClass,
		classId,
		sectionId,
		date,
		register: registerRes?.data?.entries ?? null,
		history: historyRes
			? {
					student: studentId,
					from,
					to,
					days: historyRes.data?.days ?? [],
					summary: historyRes.data?.summary
				}
			: null
	};
};

export const actions: Actions = {
	/*
		Mark the register. The section, the date, and one status per student go up as
		`{ section_id, on_date, entries }`; the API answers with how many it recorded,
		which the page shows rather than re-reading a register the marker just set.
	*/
	mark: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(markAttendanceSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { section_id, on_date, student_id, status } = parsed.value;
		const entries = student_id.map((id, index) => ({ student_id: id, status: status[index] }));

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/attendance', {
			body: { section_id, on_date, entries }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t save the register. Please try again.')
			});
		}

		return { marked: data.marked };
	}
};
