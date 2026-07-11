import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const cursor = url.searchParams.get('cursor') ?? undefined;
	const { data } = await authedApi(url.origin, locals.accessToken).GET('/v1/notifications', {
		params: { query: { limit: 20, cursor } }
	});

	return {
		notifications: data?.notifications ?? [],
		nextCursor: data?.next_cursor ?? ''
	};
};

/** A notification's link is our own API's, always a relative in-app path. Refuse
 *  anything that is not, so a stored link can never become an open redirect. */
function safeLink(link: string): string {
	return link.startsWith('/') && !link.startsWith('//') ? link : '/notifications';
}

export const actions: Actions = {
	// Open one: mark it read, then go where it points. One click, one round trip.
	open: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const link = safeLink(String(form.get('link') ?? ''));

		await authedApi(url.origin, locals.accessToken).POST('/v1/notifications/{id}/read', {
			params: { path: { id } }
		});

		redirect(303, link);
	},

	readAll: async ({ locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/notifications/read-all',
			{}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not mark your notifications read.')
			});
		}
		return { allRead: true };
	}
};
