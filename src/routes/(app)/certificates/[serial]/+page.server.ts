import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * One of the learner's own certificates.
 *
 * Read through the same verify endpoint the public page uses — a certificate is
 * public by its serial — but reached from inside the app, where a learner has a
 * header and a way back to the rest of their certificates. The signed-in read is
 * used so a private page is not served with a public cache header.
 */
export const load: PageServerLoad = async ({ locals, params, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/certificates/{serial}', {
		params: { path: { serial: params.serial } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'That certificate could not be found.'));
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return { certificate: data.certificate };
};
