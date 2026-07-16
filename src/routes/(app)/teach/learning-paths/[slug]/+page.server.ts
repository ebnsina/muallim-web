import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { editPathSchema } from '$lib/learnpath';
import { authedApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/*
	One learning path, its ordered course ids, and the workspace's courses to name them
	by and to pick from. The course list is the authored listing `teach` uses — a few
	hundred is enough to map ids to titles and to fill the "add course" picker; a
	workspace with more would page it, but a path of that size is not the common case.
*/
export const load: PageServerLoad = async ({ locals, params, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	const [pathRes, coursesRes] = await Promise.all([
		api.GET('/v1/learning-paths/{slug}', { params: { path: { slug: params.slug } } }),
		api.GET('/v1/me/courses', { params: { query: { limit: 200 } } })
	]);

	if (pathRes.error || !pathRes.data) {
		error(
			pathRes.response?.status ?? 500,
			problemMessage(pathRes.error, 'That path could not be found.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		path: pathRes.data.path,
		courses: coursesRes.data?.courses ?? []
	};
};

export const actions: Actions = {
	/** Edit the title and description. The status is left untouched by this update. */
	edit: async ({ request, locals, url, params }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const parsed = parseForm(editPathSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { title, description } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/learning-paths/{slug}', {
			params: { path: { slug: params.slug } },
			body: { title, description }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That path could not be saved.')
			});
		}

		return { savedPath: data.path };
	},

	/*
		Flip the status. Publishing makes the path a learner can follow; unpublishing
		returns it to a draft. The desired status rides in the form.
	*/
	setStatus: async ({ request, locals, url, params }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const raw = String((await request.formData()).get('status') ?? '');
		const status = raw === 'published' ? 'published' : 'draft';

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/learning-paths/{slug}', {
			params: { path: { slug: params.slug } },
			body: { status }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That path’s status could not be changed.')
			});
		}

		return { savedPath: data.path };
	},

	/*
		Replace the whole ordered course list. muallim-api demands each course be named
		exactly once — a partial or duplicated list is a 409, surfaced to the reader
		rather than half-applied.
	*/
	setCourses: async ({ request, locals, url, params }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const ids = (await request.formData()).getAll('course_ids').map(String).filter(Boolean);

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).PUT('/v1/learning-paths/{slug}/courses', {
			params: { path: { slug: params.slug } },
			body: { course_ids: ids }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The course order could not be saved.')
			});
		}

		return { savedPath: data.path };
	}
};
