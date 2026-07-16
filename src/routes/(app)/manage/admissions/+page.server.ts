import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { admitAdmissionSchema, submitAdmissionSchema, type AdmissionStatus } from '$lib/admissions';
import type { Section } from '$lib/students';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of applications. muallim-api caps at 100; the rest is behind a cursor. */
const PAGE_SIZE = 50;

const STATUSES: AdmissionStatus[] = ['pending', 'accepted', 'rejected', 'admitted'];

/*
	The applications, and the classes they name.

	The class list is small and unpaginated, so its sections are loaded alongside it —
	a handful of parallel reads, once per page. That map names every class an applicant
	applied for (to show it), and the sections of each (to offer the admit dialog's picker).
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fadmissions');

	const api = authedApi(url.origin, locals.accessToken);

	// A blank filter is "any status"; the API takes no `status` at all.
	const raw = url.searchParams.get('status') ?? '';
	const status = STATUSES.includes(raw as AdmissionStatus) ? (raw as AdmissionStatus) : '';

	const [classesRes, applicationsRes] = await Promise.all([
		api.GET('/v1/classes'),
		api.GET('/v1/admissions', {
			params: { query: { limit: PAGE_SIZE, ...(status ? { status } : {}) } }
		})
	]);

	if (classesRes.error || !classesRes.data) {
		error(
			classesRes.response?.status ?? 500,
			problemMessage(classesRes.error, 'This institution’s classes could not be loaded.')
		);
	}
	if (applicationsRes.error || !applicationsRes.data) {
		error(
			applicationsRes.response?.status ?? 500,
			problemMessage(applicationsRes.error, 'The applications could not be loaded.')
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
		applications: pageOf(
			applicationsRes.data.applications,
			applicationsRes.data.next_cursor,
			applicationsRes.data.has_more
		),
		classes,
		sectionsByClass,
		status
	};
};

export const actions: Actions = {
	/*
		Submit an application. Only the applicant's name is required; the rest is the
		detail a school may not have yet. The API's validation is the one that decides.
	*/
	submit: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fadmissions');

		const parsed = parseForm(submitAdmissionSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/admissions', {
			body: parsed.value
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That application could not be submitted.')
			});
		}

		return { submitted: data.application };
	},

	/*
		Accept a pending application. Only pending can be decided — the API answers 409
		otherwise, and the page prints the sentence it came with.
	*/
	accept: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fadmissions');

		const id = String((await request.formData()).get('id') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/admissions/{id}/accept', {
			params: { path: { id } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That application could not be accepted.')
			});
		}

		return { decided: data.application };
	},

	/*
		Reject a pending application. As with accept, only pending can be decided.
	*/
	reject: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fadmissions');

		const id = String((await request.formData()).get('id') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/admissions/{id}/reject', {
			params: { path: { id } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That application could not be rejected.')
			});
		}

		return { decided: data.application };
	},

	/*
		Admit an accepted application. This creates the student (and a guardian from the
		application's guardian fields). Only an accepted application can be admitted — the
		API answers 409 otherwise. The response carries both the new student and the
		application, now marked admitted.
	*/
	admit: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fadmissions');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		const parsed = parseForm(admitAdmissionSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/admissions/{id}/admit', {
			params: { path: { id } },
			body: parsed.value
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That application could not be admitted.')
			});
		}

		return { admitted: { application: data.application, student: data.student } };
	},

	/*
		The next page. The cursor is opaque and goes back unread; the filter travels with
		it so a page-two of a filtered list stays filtered.
	*/
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fmanage%2Fadmissions');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const status = String(form.get('status') ?? '') as AdmissionStatus | '';

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/admissions', {
			params: { query: { limit: PAGE_SIZE, cursor, ...(status ? { status } : {}) } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of applications could not be loaded.')
			});
		}

		return { more: pageOf(data.applications, data.next_cursor, data.has_more) };
	}
};
