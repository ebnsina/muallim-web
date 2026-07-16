import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	The payroll module's types and its forms' rules. muallim-api works in minor units
	(poisha); an admin types major ones (taka), so every amount box is a major number
	the action multiplies before the request leaves — `fees` is the reference. The
	bounds are muallim-api's own; a number invented here that the server does not share
	is a form that accepts what the API will refuse.
*/

export type SalaryStructure = components['schemas']['SalaryStructureView'];
export type Payslip = components['schemas']['PayslipView'];

/** The states a payslip may be in. muallim-api's enum. */
export const PAYSLIP_STATUSES = ['draft', 'paid'] as const;
export type PayslipStatus = (typeof PAYSLIP_STATUSES)[number];

/** Major units to minor: an admin pays in taka, the API is told poisha. */
export const MINOR_PER_MAJOR = 100;

export function payslipStatusLabel(status: PayslipStatus): string {
	switch (status) {
		case 'draft':
			return 'Draft';
		case 'paid':
			return 'Paid';
	}
}

/** Draft is generated but not yet paid; paid is settled. */
export function payslipStatusTone(status: PayslipStatus): BadgeTone {
	switch (status) {
		case 'draft':
			return 'warning';
		case 'paid':
			return 'success';
	}
}

/** Net pay, as the API computes it: basic plus allowances, less deductions. */
export function salaryNet(salary: {
	basic_amount: number;
	allowances_amount: number;
	deductions_amount: number;
}): number {
	return salary.basic_amount + salary.allowances_amount - salary.deductions_amount;
}

// `.trim()` before `.min(1)`: `required` asks whether a character was typed, and a
// space is a character.
const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `That is longer than ${max} characters.`)
		.optional()
		.transform((value) => value ?? '');

const blankIsAbsent = (value: unknown) => (value === '' ? undefined : value);

const optionalUuid = (message: string) => z.preprocess(blankIsAbsent, z.uuid(message).optional());

/** A blank `date` box is "no effective date", not an error. */
const optionalDate = (message: string) =>
	z.preprocess(
		blankIsAbsent,
		z
			.string()
			.refine((value) => !Number.isNaN(Date.parse(value)), message)
			.optional()
	);

/** An amount an admin may leave blank, read as zero: allowances and deductions both. */
const optionalAmount = z.preprocess(
	(value) => (value === '' || value === undefined || value === null ? 0 : value),
	z.coerce
		.number({ error: 'An amount is a number.' })
		.min(0, 'An amount is not less than nothing.')
		.max(1_000_000, 'That is more than this system will pay.')
);

/** A required amount: the basic pay, more than nothing. The action multiplies to minor. */
const basicAmount = z.coerce
	.number({ error: 'An amount is a number.' })
	.positive('A basic salary is more than nothing.')
	.max(1_000_000, 'That is more than this system will pay.');

const currency = z
	.string()
	.trim()
	.length(3, 'A currency is three letters, like BDT or USD.')
	.transform((value) => value.toUpperCase());

/** A period names a month: "2026-07". The API bills a calendar month at a time. */
const period = z
	.string()
	.trim()
	.regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'A period is a month, like 2026-07.');

/*
	A staff member's salary structure: their basic pay, plus allowances, less
	deductions. Amounts are major units in the box; the action sends minor. Setting it
	again replaces the current structure in place.
*/
export const setSalarySchema = z.object({
	basic_amount: basicAmount,
	allowances_amount: optionalAmount,
	deductions_amount: optionalAmount,
	currency,
	effective_from: optionalDate('That effective date is not a date.')
});

/*
	Generating payslips for a period. The period names the month ("2026-07"); a staff
	member narrows the run, and a blank one runs the whole workspace. The API is
	idempotent, so re-running the same period pays nobody twice.
*/
export const generateBatchSchema = z.object({
	period,
	staff_id: optionalUuid('Choose a staff member.')
});

/*
	Recording that a draft payslip was paid. The method is how the school records where
	the money went; it is optional.
*/
export const payPayslipSchema = z.object({
	method: optionalText(60)
});

/** The HTML constraints for the payroll forms, as attributes. Spread them onto the control. */
export const PAYROLL_LIMITS = {
	amount: { required: true, type: 'number', min: 0, step: '0.01' },
	optionalAmount: { type: 'number', min: 0, step: '0.01' },
	currency: { required: true, maxlength: 3, minlength: 3 },
	period: { required: true, placeholder: '2026-07', maxlength: 7 },
	effectiveFrom: { type: 'date' },
	method: { maxlength: 60 }
} as const;
