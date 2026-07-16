import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	Academic years and the terms inside them. muallim-api holds at most one current
	year and refuses a span that does not end after it starts; the bounds and the
	date rule here are its own, so a form that accepts more than it does is a form
	that lied to the reader.
*/

export type Year = components['schemas']['YearView'];
export type Term = components['schemas']['TermView'];
export type InstitutionType = components['schemas']['Get-institution-typeResponse']['type'];

/** The kinds a workspace may call itself, in the order muallim-api declares them. */
export const INSTITUTION_TYPES = ['school', 'college', 'madrasa', 'coaching'] as const;

const INSTITUTION_LABELS: Record<InstitutionType, string> = {
	school: 'School',
	college: 'College',
	madrasa: 'Madrasa',
	coaching: 'Coaching centre'
};

export function institutionLabel(type: InstitutionType): string {
	return INSTITUTION_LABELS[type];
}

// `.trim()` before `.min(1)`: `required` asks whether a character was typed, and a
// space is a character.
const name = (missing: string) =>
	z.string().trim().min(1, missing).max(120, 'That is longer than 120 characters.');

const day = (missing: string) =>
	z
		.string()
		.trim()
		.min(1, missing)
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date from the calendar.');

// The API refuses a span that does not end after it starts. Catching it here spares
// the reader a round trip; the message lands on the whole form, being about neither date.
const endsAfterStarts = <T extends z.ZodType<{ starts_on: string; ends_on: string }>>(schema: T) =>
	schema.refine((value) => value.ends_on > value.starts_on, {
		error: 'The end date must come after the start date.'
	});

/** A year: what it is called, and the span it covers. It is not current until made so. */
export const yearCreateSchema = endsAfterStarts(
	z.object({
		name: name('Give the year a name.'),
		starts_on: day('Choose the day the year starts.'),
		ends_on: day('Choose the day the year ends.')
	})
);

/** A term inside a year. The API orders terms by the span, so both dates are needed. */
export const termCreateSchema = endsAfterStarts(
	z.object({
		year_id: z.string().uuid('Choose which year this term belongs to.'),
		name: name('Give the term a name.'),
		starts_on: day('Choose the day the term starts.'),
		ends_on: day('Choose the day the term ends.')
	})
);

/** What kind of institution this workspace is. Anything else is not a choice we offer. */
export const institutionTypeSchema = z.object({
	type: z.enum(INSTITUTION_TYPES, { error: 'Choose what kind of institution this is.' })
});

/** The HTML constraints for these forms, as attributes. Spread onto the control. */
export const YEAR_LIMITS = {
	name: { required: true, maxlength: 120 },
	date: { required: true, type: 'date' }
} as const;
