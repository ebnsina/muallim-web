import { deserialize } from '$app/forms';
import type { ActionResult } from '@sveltejs/kit';

/**
 * Call a form action from a script and get its result back.
 *
 * `use:enhance` covers a form the reader submits. It does not cover a sequence —
 * sign, upload, confirm — where the second step needs what the first returned and
 * only the last one should touch the page. This is the same request `enhance`
 * makes, without the part that applies the result.
 *
 * The action runs on the server, so the session cookie goes with it and nothing
 * in the page ever holds a token.
 */
export async function callAction(
	action: string,
	fields: Record<string, string | number> = {}
): Promise<ActionResult> {
	const body = new FormData();
	for (const [name, value] of Object.entries(fields)) body.set(name, String(value));

	const response = await fetch(action, {
		method: 'POST',
		// Without this header SvelteKit answers with a redirect to the page rather
		// than with the action's result.
		headers: { 'x-sveltekit-action': 'true' },
		body
	});

	// The wire format is devalue, not JSON: an action may return a Date or a Map,
	// and `JSON.parse` would quietly turn the first into a string.
	return deserialize(await response.text());
}

/**
 * The message an action failed with, or a fallback.
 *
 * A `redirect` result means the session went away mid-sequence. Saying so beats
 * "something went wrong" for the one reader it happens to.
 */
export function actionMessage(result: ActionResult, fallback: string): string {
	if (result.type === 'failure') {
		const message = result.data?.message;
		return typeof message === 'string' ? message : fallback;
	}

	if (result.type === 'redirect') return 'Your session has expired. Sign in again.';

	return fallback;
}
