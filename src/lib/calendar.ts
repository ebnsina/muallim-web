import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	The academic calendar's type and its form's rules. muallim-api owns the dates and
	the span check; this file shapes what the school types and names each kind. The
	DOM already has a global `Event`, so the calendar's own row is `CalendarEvent`.
*/

export type CalendarEvent = components['schemas']['EventView'];

/** The kinds muallim-api knows. An unknown one is refused here as it is there. */
export const EVENT_KINDS = ['holiday', 'exam', 'event', 'term_start', 'term_end'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export function kindLabel(kind: EventKind): string {
	switch (kind) {
		case 'holiday':
			return 'Holiday';
		case 'exam':
			return 'Exam';
		case 'event':
			return 'Event';
		case 'term_start':
			return 'Term start';
		case 'term_end':
			return 'Term end';
	}
}

/** The pill's colour reads the kind: a holiday is a day off, an exam is a caution. */
export function kindTone(kind: EventKind): BadgeTone {
	switch (kind) {
		case 'holiday':
			return 'success';
		case 'exam':
			return 'warning';
		case 'event':
			return 'accent';
		case 'term_start':
		case 'term_end':
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

// An `<input type="date">` hands back YYYY-MM-DD; the API wants exactly that.
const isoDate = (message: string) =>
	z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, message)
		.refine((value) => !Number.isNaN(Date.parse(value)), message);

const optionalIsoDate = (message: string) =>
	z.preprocess(blankIsAbsent, isoDate(message).optional());

/*
	Adding an event. A title, a kind, and a start date are required; an end date makes
	it a span and a description is the note. muallim-api answers 422 when the span runs
	backwards — the refinement catches it first, and the 422 is the backstop shown as
	it came. ISO dates compare as strings, so `ends_on >= starts_on` is a plain compare.
*/
export const createEventSchema = z
	.object({
		title: text(200, 'Give the event a title.'),
		kind: z.enum(EVENT_KINDS, { error: 'Choose what kind of day this is.' }),
		starts_on: isoDate('Choose a start date.'),
		ends_on: optionalIsoDate('That end date is not a date.'),
		description: optionalText(2000)
	})
	.refine((v) => v.ends_on === undefined || v.ends_on >= v.starts_on, {
		path: ['ends_on'],
		message: 'The end date must be on or after the start date.'
	});

/** The HTML constraints for the calendar form, as attributes. Spread them onto the control. */
export const EVENT_LIMITS = {
	title: { required: true, maxlength: 200 },
	date: { type: 'date', required: true },
	endDate: { type: 'date' },
	description: { maxlength: 2000 }
} as const;
