import { describe, expect, it } from 'vitest';
import {
	accountStatusLabel,
	gatewayLabel,
	orderLabel,
	orderTone,
	packBkashSecret
} from './billing';

describe('orderTone', () => {
	it('gives each status its own tone', () => {
		expect(orderTone('paid')).toBe('success');
		expect(orderTone('pending')).toBe('warning');
		expect(orderTone('failed')).toBe('danger');
		expect(orderTone('refunded')).toBe('neutral');
	});
});

describe('orderLabel', () => {
	it('names every status', () => {
		expect(orderLabel('paid')).toBe('Paid');
		expect(orderLabel('pending')).toBe('Pending');
		expect(orderLabel('failed')).toBe('Failed');
		expect(orderLabel('refunded')).toBe('Refunded');
	});
});

describe('packBkashSecret', () => {
	it('packs the three secrets into the JSON the driver reads', () => {
		expect(packBkashSecret({ app_secret: 's3cret', username: 'sandbox', password: 'pw' })).toBe(
			'{"app_secret":"s3cret","username":"sandbox","password":"pw"}'
		);
	});

	it('escapes what JSON must escape', () => {
		const packed = packBkashSecret({ app_secret: 'a"b', username: 'u\\v', password: 'p\nq' });
		expect(JSON.parse(packed)).toEqual({ app_secret: 'a"b', username: 'u\\v', password: 'p\nq' });
	});
});

describe('gatewayLabel', () => {
	// The whole point: `capitalize` on the API's key gives "Sslcommerz" and "Bkash",
	// and neither company spells its own name that way.
	it('spells each gateway the way its company does', () => {
		expect(gatewayLabel('sslcommerz')).toBe('SSLCommerz');
		expect(gatewayLabel('bkash')).toBe('bKash');
		expect(gatewayLabel('stripe')).toBe('Stripe');
	});

	it('calls the driver that takes no money what it is', () => {
		expect(gatewayLabel('fake')).toBe('Practice payments');
	});

	// A gateway added to the API before this map hears of it still has to render.
	it('shows an unknown gateway as it came rather than inventing a name', () => {
		expect(gatewayLabel('newpay')).toBe('newpay');
	});
});

describe('accountStatusLabel', () => {
	it('says what each state means for taking money', () => {
		expect(accountStatusLabel('active')).toBe('Ready to take payments');
		expect(accountStatusLabel('pending')).toBe('Waiting on the payment provider');
		expect(accountStatusLabel('restricted')).toContain('Needs more details');
	});
});
