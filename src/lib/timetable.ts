import { z } from 'zod';
import type { components } from '$lib/api/schema';

export type Period = components['schemas']['PeriodView'];
export type Subject = components['schemas']['SubjectView'];

/*
	The week, Sunday-first, as muallim-api numbers it: 0 = Sunday … 6 = Saturday. The
	grid is drawn in this order, so a period's `day_of_week` indexes straight into it.
*/
export const DAYS = [
	{ value: 0, label: 'Sunday', short: 'Sun' },
	{ value: 1, label: 'Monday', short: 'Mon' },
	{ value: 2, label: 'Tuesday', short: 'Tue' },
	{ value: 3, label: 'Wednesday', short: 'Wed' },
	{ value: 4, label: 'Thursday', short: 'Thu' },
	{ value: 5, label: 'Friday', short: 'Fri' },
	{ value: 6, label: 'Saturday', short: 'Sat' }
] as const;

/** The periods of one day, earliest first. `HH:MM` sorts as text, so no clock maths. */
export function periodsByDay(periods: Period[]): Period[][] {
	const week: Period[][] = DAYS.map(() => []);
	for (const period of periods) {
		const day = week[period.day_of_week];
		if (day) day.push(period);
	}
	for (const day of week) day.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
	return week;
}

/** A subject's name behind the id a period carries — an unassigned period shows nothing. */
export function subjectMap(subjects: Subject[]): Map<string, string> {
	return new Map(subjects.map((subject) => [subject.id, subject.name]));
}

// Blank means absent, not empty — an unpicked subject is no subject, not a malformed id.
const blankIsAbsent = (value: unknown) => (value === '' ? undefined : value);

const time = z.string().refine((value) => /^\d{2}:\d{2}$/.test(value), 'Enter a time as HH:MM.');

/*
	Adding a period. The day and its two times are required; subject, teacher, and room
	place it. The end must fall after the start — a zero-length period is not one — and
	muallim-api decides whether the slot is already taken, answered as its 422.
*/
export const addPeriodSchema = z
	.object({
		day_of_week: z.coerce
			.number({ error: 'Choose a day.' })
			.int()
			.min(0, 'Choose a day.')
			.max(6, 'Choose a day.'),
		starts_at: time,
		ends_at: time,
		subject_id: z.preprocess(blankIsAbsent, z.uuid('Choose a subject.').optional()),
		teacher_name: z
			.string()
			.trim()
			.max(120, 'That is longer than 120 characters.')
			.optional()
			.transform((value) => value ?? ''),
		room: z
			.string()
			.trim()
			.max(60, 'That is longer than 60 characters.')
			.optional()
			.transform((value) => value ?? '')
	})
	.refine((value) => value.ends_at > value.starts_at, {
		path: ['ends_at'],
		message: 'The period ends before it starts.'
	});
