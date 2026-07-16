import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	The admissions module's types and its forms' rules. An application is submitted,
	then accepted or rejected from pending, then an accepted one is admitted — which
	creates the student. The bounds are muallim-api's own; a number invented here
	that the server does not share is a form that accepts what the API will refuse.
*/

export type Application = components['schemas']['ApplicationView'];

/** The states an application moves through. muallim-api's enum; an unknown one is refused here too. */
export const ADMISSION_STATUSES = ['pending', 'accepted', 'rejected', 'admitted'] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

/** What a status is called in the UI. The API's enum is lowercase; a list is read. */
export function statusLabel(status: AdmissionStatus): string {
	switch (status) {
		case 'pending':
			return 'Pending';
		case 'accepted':
			return 'Accepted';
		case 'rejected':
			return 'Rejected';
		case 'admitted':
			return 'Admitted';
	}
}

/** Pending awaits a decision, accepted awaits admission, rejected is closed, admitted is a student. */
export function statusTone(status: AdmissionStatus): BadgeTone {
	switch (status) {
		case 'pending':
			return 'warning';
		case 'accepted':
			return 'accent';
		case 'rejected':
			return 'danger';
		case 'admitted':
			return 'success';
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

// Blank means "leave it out", so an empty box is not a value.
const blankIsAbsent = (value: unknown) => (value === '' ? undefined : value);

const optionalUuid = (message: string) => z.preprocess(blankIsAbsent, z.uuid(message).optional());

const optionalWholeNumber = (min: number, max: number, message: string) =>
	z.preprocess(
		blankIsAbsent,
		z.coerce.number({ error: message }).int(message).min(min, message).max(max, message).optional()
	);

/** A blank `date` box is "not given", not an error. */
const optionalDate = (message: string) =>
	z.preprocess(
		blankIsAbsent,
		z
			.string()
			.refine((value) => !Number.isNaN(Date.parse(value)), message)
			.optional()
	);

/*
	Submitting an application. Only the applicant's name is required — the guardian's
	details, the class applied for, the date of birth, and a note are all things a
	school may not have yet when the form comes in.
*/
export const submitAdmissionSchema = z.object({
	applicant_name: text(120, 'Enter the applicant’s name.'),
	guardian_name: optionalText(120),
	guardian_phone: optionalText(40),
	guardian_email: z.preprocess(blankIsAbsent, z.email('Enter a valid email address.').optional()),
	grade_level_id: optionalUuid('Choose a class.'),
	dob: optionalDate('That date of birth is not a date.'),
	note: optionalText(2000)
});

/*
	Admitting an accepted application. The admission number is the one thing a roster
	cannot do without; the section places the student within the class they applied
	for, and a roll is their number in it — both optional, an unplaced student is legal.
*/
export const admitAdmissionSchema = z.object({
	admission_no: text(60, 'Give the student an admission number.'),
	section_id: optionalUuid('Choose a section.'),
	roll: optionalWholeNumber(0, 100000, 'A roll number is a whole number, zero or more.')
});

/** The HTML constraints for the admissions forms, as attributes. Spread them onto the control. */
export const ADMISSION_LIMITS = {
	applicantName: { required: true, maxlength: 120 },
	guardianName: { maxlength: 120 },
	guardianPhone: { maxlength: 40 },
	guardianEmail: { type: 'email', maxlength: 320 },
	dob: { type: 'date' },
	note: { maxlength: 2000 },
	admissionNo: { required: true, maxlength: 60 },
	roll: { type: 'number', min: 0, max: 100000, step: 1 }
} as const;
