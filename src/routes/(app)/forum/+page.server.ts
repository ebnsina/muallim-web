import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const { data } = await authedApi(url.origin, locals.accessToken).GET('/v1/forum/spaces');
	return { spaces: data?.spaces ?? [] };
};

export const actions: Actions = {
	createSpace: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const courseSlug = String(form.get('course_slug') ?? '').trim();
		if (!title) return fail(400, { message: 'Give the board a title.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/forum/spaces',
			{ body: { title, description, course_slug: courseSlug || undefined } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not create that board.')
			});
		}
		return { created: true };
	}
};
