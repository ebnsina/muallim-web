import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

export type RegisterEntry = components['schemas']['RegisterEntryView'];
export type AttendanceDay = components['schemas']['AttendanceDayView'];
export type AttendanceSummary = components['schemas']['AttendanceSummaryView'];

/** The four states a day can be marked in. muallim-api's enum; an unknown one is refused here too. */
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** What a status is called in the register. Present is the default, so it is unremarkable. */
export function statusLabel(status: AttendanceStatus): string {
	switch (status) {
		case 'present':
			return 'Present';
		case 'absent':
			return 'Absent';
		case 'late':
			return 'Late';
		case 'excused':
			return 'Excused';
	}
}

/** The eye should land on an absence; present is the quiet, expected state. */
export function statusTone(status: AttendanceStatus): BadgeTone {
	switch (status) {
		case 'present':
			return 'success';
		case 'absent':
			return 'danger';
		case 'late':
			return 'warning';
		case 'excused':
			return 'neutral';
	}
}

/** Today, as a `YYYY-MM-DD` a `<input type="date">` and the API both read. */
export function today(): string {
	return new Date().toISOString().slice(0, 10);
}

// FormData collapses a single-valued key to a string; a register of one is still an array.
const asArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);
const toArray = (value: unknown) => (value == null ? [] : asArray(value));

const isoDate = z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), 'Choose a date.');

/*
	Marking a register. The section and date name the day; `student_id` and `status`
	are parallel arrays, one pair per row, zipped into entries by the action. They must
	match in length, or a row lost its status somewhere between the grid and the wire.
*/
export const markAttendanceSchema = z
	.object({
		section_id: z.uuid('Choose a section.'),
		on_date: isoDate,
		student_id: z.preprocess(
			toArray,
			z.array(z.uuid()).min(1, 'There is nobody in this section to mark.')
		),
		status: z.preprocess(toArray, z.array(z.enum(ATTENDANCE_STATUSES)))
	})
	.refine((value) => value.student_id.length === value.status.length, {
		message: 'The register did not add up. Reload the page and mark it again.'
	});

/** The history lookup: one student, a window of days. Blank dates are refused by the form. */
export const historySchema = z
	.object({
		student: z.uuid('Choose a student.'),
		from: isoDate,
		to: isoDate
	})
	.refine((value) => value.from <= value.to, {
		path: ['to'],
		message: 'The end date is before the start.'
	});
