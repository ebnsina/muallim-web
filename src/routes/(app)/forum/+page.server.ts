import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { boardSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
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

		// The same schema the page ran. That one was a courtesy; this one decides.
		const parsed = parseForm(boardSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { title, description, course_slug: courseSlug } = parsed.value;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/forum/spaces',
			{ body: { title, description, course_slug: courseSlug || undefined } }
		);

		// A failure of the call, not of a field: it stays the page's voice.
		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not create that board.')
			});
		}
		return { created: true };
	}
};
