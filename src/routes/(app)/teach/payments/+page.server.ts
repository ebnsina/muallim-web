import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { packBkashSecret } from '$lib/billing';
import { authedApi } from '$lib/server/api';
import { bkashSchema, sslcommerzSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** Every gateway the API knows. There is no list endpoint: the enum is the list. */
const GATEWAYS = ['stripe', 'sslcommerz', 'bkash', 'fake'] as const;

/*
	The workspace's payment accounts, one question per gateway.

	`GET /v1/billing/account` answers for one gateway at a time, and its answer is
	three-valued: an account (connected), 404 (not connected), or 503 (this
	deployment does not run that gateway at all). Nothing is read back about a
	secret — there is no endpoint that returns one, and this page never pretends
	otherwise.
*/
export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	const accounts = await Promise.all(
		GATEWAYS.map(async (gateway) => {
			const {
				data,
				error: problem,
				response
			} = await api.GET('/v1/billing/account', {
				params: { query: { gateway } }
			});

			return {
				gateway,
				account: data?.account ?? null,
				// The deployment's own answer, kept verbatim: it is why the form is closed.
				unavailable:
					response?.status === 503 ? problemMessage(problem, 'Not available here.') : null
			};
		})
	);

	return { accounts };
};

function guard(accessToken: string | null): asserts accessToken is string {
	if (!accessToken) redirect(303, '/login?next=%2Fteach%2Fpayments');
}

export const actions: Actions = {
	/** Stripe and the fake gateway onboard rather than take keys. Off to the gateway. */
	connect: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const gateway = String((await request.formData()).get('gateway') ?? '');
		if (gateway !== 'stripe' && gateway !== 'fake') {
			return fail(400, { scope: gateway, message: 'That gateway is connected with keys.' });
		}

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/billing/connect', {
			body: { gateway, return_url: `${url.origin}${url.pathname}` }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				scope: gateway,
				message: problemMessage(problem, 'Could not connect that gateway.')
			});
		}

		// The gateway's own onboarding. Nothing about a bank account touches this app.
		redirect(303, data.url);
	},

	sslcommerz: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const parsed = parseForm(sslcommerzSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'sslcommerz', errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/billing/credentials',
			{ body: { gateway: 'sslcommerz', ...parsed.value } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				scope: 'sslcommerz',
				message: problemMessage(problem, 'Could not save those keys.')
			});
		}

		return { saved: 'sslcommerz' };
	},

	/** bKash's three secrets travel as one JSON string: that is what its driver reads. */
	bkash: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const parsed = parseForm(bkashSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'bkash', errors: parsed.errors });

		const { public_id, ...secrets } = parsed.value;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/billing/credentials',
			{ body: { gateway: 'bkash', public_id, secret: packBkashSecret(secrets) } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				scope: 'bkash',
				message: problemMessage(problem, 'Could not save those keys.')
			});
		}

		return { saved: 'bkash' };
	}
};
