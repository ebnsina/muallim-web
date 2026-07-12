import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { serverApi } from '$lib/server/api';
import { setSession } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 12;

export const load: PageServerLoad = ({ url }) => {
	return { token: url.searchParams.get('token') ?? '' };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const token = String(form.get('token') ?? '');
		const name = String(form.get('name') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!token) return fail(400, { name, message: 'This invitation is missing its token.' });

		// The password field means one of two things, and the page cannot tell which:
		// for an address with no account it sets a new password, and for an address
		// that already has one it must *be* that password. muallim-api decides, and
		// answers both failures identically.
		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				name,
				message: `Enter a password of at least ${MIN_PASSWORD_LENGTH} characters.`
			});
		}

		const { data, error, response } = await serverApi(url.origin).POST(
			'/v1/auth/invitations/accept',
			{
				body: { token, name, password }
			}
		);

		if (error || !data) {
			return fail(response?.status ?? 400, {
				name,
				message: problemMessage(error, 'This invitation could not be accepted.')
			});
		}

		setSession(cookies, data.tokens);
		redirect(303, '/dashboard');
	}
};
