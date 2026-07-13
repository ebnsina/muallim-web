import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 50;

/*
	What this workspace has sold.

	The order names a course by id and a learner not at all — muallim-api does not
	return one, so this page does not show one. The author's own courses supply the
	titles, stitched by id.
*/
export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);
	const [orders, mine] = await Promise.all([
		api.GET('/v1/orders', { params: { query: { limit: PAGE_SIZE } } }),
		api.GET('/v1/me/courses', { params: { query: { limit: PAGE_SIZE } } })
	]);

	// 403 for a learner who followed the link, 503 for a deployment that sells nothing.
	if (orders.error || !orders.data) {
		error(
			orders.response?.status ?? 500,
			problemMessage(orders.error, 'Could not load your sales.')
		);
	}

	const courses = new Map(
		(mine.data?.courses ?? []).map((c) => [c.id, { slug: c.slug, title: c.title }])
	);

	return {
		orders: (orders.data.orders ?? []).map((order) => ({
			...order,
			course: courses.get(order.course_id) ?? null
		}))
	};
};

export const actions: Actions = {
	/** Give the money back. The API asks the gateway first, and withdraws the enrolment. */
	refund: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fsales');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/orders/{id}/refund',
			{ params: { path: { id } } }
		);

		// 409 (took no money, or the gateway cannot refund it) and 503 (no keys) both
		// carry a detail worth reading. It is shown rather than replaced.
		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not refund that order.')
			});
		}

		return { refunded: id };
	}
};
