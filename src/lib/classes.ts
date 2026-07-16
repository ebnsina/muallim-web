import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	The academic foundation: the classes a school teaches, the sections each class is
	split into, and the subjects taught across them. Attendance, fees, exams, hifz and
	the timetable all read this list, so a school with none of it dead-ends everywhere.
	The bounds here are muallim-api's own; a value this form accepts that the server
	refuses is a form that lied.
*/

export type Class = components['schemas']['ClassView'];
export type Section = components['schemas']['SectionView'];
export type Subject = components['schemas']['SubjectView'];

// `.trim()` before `.min(1)`: `required` asks whether a character was typed, and a
// space is a character.
const name = (missing: string) =>
	z.string().trim().min(1, missing).max(120, 'That is longer than 120 characters.');

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `That is longer than ${max} characters.`)
		.optional()
		.transform((value) => value ?? '');

/*
	Rank orders the classes junior to senior — Class 1 before Class 2 — and nothing
	else. An empty box is rank 0, which is where an unranked class sorts.
*/
const rank = z
	.union([z.literal(''), z.coerce.number()])
	.transform((value) => (value === '' ? 0 : value))
	.pipe(
		z
			.number({ error: 'An order is a number.' })
			.int('An order is a whole number.')
			.min(0, 'An order cannot be negative.')
			.max(1000, 'That is higher than this system will order.')
	);

/*
	Capacity is how many students a section seats. An empty box is 0, which the school
	reads as "no limit set" rather than a section nobody fits in.
*/
const capacity = z
	.union([z.literal(''), z.coerce.number()])
	.transform((value) => (value === '' ? 0 : value))
	.pipe(
		z
			.number({ error: 'A capacity is a number.' })
			.int('A capacity is a whole number.')
			.min(0, 'A capacity cannot be negative.')
			.max(100_000, 'That is more students than this system will seat.')
	);

/** A class: a name it cannot do without, and where it sorts among the others. */
export const classCreateSchema = z.object({
	name: name('Give the class a name.'),
	rank
});

/** A section of a class: a name, and how many students it seats. */
export const sectionCreateSchema = z.object({
	name: name('Give the section a name.'),
	capacity
});

/** A subject: a name, and an optional short code the school files it under. */
export const subjectCreateSchema = z.object({
	name: name('Give the subject a name.'),
	code: optionalText(40)
});

/** The HTML constraints for these forms, as attributes. Spread onto the control. */
export const CLASS_LIMITS = {
	name: { required: true, maxlength: 120 },
	rank: { type: 'number', min: 0, max: 1000, step: '1' },
	capacity: { type: 'number', min: 0, max: 100_000, step: '1' },
	code: { maxlength: 40 }
} as const;

/** The next class sorts after the last one, so the box opens on the obvious answer. */
export function nextRank(classes: Class[]): number {
	return classes.length === 0 ? 1 : Math.min(1000, Math.max(...classes.map((c) => c.rank)) + 1);
}
