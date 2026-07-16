import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { createTemplateSchema } from '$lib/idcard';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 24;

/**
 * The saved ID-card templates. muallim-api enforces the role and answers 403
 * otherwise; this redirect is for the unauthenticated case, where the useful
 * instruction is "sign in".
 */
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const cursor = url.searchParams.get('cursor');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/id-card-templates', {
		params: { query: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) } }
	});

	if (problem || !data) {
		error(
			response?.status ?? 500,
			problemMessage(problem, 'Could not load your ID-card templates.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		templates: data.templates ?? [],
		nextCursor: data.has_more ? (data.next_cursor ?? null) : null
	};
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fid-cards');

		const parsed = parseForm(createTemplateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/id-card-templates', {
			body: {
				name: parsed.value.name,
				subject: parsed.value.subject,
				orientation: parsed.value.orientation,
				accent: '#7c3aed',
				background_color: '#ffffff'
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not create that template.')
			});
		}

		// Straight into the designer for the template just made.
		redirect(303, `/teach/id-cards/${data.template.id}`);
	},

	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fid-cards');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/id-card-templates/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not delete that template.')
			});
		}
		return { deleted: id };
	}
};
