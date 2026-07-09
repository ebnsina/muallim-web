import type { Handle, HandleServerError } from '@sveltejs/kit';
import { resolveAccessToken } from '$lib/server/session';

/**
 * Headers of an SSR `fetch` response that may be serialized into the HTML for
 * hydration. SvelteKit hides everything else, and reading a hidden header throws.
 *
 * `openapi-fetch` inspects content-length to decide whether a response has a
 * body, so it must be readable. The list stays minimal by design: anything added
 * here is embedded in the page source, which is why set-cookie and authorization
 * are not on it.
 */
const serializableHeaders = new Set(['content-length', 'content-type']);

/**
 * Resolves the session once per request, refreshing an expired access token if a
 * refresh token is still good.
 *
 * This is the only place a refresh happens. Refresh tokens rotate on use and a
 * token seen twice revokes the whole family, so concurrent refreshes must be
 * collapsed — which is only tractable if there is one place they occur.
 */
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.accessToken = await resolveAccessToken(event.cookies);

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => serializableHeaders.has(name.toLowerCase())
	});
};

/**
 * Catches every error SvelteKit did not expect — anything that was not thrown
 * with the `error()` helper — plus route-level 404s.
 *
 * The returned object becomes `page.error`, so it must contain nothing an
 * attacker could use. The real error is logged against a correlation ID; the
 * user gets only the ID.
 *
 * We reuse the `x-request-id` lms-api echoes when the failing request came from
 * the API, so one identifier spans both services.
 */
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const correlationId = event.request.headers.get('x-request-id') ?? crypto.randomUUID();

	// A 404 is a routing fact, not a failure. Logging its stack is noise.
	if (status !== 404) {
		console.error(
			JSON.stringify({
				level: 'error',
				msg: 'unhandled error',
				correlationId,
				status,
				method: event.request.method,
				path: event.url.pathname,
				error: error instanceof Error ? error.stack : String(error)
			})
		);
	}

	return {
		message: status === 404 ? 'Not found' : message,
		correlationId
	};
};
