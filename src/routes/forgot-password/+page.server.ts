import { fail } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { serverApi } from '$lib/server/api';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();

		if (!email) return fail(400, { email, message: 'Enter your email address.' });

		const { error, response } = await serverApi(url.origin).POST('/v1/auth/password/forgot', {
			body: { email }
		});

		// lms-api answers 202 whether or not the address belongs to a member here,
		// and this page must not undo that by rendering two different outcomes. A
		// 429 is reported, because being throttled is a fact about the requester
		// rather than about the address. Anything else is reported as a failure of
		// ours, not as evidence about the account.
		if (error) {
			if (response?.status === 429) {
				return fail(429, { email, message: problemMessage(error, 'Too many attempts.') });
			}
			return fail(response?.status ?? 500, {
				email,
				message: 'We could not send that email. Try again shortly.'
			});
		}

		return { sent: true };
	}
};
