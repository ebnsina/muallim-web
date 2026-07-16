import { error, json } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { RequestHandler } from './$types';

/**
 * Mints a fresh chat WebSocket ticket for the browser.
 *
 * The socket connects to muallim-api directly — a different origin than this app —
 * so it cannot present the session cookie, which is httpOnly by design. Instead
 * the browser opens the socket with a single-use ticket, and a ticket can only be
 * minted with the bearer token, which lives here on the server. So the browser
 * POSTs here; we ask muallim-api on its behalf and hand back the ticket alone.
 *
 * A POST, not a GET: it is a credential exchange with a server-side effect
 * (muallim-api records the ticket), and a GET for one would be cacheable and
 * CSRF-reachable. The ticket expires in 60s and dies on first use, so the browser
 * calls this again on every reconnect.
 */
export const POST: RequestHandler = async ({ locals, url }) => {
	if (!locals.accessToken) error(401, 'Sign in to open chat.');

	const { data, error: apiError } = await authedApi(url.origin, locals.accessToken).POST(
		'/v1/chat/ws-ticket'
	);

	if (apiError || !data) {
		error(503, problemMessage(apiError, 'Chat is unavailable right now.'));
	}

	return json({ ticket: data.ticket });
};
