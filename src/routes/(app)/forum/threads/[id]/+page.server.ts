import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { replySchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
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
		error(
			response?.status ?? 500,
			problemMessage(problem, "We couldn't open that thread. Please try again.")
		);
	}

	return { thread: data.thread, posts: data.posts ?? [], nextCursor: data.next_cursor ?? '' };
};

export const actions: Actions = {
	reply: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		// The same schema the page ran. That one was a courtesy; this one decides.
		const parsed = parseForm(replySchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/forum/threads/{id}/posts',
			{ params: { path: { id: params.id } }, body: { body: parsed.value.body } }
		);

		// A failure of the call, not of a field: it stays the page's voice.
		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't post your reply. Please try again.")
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
				message: problemMessage(problem, "We couldn't update that thread. Please try again.")
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
				message: problemMessage(problem, "We couldn't delete that thread. Please try again.")
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
				message: problemMessage(problem, "We couldn't delete that reply. Please try again.")
			});
		}
	}
};
