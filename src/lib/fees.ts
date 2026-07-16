import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	The fees module's types and its forms' rules. muallim-api works in minor units
	(poisha); an admin types major ones (taka), so every amount box is a major number
	the action multiplies before the request leaves — `teach`'s price form is the
	reference. The bounds are muallim-api's own; a number invented here that the
	server does not share is a form that accepts what the API will refuse.
*/

export type FeeStructure = components['schemas']['FeeStructureView'];
export type Invoice = components['schemas']['InvoiceView'];
export type Ledger = components['schemas']['LedgerView'];

/** How often a structure bills. muallim-api's enum; an unknown one is refused here too. */
export const RECURRENCES = ['one_time', 'monthly', 'termly', 'annual'] as const;
export type Recurrence = (typeof RECURRENCES)[number];

/** The states an invoice may be in. muallim-api's enum. */
export const INVOICE_STATUSES = ['unpaid', 'paid', 'waived', 'cancelled'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** Major units to minor: an admin prices in taka, the API is told poisha. */
export const MINOR_PER_MAJOR = 100;

export function recurrenceLabel(recurrence: Recurrence): string {
	switch (recurrence) {
		case 'one_time':
			return 'One-time';
		case 'monthly':
			return 'Monthly';
		case 'termly':
			return 'Termly';
		case 'annual':
			return 'Annual';
	}
}

/** What a status is called in the UI. The API's enum is lowercase; a ledger is read. */
export function invoiceStatusLabel(status: InvoiceStatus): string {
	switch (status) {
		case 'unpaid':
			return 'Unpaid';
		case 'paid':
			return 'Paid';
		case 'waived':
			return 'Waived';
		case 'cancelled':
			return 'Cancelled';
	}
}

/** Paid is settled, unpaid is owed, waived is forgiven, cancelled is void. */
export function invoiceStatusTone(status: InvoiceStatus): BadgeTone {
	switch (status) {
		case 'unpaid':
			return 'warning';
		case 'paid':
			return 'success';
		case 'waived':
			return 'accent';
		case 'cancelled':
			return 'neutral';
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

const blankIsAbsent = (value: unknown) => (value === '' ? undefined : value);

const optionalUuid = (message: string) => z.preprocess(blankIsAbsent, z.uuid(message).optional());

/** A blank `date` box is "no due date", not an error. */
const optionalDate = (message: string) =>
	z.preprocess(
		blankIsAbsent,
		z
			.string()
			.refine((value) => !Number.isNaN(Date.parse(value)), message)
			.optional()
	);

/** A price, as an admin types it: major units, more than nothing. The action multiplies. */
const amount = z.coerce
	.number({ error: 'An amount is a number.' })
	.positive('An amount is more than nothing.')
	.max(1_000_000, 'That is more than this system will bill.');

const currency = z
	.string()
	.trim()
	.length(3, 'A currency is three letters, like BDT or USD.')
	.transform((value) => value.toUpperCase());

const recurrence = z.enum(RECURRENCES, { error: 'Choose how often this is billed.' });

/*
	A fee structure: a named, recurring charge, optionally tied to a class. The amount
	is major units in the box; the action sends minor. A blank class is "every class".
*/
export const feeStructureSchema = z.object({
	name: text(120, 'Give the fee a name.'),
	amount,
	currency,
	grade_level_id: optionalUuid('Choose a class.'),
	recurrence
});

/*
	Issuing a structure to a period. The period names the billing cycle ("2026-07",
	"Term 1"); a class narrows the billing, and a blank one bills every student the
	structure applies to. The API is idempotent, so re-issuing the same period bills
	nobody twice.
*/
export const issueFeesSchema = z.object({
	period: text(60, 'Name the period being billed.'),
	due_date: optionalDate('That due date is not a date.'),
	grade_level_id: optionalUuid('Choose a class.')
});

/*
	A payment against an invoice. Major units in the box; the method and note are how
	the school records where the money came from, and both are optional.
*/
export const payInvoiceSchema = z.object({
	amount,
	method: optionalText(60),
	note: optionalText(500)
});

/*
	An ad-hoc invoice, raised against one student with no structure behind it. A title
	and an amount are the two things it cannot do without; the rest is placement.
*/
export const adhocInvoiceSchema = z.object({
	student_id: z.uuid('Choose a student.'),
	title: text(200, 'Give the invoice a title.'),
	amount,
	currency,
	due_date: optionalDate('That due date is not a date.'),
	note: optionalText(500)
});

/** The HTML constraints for the fee forms, as attributes. Spread them onto the control. */
export const FEE_LIMITS = {
	name: { required: true, maxlength: 120 },
	amount: { required: true, type: 'number', min: 0, step: '0.01' },
	currency: { required: true, maxlength: 3, minlength: 3 },
	period: { required: true, maxlength: 60 },
	dueDate: { type: 'date' },
	invoiceTitle: { required: true, maxlength: 200 },
	method: { maxlength: 60 },
	note: { maxlength: 500 }
} as const;
