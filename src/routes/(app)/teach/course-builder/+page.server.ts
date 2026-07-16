import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { blueprintSchema } from '$lib/coursebuild';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 30;

/**
 * The blueprint list. muallim-api scopes it to the workspace and the caller; the
 * redirect below is only for the unauthenticated case, where "sign in" is the
 * useful instruction rather than "you may not".
 */
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	// A designer's own working list: never a shared cache.
	setHeaders({ 'cache-control': 'private, no-store' });

	const cursor = url.searchParams.get('cursor');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/course-blueprints', {
		params: { query: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) } }
	});

	if (problem || !data) {
		return {
			blueprints: [],
			nextCursor: null,
			loadError: problemMessage(problem, 'Could not load your blueprints.'),
			status: response?.status ?? 500
		};
	}

	return {
		blueprints: data.blueprints ?? [],
		nextCursor: data.has_more ? (data.next_cursor ?? null) : null,
		loadError: null as string | null
	};
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fcourse-builder');

		const parsed = parseForm(blueprintSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, description } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/course-blueprints', {
			body: { name, description, structure: [] }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not create that blueprint.')
			});
		}

		// Straight into the builder for the blueprint just made.
		redirect(303, `/teach/course-builder/${data.blueprint.id}`);
	},

	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fcourse-builder');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/course-blueprints/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not delete that blueprint.')
			});
		}
		return { deleted: id };
	}
};
