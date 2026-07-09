import { fail } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { serverApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	return { token: url.searchParams.get('token') ?? '' };
};

export const actions: Actions = {
	/**
	 * Confirming is a POST behind a button the recipient presses.
	 *
	 * Corporate mail scanners and chat link-previewers follow every URL in an
	 * incoming message. If a GET confirmed the address, the token would be spent
	 * before the recipient ever saw the email — and, worse, spent by something
	 * that is not them.
	 */
	default: async ({ request }) => {
		const form = await request.formData();
		const token = String(form.get('token') ?? '');

		if (!token) return fail(400, { message: 'This link is missing its token.' });

		const { error, response } = await serverApi.POST('/v1/auth/email/verify', { body: { token } });

		if (error) {
			return fail(response?.status ?? 400, {
				message: problemMessage(error, 'This link is invalid or has expired. Request a new one.')
			});
		}

		return { verified: true };
	}
};
