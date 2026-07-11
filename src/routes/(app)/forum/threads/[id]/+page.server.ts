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
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/forum/threads/{id}', {
		params: { path: { id: params.id }, query: { cursor, limit: 30 } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'That thread could not be loaded.'));
	}

	return { thread: data.thread, posts: data.posts ?? [], nextCursor: data.next_cursor ?? '' };
};

export const actions: Actions = {
	reply: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const body = String((await request.formData()).get('body') ?? '').trim();
		if (!body) return fail(400, { message: 'Write a reply first.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/forum/threads/{id}/posts',
			{ params: { path: { id: params.id } }, body: { body } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not post that reply.')
			});
		}
		return { replied: true };
	},

	moderate: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const body: { pinned?: boolean; locked?: boolean } = {};
		if (form.has('pinned')) body.pinned = form.get('pinned') === 'true';
		if (form.has('locked')) body.locked = form.get('locked') === 'true';

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/forum/threads/{id}',
			{ params: { path: { id: params.id } }, body }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not update that thread.')
			});
		}
	},

	deleteThread: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const spaceId = String((await request.formData()).get('space_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/forum/threads/{id}',
			{ params: { path: { id: params.id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not delete that thread.')
			});
		}
		redirect(303, spaceId ? `/forum/spaces/${spaceId}` : '/forum');
	},

	deletePost: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/forum/posts/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not delete that reply.')
			});
		}
	}
};
