import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { bundleEditSchema, toMinor } from '$lib/bundles';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/*
	How many of the workspace's courses to load for the picker and the title map. A
	listing omits course titles, so a bundle's ordered ids are named against this
	list; a workspace with more courses than the cap filters the picker by typing,
	but the API bounds the page regardless.
*/
const COURSE_LIMIT = 100;

/*
	One bundle and everything needed to manage it: its own record (name, price, and
	its ordered course_ids), plus the workspace's courses to name those ids and to
	fill the "add a course" picker. The bundle omits nothing here — a detail fetch
	carries course_ids where a listing does not.
*/
export const load: PageServerLoad = async ({ params, locals, url, setHeaders }) => {
	const next = encodeURIComponent(url.pathname);
	if (!locals.accessToken) redirect(303, `/login?next=${next}`);

	const api = authedApi(url.origin, locals.accessToken);

	const [bundleRes, coursesRes] = await Promise.all([
		api.GET('/v1/bundles/{slug}', { params: { path: { slug: params.slug } } }),
		api.GET('/v1/me/courses', { params: { query: { limit: COURSE_LIMIT } } })
	]);

	if (bundleRes.error || !bundleRes.data) {
		error(
			bundleRes.response?.status ?? 500,
			problemMessage(bundleRes.error, 'That bundle could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		bundle: bundleRes.data.bundle,
		courses: coursesRes.data?.courses ?? []
	};
};

export const actions: Actions = {
	/*
		Save the bundle's name, description, and price. The price arrives in major
		units — an admin prices in taka — and is sent to the API in minor. The slug is
		the address and does not change here.
	*/
	save: async ({ request, params, locals, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const parsed = parseForm(bundleEditSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { name, description, price } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/bundles/{slug}', {
			params: { path: { slug: params.slug } },
			body: { name, description, price_amount: toMinor(price) }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Those changes could not be saved.')
			});
		}

		return { savedBundle: data.bundle };
	},

	/*
		Set the bundle's ordered course list. The page sends every course id in the
		order the admin arranged; the API replaces the list wholesale, so a removed
		course is one simply left out of the list.
	*/
	setCourses: async ({ request, params, locals, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const raw = String((await request.formData()).get('course_ids') ?? '');
		const courseIds = raw ? raw.split(',').filter(Boolean) : [];

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/bundles/{slug}/courses', {
			params: { path: { slug: params.slug } },
			body: { course_ids: courseIds }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The course list could not be saved.')
			});
		}

		return { savedCourses: data.bundle };
	}
};
