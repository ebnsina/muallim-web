import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
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
		const title = String(form.get('title') ?? '').trim();
		const body = String(form.get('body') ?? '').trim();
		if (!title || !body) return fail(400, { message: 'A thread needs a title and a body.' });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/forum/spaces/{id}/threads', {
			params: { path: { id: params.id } },
			body: { title, body }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not start that thread.')
			});
		}

		// Straight into the new thread, where the author will want to be.
		redirect(303, `/forum/threads/${data.thread.id}`);
	}
};
