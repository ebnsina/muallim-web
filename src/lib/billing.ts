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
