import { apiFor, problemMessage } from '$lib/api';
import type { PageLoad } from './$types';

/**
 * The outcome of probing lms-api. A network failure is a state we render, not an
 * exception that blanks the page — the API being down should not take the front
 * end down with it.
 */
export type ApiStatus =
	| { kind: 'ok'; version: string }
	| { kind: 'unreachable' }
	| { kind: 'error'; status: number; message: string };

export const load: PageLoad = async ({ fetch, url }): Promise<{ apiStatus: ApiStatus }> => {
	return { apiStatus: await probe(fetch, url.origin) };
};

async function probe(fetch: typeof globalThis.fetch, origin: string): Promise<ApiStatus> {
	try {
		const { data, error, response } = await apiFor(fetch, origin).GET('/v1/healthz');

		if (error || !data) {
			return { kind: 'error', status: response.status, message: problemMessage(error) };
		}
		return { kind: 'ok', version: data.version };
	} catch {
		// fetch rejects on DNS failure, connection refused, a CORS denial, and
		// offline. None of those are bugs, and none should reach handleError.
		return { kind: 'unreachable' };
	}
}
