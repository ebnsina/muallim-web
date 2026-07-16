import { fail } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { serverApi } from '$lib/server/api';
import { parseForm } from '$lib/validation';
import { demoRequestSchema, contactSchema, intentSchema } from '$lib/demo';
import type { Actions } from './$types';

/**
 * The steps are a courtesy, not a control: the whole form arrives here at once and
 * is judged at once. A multi-step form that trusted its own steps would be a form
 * anybody can post around — and muallim-api judges it a third time regardless.
 *
 * On a rejection, `step` is the earliest one that still has a problem, so the page
 * puts the reader in front of it rather than on the last screen wondering which of
 * three holds the mistake.
 */
export const actions: Actions = {
	default: async ({ request, url }) => {
		const data = await request.formData();

		// Everything typed, back to the page — except the tick. Re-ticking a box for
		// somebody is agreeing on their behalf.
		const values = {
			intent: String(data.get('intent') ?? ''),
			name: String(data.get('name') ?? '').trim(),
			email: String(data.get('email') ?? '').trim(),
			phone: String(data.get('phone') ?? '').trim()
		};

		const parsed = parseForm(demoRequestSchema, data);
		if (!parsed.ok) {
			const step = !intentSchema.safeParse(values).success
				? 0
				: !contactSchema.safeParse(values).success
					? 1
					: 2;
			return fail(400, { values, errors: parsed.errors, step });
		}

		const { intent, name, email, phone } = parsed.value;

		const { error, response } = await serverApi(url.origin).POST('/v1/demo-requests', {
			body: { intent, name, email, phone, agreed: true }
		});

		// `!error` is not the same as "it worked". openapi-fetch only fills `error`
		// when it could parse a problem body out of the response — so a proxy that
		// answers ECONNREFUSED, a gateway timeout, anything with an empty body, all
		// arrive here with `error` undefined and a status nobody wrote. Checking
		// `error` alone told somebody "we have it, thank you" while muallim-api was
		// not running and nothing was stored, which is the one outcome this whole
		// endpoint exists to avoid. The status is the truth; the body is a courtesy.
		if (!response.ok || error) {
			// Being throttled is a fact about the requester, so it is reported. A 422
			// is muallim-api's own sentence, written for the person reading it.
			// Anything else is a failure of ours, and is said as ours.
			if (response?.status === 429) {
				return fail(429, {
					values,
					errors: {},
					step: 2,
					message: problemMessage(
						error,
						'Too many attempts. Please wait a few minutes and try again.'
					)
				});
			}
			if (response?.status === 422) {
				return fail(422, {
					values,
					errors: {},
					step: 2,
					message: problemMessage(error, 'Please check the form.')
				});
			}
			return fail(response?.status ?? 500, {
				values,
				errors: {},
				step: 2,
				message: "We couldn't send that just now. Please try again shortly."
			});
		}

		// The address comes back so the page can say where the link is going: a
		// mistyped address is best caught by reading it on the screen you are on.
		return { sent: true, email };
	}
};
