import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { bundleCreateSchema, toMinor } from '$lib/bundles';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of bundles. muallim-api caps the rest behind a cursor. */
const PAGE_SIZE = 50;

/*
	The bundles desk: every course bundle this workspace sells, newest first, keyset
	paginated. A listing omits each bundle's course_ids — those are fetched one
	bundle at a time on its own page — so the count shown here comes with the detail,
	never from this list.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fbundles');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/bundles', {
		params: { query: { limit: PAGE_SIZE } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Your bundles could not be loaded.'));
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		bundles: pageOf(data.bundles, data.next_cursor, data.has_more)
	};
};

export const actions: Actions = {
	/*
		Create a bundle. The price arrives in major units — an admin prices in taka —
		and is sent to the API in minor. The new bundle holds no courses yet; they are
		added on its own page.
	*/
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fbundles');

		const parsed = parseForm(bundleCreateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, slug, description, price, currency } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/bundles', {
			body: {
				name,
				slug,
				price_amount: toMinor(price),
				currency,
				...(description ? { description } : {})
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That bundle could not be created.')
			});
		}

		return { createdBundle: data.bundle };
	},

	/** Delete a bundle. The API answers 204; the row is gone. */
	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fbundles');

		const slug = String((await request.formData()).get('slug') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/bundles/{slug}',
			{ params: { path: { slug } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That bundle could not be deleted.')
			});
		}

		return { deletedBundle: slug };
	},

	/** The next page of bundles. The cursor is opaque and goes back unread. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fbundles');

		const cursor = String((await request.formData()).get('cursor') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/bundles', {
			params: { query: { limit: PAGE_SIZE, cursor } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of bundles could not be loaded.')
			});
		}

		return { more: pageOf(data.bundles, data.next_cursor, data.has_more) };
	}
};
