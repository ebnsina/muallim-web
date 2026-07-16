import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { classCreateSchema, sectionCreateSchema, subjectCreateSchema } from '$lib/classes';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

const LOGIN = '/login?next=%2Fmanage%2Fclasses';

/*
	The academic foundation: the classes a school teaches, one class's sections, and the
	subjects taught across them. Sections belong to a class, so only the selected class's
	are fetched — one request each rather than one per class in a loop.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, LOGIN);

	const api = authedApi(url.origin, locals.accessToken);

	const [classesRes, subjectsRes] = await Promise.all([
		api.GET('/v1/classes'),
		api.GET('/v1/subjects')
	]);

	if (classesRes.error || !classesRes.data) {
		error(
			classesRes.response?.status ?? 500,
			problemMessage(classesRes.error, 'We couldn’t load your classes. Please try again.')
		);
	}

	const classes = classesRes.data.classes ?? [];

	// A class named in the address that no longer exists falls back to the first, so a
	// deleted class leaves the page on something real rather than on nothing.
	const asked = url.searchParams.get('class') ?? '';
	const selected = classes.find((c) => c.id === asked) ?? classes[0];

	const sectionsRes = selected
		? await api.GET('/v1/classes/{id}/sections', { params: { path: { id: selected.id } } })
		: null;

	// The sections are not fatal to the page: the class list stands without them, so a
	// failed fetch degrades to a notice in its own panel rather than an error page.
	const sectionsError =
		sectionsRes && (sectionsRes.error || !sectionsRes.data)
			? problemMessage(
					sectionsRes.error,
					'We couldn’t load this class’s sections. Please try again.'
				)
			: null;

	const subjectsError =
		subjectsRes.error || !subjectsRes.data
			? problemMessage(subjectsRes.error, 'We couldn’t load your subjects. Please try again.')
			: null;

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		classes,
		selectedId: selected?.id ?? '',
		sections: sectionsRes?.data?.sections ?? [],
		sectionsError,
		subjects: subjectsRes.data?.subjects ?? [],
		subjectsError
	};
};

export const actions: Actions = {
	/** Open a class. Rank orders it among the others, junior to senior. */
	createClass: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const parsed = parseForm(classCreateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/classes', {
			body: { name: parsed.value.name, rank: parsed.value.rank }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t create that class. Please try again.')
			});
		}

		return { createdClass: data.class };
	},

	/** Remove a class. Its sections go with it — the API cascades. */
	deleteClass: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/classes/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t delete that class. Please try again.')
			});
		}

		return { deletedClass: id };
	},

	/** Add a section to a class — the group a student actually sits in. */
	createSection: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const form = await request.formData();
		const classId = String(form.get('class_id') ?? '');

		const parsed = parseForm(sectionCreateSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/classes/{id}/sections', {
			params: { path: { id: classId } },
			body: { name: parsed.value.name, capacity: parsed.value.capacity }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t add that section. Please try again.')
			});
		}

		return { createdSection: data.section };
	},

	/** Remove a section from its class. */
	deleteSection: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/sections/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t delete that section. Please try again.')
			});
		}

		return { deletedSection: id };
	},

	/** Add a subject. Subjects are the school's, not one class's. */
	createSubject: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const parsed = parseForm(subjectCreateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, code } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/subjects', {
			body: { name, ...(code ? { code } : {}) }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t add that subject. Please try again.')
			});
		}

		return { createdSubject: data.subject };
	},

	/** Remove a subject from the school's list. */
	deleteSubject: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, LOGIN);

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/subjects/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t delete that subject. Please try again.')
			});
		}

		return { deletedSubject: id };
	}
};
