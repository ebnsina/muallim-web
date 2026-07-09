import { browser } from '$app/environment';
import createClient from 'openapi-fetch';
import type { paths } from './schema';

/**
 * The base URL of lms-api. Public because the browser calls the API directly;
 * nothing secret belongs here.
 */
const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * The typed lms-api client. Its methods and payloads are generated from the
 * API's OpenAPI document (`pnpm gen:api`), so a breaking change upstream fails
 * `pnpm check` here rather than in production.
 *
 * This module is the only place permitted to call lms-api. Components receive
 * data through `load`; they do not fetch.
 */
export const api = createClient<paths>({ baseUrl });

/**
 * Builds a client bound to the `fetch` SvelteKit hands a `load` function. That
 * fetch forwards cookies and lets SSR responses be reused on hydration instead
 * of being requested a second time.
 *
 * `origin` must be `url.origin` from the same `load`. During SSR, SvelteKit
 * simulates the browser's CORS rules and rejects any cross-origin response whose
 * Access-Control-Allow-Origin does not match the app's origin — but Node sends no
 * Origin request header, so a correctly implemented API returns no CORS headers
 * and the check fails. Setting Origin explicitly makes the server-rendered
 * request identical to the one the browser will send, which is exactly the
 * consistency SvelteKit's simulation exists to enforce.
 *
 * The header is only set on the server: Origin is a forbidden header name in
 * browsers, where it is set automatically and cannot be overridden.
 */
export function apiFor(fetch: typeof globalThis.fetch, origin?: string) {
	const client = createClient<paths>({ baseUrl, fetch });

	if (!browser && origin) {
		client.use({
			onRequest({ request }) {
				request.headers.set('Origin', origin);
				return request;
			}
		});
	}

	return client;
}
