/** What muallim-api sends: an amount in the currency's smallest unit, and the currency. */
export type Money = { amount_minor: number; currency: string };

/*
	How many minor units make one major one.

	Not every currency is 100. The yen has no minor unit at all, and a price of 1200
	JPY formatted as 12.00 is a hundredfold error in the one place nobody forgives —
	`Intl` knows the answer, so it is asked rather than assumed.
*/
function minorPerMajor(currency: string): number {
	const digits =
		new Intl.NumberFormat(undefined, { style: 'currency', currency }).resolvedOptions()
			.maximumFractionDigits ?? 2;

	return 10 ** digits;
}

/** A price, in the reader's own locale: `৳1,200.00`, `$19.99`, `¥1,200`. */
export function formatMoney(money: Money, locale?: string): string {
	const currency = money.currency.toUpperCase();

	try {
		return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
			money.amount_minor / minorPerMajor(currency)
		);
	} catch {
		// A currency `Intl` does not know is still a number. Saying "1200 XYZ" beats
		// throwing on a page whose only job is to show a price.
		return `${money.amount_minor} ${currency}`;
	}
}
