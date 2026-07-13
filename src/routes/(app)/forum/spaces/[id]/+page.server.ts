import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { threadSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const cursor = url.searchParams.get('cursor') ?? undefined;
	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/forum/spaces/{id}/threads', {
		params: { path: { id: params.id }, query: { cursor, limit: 20 } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'That board could not be loaded.'));
	}

	return {
		space: data.space,
		threads: data.threads ?? [],
		nextCursor: data.next_cursor ?? ''
	};
};

export const actions: Actions = {
	startThread: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();

		// The same schema the page ran. That one was a courtesy; this one decides.
		const parsed = parseForm(threadSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { title, body } = parsed.value;

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/forum/spaces/{id}/threads', {
			params: { path: { id: params.id } },
			body: { title, body }
		});

		// A failure of the call, not of a field: it stays the page's voice.
		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not start that thread.')
			});
		}

		// Straight into the new thread, where the author will want to be.
		redirect(303, `/forum/threads/${data.thread.id}`);
	}
};
