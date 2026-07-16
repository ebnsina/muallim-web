import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { guardianAccountSchema, guardianSchema, updateStudentSchema } from '$lib/schemas';
import type { Section } from '$lib/students';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** Enough of the workspace to fill the "who signs in" picker; the rest is behind a cursor. */
const MEMBER_LIMIT = 100;

/*
	One student: their record, their guardians, and the classes they can be placed
	into. A student who does not exist — or belongs to another workspace — is the
	API's 404, shown as it came; admitting existence to a stranger is what a 404 avoids.
*/
export const load: PageServerLoad = async ({ locals, params, url, setHeaders }) => {
	if (!locals.accessToken) {
		redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}

	const api = authedApi(url.origin, locals.accessToken);

	const [studentRes, guardiansRes, classesRes, membersRes] = await Promise.all([
		api.GET('/v1/students/{id}', { params: { path: { id: params.id } } }),
		api.GET('/v1/students/{id}/guardians', { params: { path: { id: params.id } } }),
		api.GET('/v1/classes'),
		api.GET('/v1/members', { params: { query: { limit: MEMBER_LIMIT } } })
	]);

	if (studentRes.error || !studentRes.data) {
		error(
			studentRes.response?.status ?? 500,
			problemMessage(studentRes.error, 'We couldn’t open that student’s record. Please try again.')
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
		student: studentRes.data.student,
		guardians: guardiansRes.data?.guardians ?? [],
		classes,
		sectionsByClass,

		// Empty when this reader may not see the people list; the picker then says so
		// rather than offering an empty menu with no explanation.
		members: membersRes.data?.members ?? []
	};
};

export const actions: Actions = {
	/*
		Edit the record. The name and status always go; a placement may be cleared by
		leaving the picker on its blank option, which is an unplaced student, not an error.
	*/
	update: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(updateStudentSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PATCH('/v1/students/{id}', {
			params: { path: { id: params.id } },
			body: parsed.value
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t save your changes. Please try again.')
			});
		}

		return { updated: data.student };
	},

	/*
		Add a guardian. Only the name is required; a blank email or phone is left off the
		wire rather than sent empty, which the API would refuse as a malformed address.
	*/
	addGuardian: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(guardianSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { full_name, relation, phone, email, is_primary } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/students/{id}/guardians', {
			params: { path: { id: params.id } },
			body: {
				full_name,
				is_primary,
				...(relation ? { relation } : {}),
				...(phone ? { phone } : {}),
				...(email ? { email } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t add that guardian. Please try again.')
			});
		}

		return { added: data.guardian };
	},

	/*
		Remove the student. The API answers 204 and the row is gone, so there is nothing
		to return to — the action redirects back to the roster, which reloads without them.
	*/
	remove: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/students/{id}',
			{ params: { path: { id: params.id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t remove that student. Please try again.')
			});
		}

		redirect(303, '/manage/students');
	},

	/*
		Give a guardian a sign-in. The account must already be in this workspace — the API
		ties the guardian to it and never creates one, so an address nobody holds is not a
		person this can reach. It answers 204: there is nothing to read back but success.
	*/
	linkAccount: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const guardianId = String(form.get('guardian_id') ?? '');

		const parsed = parseForm(guardianAccountSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/students/{id}/guardians/{guardian_id}/account',
			{
				params: { path: { id: params.id, guardian_id: guardianId } },
				body: { user_id: parsed.value.user_id }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(
					problem,
					'We couldn’t give that guardian a sign-in. Please try again.'
				)
			});
		}

		return { linked: guardianId };
	},

	/** Unlink a guardian. The guardian record survives; only the link to this student goes. */
	removeGuardian: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const guardianId = String((await request.formData()).get('guardian_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/students/{id}/guardians/{guardian_id}',
			{
				params: { path: { id: params.id, guardian_id: guardianId } }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'We couldn’t remove that guardian. Please try again.')
			});
		}

		return { removed: guardianId };
	}
};
