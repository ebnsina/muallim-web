import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
	it('reads minor units as the currency defines them', () => {
		expect(formatMoney({ amount_minor: 120000, currency: 'BDT' }, 'en-US')).toContain('1,200.00');
		expect(formatMoney({ amount_minor: 1999, currency: 'USD' }, 'en-US')).toBe('$19.99');
	});

	// The yen has no minor unit. Dividing by 100 would be a hundredfold error in the
	// one place nobody forgives.
	it('does not invent a decimal a currency does not have', () => {
		expect(formatMoney({ amount_minor: 1200, currency: 'JPY' }, 'en-US')).toBe('¥1,200');
	});

	it('is case-insensitive about the currency', () => {
		expect(formatMoney({ amount_minor: 500, currency: 'usd' }, 'en-US')).toBe('$5.00');
	});

	// Intl does not throw on a well-formed code it has never seen — it uses the code
	// as the symbol. `ZZZ 12.00` is a fine answer, and the fallback is not for this.
	it('uses the code itself as the symbol for an unknown-but-valid currency', () => {
		expect(formatMoney({ amount_minor: 1200, currency: 'ZZZ' }, 'en-US')).toContain('ZZZ');
	});

	// What Intl *does* throw on is a malformed code. A page whose only job is to show
	// a price must not go blank because the data was wrong.
	it('falls back to the bare number when the currency is malformed', () => {
		expect(formatMoney({ amount_minor: 1200, currency: 'US' }, 'en-US')).toBe('1200 US');
	});
});
