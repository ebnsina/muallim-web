import { error, fail } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/**
 * The workspace's certificate templates.
 *
 * `/teach/+layout.server.ts` has established `course:write`, which is what the
 * API's template endpoints require. The built-in default comes back first, and is
 * not something anybody may edit or delete.
 */
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) error(401, 'Sign in to manage certificate templates.');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/certificate-templates');

	if (problem || !data) {
		error(
			response?.status ?? 500,
			problemMessage(problem, 'Certificate templates could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return { templates: data.templates ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to manage certificate templates.');

		const form = await request.formData();

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/certificate-templates',
			{
				body: {
					name: String(form.get('name') ?? '').trim(),
					title: String(form.get('title') ?? '').trim(),
					body: String(form.get('body') ?? '').trim(),
					signatory: String(form.get('signatory') ?? '').trim()
				}
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That template could not be saved.')
			});
		}

		return { created: String(form.get('name') ?? '') };
	},

	/** Courses printing it fall back to the default; certificates already issued
	 *  keep the words they were issued with. */
	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to manage certificate templates.');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/certificate-templates/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That template could not be removed.')
			});
		}

		return { deleted: true };
	}
};
