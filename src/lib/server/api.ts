import createClient from 'openapi-fetch';
import { env } from '$env/dynamic/private';
import type { paths } from '$lib/api/schema';

/**
 * The base URL of lms-api as reached from *this server*, not from a browser.
 *
 * lms-api resolves the tenant from the Host header (port stripped, first label
 * taken as the subdomain), so `localhost:8080` resolves the workspace whose
 * subdomain is `localhost`. In a real deployment each workspace therefore needs
 * its own API host, and this value has to be derived per request rather than
 * read from the environment once. Not yet: today there is one workspace.
 */
const baseUrl = env.LMS_API_URL ?? 'http://localhost:8080';

/**
 * A client for calls that carry no credentials: login, register, and the token
 * exchanges that mint a session.
 *
 * It uses the global `fetch` rather than the one SvelteKit hands to `load`. That
 * one simulates the browser's CORS rules, which is right for a request the
 * browser will repeat and wrong for one it never makes.
 */
export const serverApi = createClient<paths>({ baseUrl });

/**
 * A client that authenticates as the bearer of `accessToken`.
 *
 * Only ever constructed on the server. The access token lives in an httpOnly
 * cookie precisely so that no script in the page can read it, and handing it to
 * a client-side fetch would undo that.
 */
export function authedApi(accessToken: string) {
	const client = createClient<paths>({ baseUrl });

	client.use({
		onRequest({ request }) {
			request.headers.set('Authorization', `Bearer ${accessToken}`);
			return request;
		}
	});

	return client;
}
