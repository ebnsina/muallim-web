import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { categorySchema } from '$lib/taxonomy';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/*
	The category vocabulary: the folders a workspace files courses under. A category is
	a name; muallim-api derives the slug. Assigning one to a course lives on its own
	page — this one only manages the list.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/course-categories');

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'The categories could not be loaded.'));
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return { categories: data.categories ?? [] };
};

export const actions: Actions = {
	/** Create a category. The slug is the server's to derive. */
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fcategories');

		const parsed = parseForm(categorySchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/course-categories', {
			body: { name: parsed.value.name }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That category could not be created.')
			});
		}

		return { createdCategory: data.category };
	},

	/** Delete a category. The API answers 204; the row is gone. */
	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fcategories');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/course-categories/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That category could not be deleted.')
			});
		}

		return { deletedCategory: id };
	}
};
