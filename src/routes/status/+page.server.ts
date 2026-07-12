import { problemMessage } from '$lib/api';
import { serverApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * The outcome of probing muallim-api. A network failure is a state we render, not an
 * exception that blanks the page — the API being down should not take the front
 * end down with it.
 */
export type ApiStatus =
	| { kind: 'ok'; version: string }
	| { kind: 'unreachable' }
	| { kind: 'error'; status: number; message: string };

/**
 * Server-side, like every other call to muallim-api in this app.
 *
 * There is no browser-side API client any more. Authenticated reads cannot use
 * one — the access token is in an httpOnly cookie precisely so no script can
 * read it — and the anonymous reads all happen in `+page.server.ts` too, because
 * what muallim-api returns depends on whether a token accompanied the request. A
 * client-side client would be a path with no callers and one sharp edge: a
 * relative `/api` URL, resolved during SSR, never leaves the SvelteKit server
 * and so never reaches the proxy that fronts muallim-api.
 */
export const load: PageServerLoad = async ({ url }): Promise<{ apiStatus: ApiStatus }> => {
	try {
		const { data, error, response } = await serverApi(url.origin).GET('/v1/healthz');

		if (error || !data) {
			return {
				apiStatus: { kind: 'error', status: response.status, message: problemMessage(error) }
			};
		}
		return { apiStatus: { kind: 'ok', version: data.version } };
	} catch {
		// fetch rejects on DNS failure, connection refused, and offline. None of
		// those are bugs, and none should reach handleError.
		return { apiStatus: { kind: 'unreachable' } };
	}
};
