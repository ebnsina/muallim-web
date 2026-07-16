import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const cursor = url.searchParams.get('cursor') ?? undefined;
	const api = authedApi(url.origin, locals.accessToken);
	const [list, prefs] = await Promise.all([
		api.GET('/v1/notifications', { params: { query: { limit: 20, cursor } } }),
		api.GET('/v1/notifications/preferences')
	]);

	return {
		notifications: list.data?.notifications ?? [],
		nextCursor: list.data?.next_cursor ?? '',
		emailDigest: prefs.data?.email_digest ?? true
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
				message: problemMessage(
					problem,
					"We couldn't mark your notifications as read. Please try again."
				)
			});
		}
		return { allRead: true };
	},

	setDigest: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const emailDigest = String((await request.formData()).get('email_digest') ?? '') === 'true';

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/notifications/preferences',
			{ body: { email_digest: emailDigest } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't save that setting. Please try again.")
			});
		}
		return { digestSaved: true };
	}
};
