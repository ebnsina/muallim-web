import { error, redirect } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { safeRedirect } from '$lib/server/redirect';
import type { Actions, PageServerLoad } from './$types';

/*
	The fake gateway's own checkout page.

	This is not part of Muallim: it stands in for Stripe's hosted page, and it exists
	so the whole flow — order, redirect, signed webhook, idempotency, enrolment — runs
	end to end before there are any Stripe keys. When they arrive this route goes, and
	nothing else changes: the learner is sent to Stripe instead.

	It signs the webhook the way the real gateway does, with the secret muallim-api
	verifies against, and posts it server-side. A browser that could sign one could
	buy a course for nothing — so there is no default here: if the secret is unset the
	page refuses to sign rather than falling back to a value printed in the source.
*/
const API = env.MUALLIM_API_URL ?? 'http://localhost:8080';

function signingSecret(): string {
	const secret = env.MUALLIM_FAKE_GATEWAY_SECRET;
	if (!secret) error(503, 'Practice payments are not available here.');
	return secret;
}

export const load: PageServerLoad = ({ url, params, locals }) => {
	// A signing oracle behind a session: a page that will sign a "paid" webhook is not
	// a page to leave open to anyone who can type its URL.
	if (!locals.accessToken)
		redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);

	const order = url.searchParams.get('order');
	const tenant = url.searchParams.get('tenant');
	const amount = Number(url.searchParams.get('amount'));
	const currency = url.searchParams.get('currency') ?? '';

	if (!order || !tenant || !Number.isFinite(amount)) {
		error(400, "We couldn't open that payment page. Please go back and try again.");
	}

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

	const signature = createHmac('sha256', signingSecret()).update(payload).digest('hex');

	const response = await fetch(`${API}/v1/webhooks/fake`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
		body: payload
	});

	if (!response.ok) error(502, "We couldn't complete that payment. Please try again.");
}

export const actions: Actions = {
	pay: async ({ request, locals }) => {
		if (!locals.accessToken) error(401, 'Please sign in to continue.');
		const form = await request.formData();
		const fields = Object.fromEntries([...form].map(([k, v]) => [k, String(v)]));

		await webhook('paid', fields);

		// Back where the checkout was opened from. The webhook has already settled it,
		// so the course page finds the enrolment — but it is the webhook that granted
		// it, not this redirect.
		redirect(303, safeRedirect(fields.success, '/'));
	},

	cancel: async ({ request, locals }) => {
		if (!locals.accessToken) error(401, 'Please sign in to continue.');
		const form = await request.formData();
		const fields = Object.fromEntries([...form].map(([k, v]) => [k, String(v)]));

		await webhook('failed', fields);
		redirect(303, safeRedirect(fields.cancel, '/'));
	}
};
