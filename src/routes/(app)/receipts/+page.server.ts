import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 50;

/*
	What this learner has bought.

	An order names a course by id and nothing else, so the catalog is read alongside
	it and the two are stitched by id. A course that is no longer listed keeps its
	order: the row shows what was paid, and simply has no title to link to.
*/
export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);
	const [orders, catalog] = await Promise.all([
		api.GET('/v1/me/orders', { params: { query: { limit: PAGE_SIZE } } }),
		api.GET('/v1/courses', { params: { query: { limit: PAGE_SIZE } } })
	]);

	// A 503 is a deployment that takes no payments at all, and it renders as one.
	if (orders.error || !orders.data) {
		error(
			orders.response?.status ?? 500,
			problemMessage(orders.error, "We couldn't load your purchases. Please try again.")
		);
	}

	const courses = new Map(
		(catalog.data?.courses ?? []).map((c) => [c.id, { slug: c.slug, title: c.title }])
	);

	return {
		orders: (orders.data.orders ?? []).map((order) => ({
			...order,
			course: courses.get(order.course_id) ?? null
		}))
	};
};
