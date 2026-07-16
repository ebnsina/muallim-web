import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { serverApi } from '$lib/server/api';
import { setSession } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

/** Mirrors muallim-api's MinPasswordLength. Length beats composition rules. */
const MIN_PASSWORD_LENGTH = 12;

export const load: PageServerLoad = ({ locals }) => {
	if (locals.accessToken) redirect(303, '/dashboard');
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const name = String(form.get('name') ?? '').trim();
		const password = String(form.get('password') ?? '');

		const invalid = (message: string) => fail(400, { email, name, message });

		if (!email || !name) return invalid('Enter your name and email address.');
		if (password.length < MIN_PASSWORD_LENGTH) {
			return invalid(`Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
		}

		const { data, error, response } = await serverApi(url.origin).POST('/v1/auth/register', {
			body: { email, name, password }
		});

		if (error || !data) {
			// A claimed workspace answers 403 for every address, existing or not, so
			// registration cannot be used to discover who has an account.
			return fail(response?.status ?? 400, {
				email,
				name,
				message: problemMessage(error, "We couldn't create that account. Please try again.")
			});
		}

		setSession(cookies, data.tokens);
		redirect(303, '/dashboard');
	}
};
