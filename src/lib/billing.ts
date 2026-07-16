import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

export type Order = components['schemas']['OrderView'];
export type Account = components['schemas']['AccountView'];
export type OrderStatus = Order['status'];

/** A gateway the API will take credentials for. Stripe onboards; these two hold keys. */
export type KeyedGateway = 'sslcommerz' | 'bkash';

/** The color an order's status wears. Paid is money in; refunded is money back out. */
export function orderTone(status: OrderStatus): BadgeTone {
	switch (status) {
		case 'paid':
			return 'success';
		case 'pending':
			return 'warning';
		case 'failed':
			return 'danger';
		case 'refunded':
			return 'neutral';
	}
}

/** What a status is called in the UI. The API is British and terse; a receipt is read. */
export function orderLabel(status: OrderStatus): string {
	switch (status) {
		case 'paid':
			return 'Paid';
		case 'pending':
			return 'Pending';
		case 'failed':
			return 'Failed';
		case 'refunded':
			return 'Refunded';
	}
}

/*
	What each gateway is called by the people who use it. The API's identifiers are
	lowercase keys — printing them capitalised gives "Sslcommerz" and "Bkash", which
	is not what either company is called. A gateway this list has not heard of is
	shown as it came, since a made-up name would be worse than an unfamiliar one.
*/
const GATEWAY_LABEL: Record<string, string> = {
	stripe: 'Stripe',
	sslcommerz: 'SSLCommerz',
	bkash: 'bKash',
	// The driver that signs real events and takes no money — a rehearsal, not a brand.
	fake: 'Practice payments'
};

/** What a gateway is called on screen. */
export function gatewayLabel(gateway: string): string {
	return GATEWAY_LABEL[gateway] ?? gateway;
}

/*
	Where a workspace's own payment account stands, said plainly. "restricted" is the
	gateway's word for it and tells the reader neither what is wrong nor what to do.
*/
export function accountStatusLabel(status: Account['status']): string {
	switch (status) {
		case 'active':
			return 'Ready to take payments';
		case 'pending':
			return 'Waiting on the payment provider';
		case 'restricted':
			return 'Needs more details before it can take payments';
	}
}

/**
 * bKash's three secrets, as the driver expects them: one JSON string in `secret`.
 *
 * Three labelled inputs on the form, one field on the wire — the API seals whatever
 * it is given, and the shape inside the seal is the driver's business.
 */
export function packBkashSecret(parts: {
	app_secret: string;
	username: string;
	password: string;
}): string {
	return JSON.stringify({
		app_secret: parts.app_secret,
		username: parts.username,
		password: parts.password
	});
}
