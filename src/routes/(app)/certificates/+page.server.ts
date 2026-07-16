import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/** The certificates this learner has earned, newest first. */
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/me/certificates');

	if (problem || !data) {
		error(
			response?.status ?? 500,
			problemMessage(problem, "We couldn't load your certificates. Please try again.")
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return { certificates: data.certificates ?? [] };
};
