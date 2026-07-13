import { error, redirect } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

/*
	The fake gateway's own checkout page.

	This is not part of Muallim: it stands in for Stripe's hosted page, and it exists
	so the whole flow — order, redirect, signed webhook, idempotency, enrolment — runs
	end to end before there are any Stripe keys. When they arrive this route goes, and
	nothing else changes: the learner is sent to Stripe instead.

	It signs the webhook the way the real gateway does, with the secret muallim-api
	verifies against, and posts it server-side. A browser that could sign one could
	buy a course for nothing.
*/
const SECRET = env.MUALLIM_FAKE_GATEWAY_SECRET ?? 'fake-gateway-secret';
const API = env.MUALLIM_API_URL ?? 'http://localhost:8080';

export const load: PageServerLoad = ({ url, params }) => {
	const order = url.searchParams.get('order');
	const tenant = url.searchParams.get('tenant');
	const amount = Number(url.searchParams.get('amount'));
	const currency = url.searchParams.get('currency') ?? '';

	if (!order || !tenant || !Number.isFinite(amount)) error(400, 'That checkout is not valid.');

	return {
		session: params.session,
		order,
		tenant,
		price: { amount_minor: amount, currency },
		success: url.searchParams.get('success') ?? '/',
		cancel: url.searchParams.get('cancel') ?? '/'
	};
};

/** What the gateway would send. Signed with its secret, posted from the server. */
async function webhook(kind: string, fields: Record<string, string>) {
	const payload = JSON.stringify({
		kind,
		tenant_id: fields.tenant,
		order_id: fields.order,
		session: fields.session
	});

	const signature = createHmac('sha256', SECRET).update(payload).digest('hex');

	const response = await fetch(`${API}/v1/webhooks/fake`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
		body: payload
	});

	if (!response.ok) error(502, 'The gateway could not settle that order.');
}

export const actions: Actions = {
	pay: async ({ request }) => {
		const form = await request.formData();
		const fields = Object.fromEntries([...form].map(([k, v]) => [k, String(v)]));

		await webhook('paid', fields);

		// Back where the checkout was opened from. The webhook has already settled it,
		// so the course page finds the enrolment — but it is the webhook that granted
		// it, not this redirect.
		redirect(303, fields.success || '/');
	},

	cancel: async ({ request }) => {
		const form = await request.formData();
		const fields = Object.fromEntries([...form].map(([k, v]) => [k, String(v)]));

		await webhook('failed', fields);
		redirect(303, fields.cancel || '/');
	}
};
