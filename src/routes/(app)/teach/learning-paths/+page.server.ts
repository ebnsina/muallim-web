import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { createPathSchema, type PathStatus } from '$lib/learnpath';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** muallim-api caps a page of paths; the rest is behind a cursor. */
const PAGE_SIZE = 50;

/** A blank filter is "any status"; anything else must be one the API knows. */
function statusFilter(raw: string | null): PathStatus | '' {
	return raw === 'draft' || raw === 'published' ? raw : '';
}

/*
	The learning paths this workspace has authored, newest first, optionally narrowed
	to drafts or published ones. This route is only reachable by someone holding
	course:write; muallim-api enforces that and answers 403 otherwise, and the redirect
	below is for the unauthenticated case, where the useful instruction is "sign in".
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const status = statusFilter(url.searchParams.get('status'));

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/learning-paths', {
		params: { query: { limit: PAGE_SIZE, ...(status ? { status } : {}) } }
	});

	if (problem || !data) {
		error(
			response?.status ?? 500,
			problemMessage(problem, 'Your learning paths could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		paths: pageOf(data.paths, data.next_cursor, data.has_more),
		status
	};
};

export const actions: Actions = {
	/*
		Create a path. A title and slug are required; the API always makes it a draft,
		and publishing is a later update from the detail page.
	*/
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Flearning-paths');

		const parsed = parseForm(createPathSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { title, slug, description } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/learning-paths', {
			body: { title, slug, ...(description ? { description } : {}) }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That path could not be created.')
			});
		}

		return { createdPath: data.path };
	},

	/** Delete a path. The API answers 204; the row is gone. */
	remove: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Flearning-paths');

		const slug = String((await request.formData()).get('slug') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/learning-paths/{slug}',
			{ params: { path: { slug } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That path could not be deleted.')
			});
		}

		return { deletedSlug: slug };
	},

	/** The next page of paths. The cursor is opaque; the status filter travels with it. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Flearning-paths');

		const form = await request.formData();
		const cursor = String(form.get('cursor') ?? '');
		const status = statusFilter(String(form.get('status') ?? ''));

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/learning-paths', {
			params: { query: { limit: PAGE_SIZE, cursor, ...(status ? { status } : {}) } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of paths could not be loaded.')
			});
		}

		return { more: pageOf(data.paths, data.next_cursor, data.has_more) };
	}
};
