import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { serverApi } from '$lib/server/api';
import { safeRedirect, setSession } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.accessToken) redirect(303, safeRedirect(url.searchParams.get('next')));
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		// The email is echoed back so the field survives a failed submit. The
		// password never is.
		if (!email || !password) {
			return fail(400, { email, message: 'Enter your email address and password.' });
		}

		const { data, error, response } = await serverApi(url.origin).POST('/v1/auth/login', {
			body: { email, password }
		});

		if (error || !data) {
			// lms-api answers a missing account, a wrong password, and a suspended
			// membership with one message, in constant time. Rendering anything more
			// specific here would undo that.
			return fail(response?.status ?? 401, {
				email,
				message: problemMessage(error, 'Those credentials are not valid.')
			});
		}

		setSession(cookies, data.tokens);
		redirect(303, safeRedirect(url.searchParams.get('next')));
	}
};
