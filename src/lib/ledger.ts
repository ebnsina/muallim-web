import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	The accounts module's types and its forms' rules. These are the school's own
	income and expense books, kept apart from the fees a student is billed. muallim-api
	works in minor units (poisha); an admin types major ones (taka), so an entry's amount
	is a major number the action multiplies before the request leaves. The bounds are
	muallim-api's own; a number invented here that the server does not share is a form
	that accepts what the API will refuse.
*/

export type Category = components['schemas']['CategoryView'];
export type Entry = components['schemas']['LedgerEntryView'];
export type Total = components['schemas']['TotalView'];

/** An entry is money in or money out. muallim-api's enum; an unknown one is refused here too. */
export const KINDS = ['income', 'expense'] as const;
export type Kind = (typeof KINDS)[number];

/** Major units to minor: an admin books in taka, the API is told poisha. */
export const MINOR_PER_MAJOR = 100;

/** BDT is the market default; an entry with no currency is booked in taka. */
export const DEFAULT_CURRENCY = 'BDT';

export function kindLabel(kind: Kind): string {
	switch (kind) {
		case 'income':
			return 'Income';
		case 'expense':
			return 'Expense';
	}
}

/** Income is money the school took in; an expense is money it paid out. */
export function kindTone(kind: Kind): BadgeTone {
	switch (kind) {
		case 'income':
			return 'success';
		case 'expense':
			return 'danger';
	}
}

// `.trim()` before `.min(1)`: `required` asks whether a character was typed, and a
// space is a character.
const text = (max: number, missing: string) =>
	z.string().trim().min(1, missing).max(max, `That is longer than ${max} characters.`);

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `That is longer than ${max} characters.`)
		.optional()
		.transform((value) => value ?? '');

/** An amount, as an admin types it: major units, more than nothing. The action multiplies. */
const amount = z.coerce
	.number({ error: 'An amount is a number.' })
	.positive('An amount is more than nothing.')
	.max(1_000_000, 'That is more than this system will book.');

const kind = z.enum(KINDS, { error: 'Choose whether this is income or an expense.' });

/** The day the money moved, `YYYY-MM-DD`. Required — an entry with no date is not an entry. */
const occurredOn = z
	.string()
	.trim()
	.min(1, 'Give the date the money moved.')
	.refine((value) => !Number.isNaN(Date.parse(value)), 'That is not a date.');

/*
	A category: a named bucket that is either income or expense. The kind is fixed at
	creation — an entry inherits which way the money moves from the category it lands in.
*/
export const categorySchema = z.object({
	name: text(120, 'Give the category a name.'),
	kind
});

/*
	An entry: an amount booked against a category on a day. The amount is major units in
	the box; the action sends minor. A description is where the entry came from, and is
	optional.
*/
export const entrySchema = z.object({
	category_id: z.uuid('Choose a category.'),
	amount,
	occurred_on: occurredOn,
	description: optionalText(500)
});

/** The HTML constraints for the accounts forms, as attributes. Spread them onto the control. */
export const LEDGER_LIMITS = {
	name: { required: true, maxlength: 120 },
	amount: { required: true, type: 'number', min: 0, step: '0.01' },
	occurredOn: { required: true, type: 'date' },
	description: { maxlength: 500 }
} as const;
