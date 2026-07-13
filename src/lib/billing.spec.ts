import { describe, expect, it } from 'vitest';
import { orderLabel, orderTone, packBkashSecret } from './billing';

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
