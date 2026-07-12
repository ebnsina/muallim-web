import createClient from 'openapi-fetch';
import type { paths } from '$lib/api/schema';

/**
 * muallim-api is reached at `/api` on the origin of the request being served.
 *
 * It resolves the workspace from the Host header — port stripped, first label
 * taken as the subdomain — so the host a request arrives on decides which
 * workspace answers it. Calling muallim-api directly on an internal address would
 * send it muallim-api's own hostname and resolve the wrong workspace, or none.
 *
 * The obvious fix, calling the internal address while overriding the Host
 * header, is not available: `Host` is a forbidden header name for `fetch`, and
 * Node's implementation silently drops it. A request routed through the edge
 * carries the right Host by construction, and needs no header we have to
 * remember to set or muallim-api has to be persuaded to trust.
 *
 * In development a Vite proxy plays the edge. In production the edge routes
 * `acme.muallim.com/api/*` to muallim-api and everything else here.
 */
function baseUrlFor(origin: string): string {
	return `${origin}/api`;
}

/**
 * A client for calls that carry no credentials: login, register, and the token
 * exchanges that mint a session.
 */
export function serverApi(origin: string) {
	return createClient<paths>({ baseUrl: baseUrlFor(origin) });
}

/**
 * A client that authenticates as the bearer of `accessToken`.
 *
 * Only ever constructed on the server. The access token lives in an httpOnly
 * cookie precisely so that no script in the page can read it, and handing it to
 * a client-side fetch would undo that.
 */
export function authedApi(origin: string, accessToken: string) {
	const client = createClient<paths>({ baseUrl: baseUrlFor(origin) });

	client.use({
		onRequest({ request }) {
			request.headers.set('Authorization', `Bearer ${accessToken}`);
			return request;
		}
	});

	return client;
}

/**
 * The client to read the catalog with.
 *
 * Course listings, curricula, and lesson content are all readable without a
 * session — that is what a published course and a preview lesson are for — but
 * what comes back depends on who is asking. An author sees their own drafts; an
 * enrolled learner sees lesson bodies; a stranger sees neither, and is told the
 * lesson does not exist rather than that they may not have it.
 *
 * muallim-api makes that decision from the bearer token, so an anonymous read is a
 * request with no token rather than a different endpoint. Sending the token
 * whenever there is one is therefore the whole of the rule.
 */
export function apiAs(origin: string, accessToken: string | null) {
	return accessToken ? authedApi(origin, accessToken) : serverApi(origin);
}
