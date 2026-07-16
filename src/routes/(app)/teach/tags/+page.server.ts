import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { tagSchema } from '$lib/taxonomy';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/*
	The tag vocabulary: the labels a workspace attaches to courses. A tag is a name;
	muallim-api derives the slug. Attaching one to a course lives on its own page —
	this one only manages the list.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/course-tags');

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'The tags could not be loaded.'));
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return { tags: data.tags ?? [] };
};

export const actions: Actions = {
	/** Create a tag. The slug is the server's to derive. */
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Ftags');

		const parsed = parseForm(tagSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/course-tags', {
			body: { name: parsed.value.name }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That tag could not be created.')
			});
		}

		return { createdTag: data.tag };
	},

	/** Delete a tag. The API answers 204; the row is gone. */
	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Ftags');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/course-tags/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That tag could not be deleted.')
			});
		}

		return { deletedTag: id };
	}
};
