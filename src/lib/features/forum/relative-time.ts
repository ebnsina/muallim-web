/**
 * When a thread was posted, and when it last stirred.
 *
 * A forum is read by recency, and "12 Jul 2026" makes the reader do the
 * subtraction. "3 hours ago" is the answer they wanted. The exact instant is not
 * lost — it goes in a `title`, from `exactTime`.
 */

/** Each unit and how many of it the next one holds. Weeks are 30.44/7 days on average. */
const DIVISIONS = [
	{ per: 60, unit: 'second' },
	{ per: 60, unit: 'minute' },
	{ per: 24, unit: 'hour' },
	{ per: 7, unit: 'day' },
	{ per: 4.34524, unit: 'week' },
	{ per: 12, unit: 'month' },
	{ per: Number.POSITIVE_INFINITY, unit: 'year' }
] as const satisfies readonly { per: number; unit: Intl.RelativeTimeFormatUnit }[];

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const exact = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** "3 hours ago", "2 days ago", "in 5 minutes". `now` is injectable so it can be tested. */
export function relativeTime(when: string | Date, now: Date = new Date()): string {
	const at = when instanceof Date ? when : new Date(when);
	if (Number.isNaN(at.getTime())) return '';

	let amount = (at.getTime() - now.getTime()) / 1000;
	for (const { per, unit } of DIVISIONS) {
		if (Math.abs(amount) < per) return relative.format(Math.round(amount), unit);
		amount /= per;
	}

	// Unreachable: the last division never ends.
	return '';
}

/** The instant itself, for the `title` a reader hovers when "2 days ago" is not enough. */
export function exactTime(when: string | Date): string {
	const at = when instanceof Date ? when : new Date(when);
	return Number.isNaN(at.getTime()) ? '' : exact.format(at);
}
