import { error } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { serverApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * Verify a certificate by its serial. No session.
 *
 * Whoever holds the number may read what it says — an employer, an admissions
 * office, a stranger. muallim-api serves this without a bearer token, and resolves the
 * workspace from the host like every other request, so a serial from another
 * workspace is one this one has never heard of.
 *
 * The response is `public, max-age=60` at the API. This page passes it through: a
 * certificate reads the same for everybody, and sixty seconds bounds how long a
 * revocation takes to be believed.
 */
export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const {
		data,
		error: problem,
		response
	} = await serverApi(url.origin).GET('/v1/certificates/{serial}', {
		params: { path: { serial: params.serial } }
	});

	if (problem || !data) {
		// 404 is the honest answer for a number nobody issued. It is not "forbidden":
		// there is nothing here to be forbidden from.
		error(response?.status ?? 500, problemMessage(problem, 'That certificate could not be found.'));
	}

	setHeaders({ 'cache-control': 'public, max-age=60' });

	return { certificate: data.certificate };
};
