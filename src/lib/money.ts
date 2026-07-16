/** What muallim-api sends: an amount in the currency's smallest unit, and the currency. */
export type Money = { amount_minor: number; currency: string };

/*
	How many minor units make one major one.

	Not every currency is 100. The yen has no minor unit at all, and a price of 1200
	JPY formatted as 12.00 is a hundredfold error in the one place nobody forgives —
	`Intl` knows the answer, so it is asked rather than assumed.
*/
function minorPerMajor(currency: string): number {
	try {
		const digits =
			new Intl.NumberFormat(undefined, { style: 'currency', currency }).resolvedOptions()
				.maximumFractionDigits ?? 2;

		return 10 ** digits;
	} catch {
		// A malformed code has no minor unit to ask about. Two is the common case, and
		// formatMoney answers with the bare number anyway — it must not throw here, or
		// the price it exists to show never renders.
		return 100;
	}
}

/** A price, in the reader's own locale: `৳1,200.00`, `$19.99`, `¥1,200`. */
export function formatMoney(money: Money, locale?: string): string {
	const currency = money.currency.toUpperCase();
	const major = money.amount_minor / minorPerMajor(currency);

	// BDT is the default, and `Intl`'s currency style prints the letters "BDT" in
	// every English locale — never the sign. So the taka glyph is composed onto an
	// en-IN number (which also gives the lakh/crore grouping a BD reader expects).
	if (currency === 'BDT') {
		const digits = Math.log10(minorPerMajor(currency));
		return `৳${new Intl.NumberFormat('en-IN', {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		}).format(major)}`;
	}

	try {
		return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(major);
	} catch {
		// A currency `Intl` does not know is still a number. Saying "1200 XYZ" beats
		// throwing on a page whose only job is to show a price.
		return `${money.amount_minor} ${currency}`;
	}
}
