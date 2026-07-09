import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { serverApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 12;

/**
 * The token arrives in the query string, from the emailed link, and is handed to
 * the form as a hidden field.
 *
 * Spending it needs a POST, so an email scanner or link previewer that follows
 * the link cannot consume the reset on the recipient's behalf. That is the whole
 * reason this is a form and not something the page submits on mount.
 */
export const load: PageServerLoad = ({ url }) => {
	return { token: url.searchParams.get('token') ?? '' };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const form = await request.formData();
		const token = String(form.get('token') ?? '');
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		if (!token) return fail(400, { message: 'This link is missing its token. Request a new one.' });
		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				message: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`
			});
		}
		if (password !== confirm) return fail(400, { message: 'The two passwords do not match.' });

		const { error, response } = await serverApi(url.origin).POST('/v1/auth/password/reset', {
			body: { token, password }
		});

		if (error) {
			return fail(response?.status ?? 400, {
				message: problemMessage(error, 'This link is invalid or has expired. Request a new one.')
			});
		}

		// Every session in the workspace was revoked, including any this browser
		// held. Sign in again with the new password.
		redirect(303, '/login?reset=1');
	}
};
