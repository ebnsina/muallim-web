import type { HandleClientError } from '@sveltejs/kit';

/**
 * The client-side counterpart to `handleError` in hooks.server.ts: it catches
 * errors thrown during client-side navigation and rendering.
 *
 * Once an error-reporting service exists, this is where a browser exception is
 * forwarded to it, tagged with the same correlation ID the user sees on screen.
 */
export const handleError: HandleClientError = ({ error, event, status }) => {
	const correlationId = crypto.randomUUID();

	if (status !== 404) {
		console.error('unhandled client error', {
			correlationId,
			status,
			path: event.url.pathname,
			error
		});
	}

	return {
		message:
			status === 404
				? 'We couldn’t find that page.'
				: 'Something went wrong on our end. Please try again in a moment.',
		correlationId
	};
};
