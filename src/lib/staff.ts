import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	The staff module's type and its forms' rules. The roster is muallim-api's own
	bounds; a limit invented here that the server does not share is a form that
	accepts what the API will refuse.
*/

export type Staff = components['schemas']['StaffView'];

/** The roles muallim-api knows. An unknown one is refused here as it is there. */
export const STAFF_ROLES = [
	'teacher',
	'principal',
	'admin',
	'accountant',
	'librarian',
	'support'
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_STATUSES = ['active', 'inactive'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export function roleLabel(role: StaffRole): string {
	switch (role) {
		case 'teacher':
			return 'Teacher';
		case 'principal':
			return 'Principal';
		case 'admin':
			return 'Admin';
		case 'accountant':
			return 'Accountant';
		case 'librarian':
			return 'Librarian';
		case 'support':
			return 'Support';
	}
}

export function statusLabel(status: StaffStatus): string {
	return status === 'active' ? 'Active' : 'Inactive';
}

/** Active is the working state; inactive is a member no longer on the payroll. */
export function statusTone(status: StaffStatus): BadgeTone {
	return status === 'active' ? 'success' : 'warning';
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

const optionalDate = (message: string) =>
	z.preprocess(
		blankIsAbsent,
		z
			.string()
			.refine((value) => !Number.isNaN(Date.parse(value)), message)
			.optional()
	);

const optionalEmail = z.preprocess(
	blankIsAbsent,
	z.email('Enter a valid email address.').max(320, 'That is longer than 320 characters.').optional()
);

const role = z.enum(STAFF_ROLES, { error: 'Choose a role.' });
const status = z.enum(STAFF_STATUSES, { error: 'Choose a status.' });

/*
	Hiring a member. Only a name and a role are required; a staff number, an email, a
	phone and a joining date are the record, and a member with none of them is still
	on the roster. A duplicate staff number is the API's 409, shown as it came.
*/
export const hireStaffSchema = z.object({
	full_name: text(120, 'Enter the member’s full name.'),
	role,
	staff_no: optionalText(60),
	email: optionalEmail,
	phone: optionalText(40),
	joined_on: optionalDate('That joining date is not a date.')
});

/** Editing a member. The same fields, plus their standing; every one may be changed. */
export const updateStaffSchema = z.object({
	full_name: text(120, 'A member needs a name.'),
	role,
	status,
	email: optionalEmail,
	phone: optionalText(40),
	joined_on: optionalDate('That joining date is not a date.')
});

/** The HTML constraints for the staff forms, as attributes. Spread them onto the control. */
export const STAFF_LIMITS = {
	fullName: { required: true, maxlength: 120 },
	staffNo: { maxlength: 60 },
	email: { type: 'email', maxlength: 320 },
	phone: { maxlength: 40 },
	joinedOn: { type: 'date' }
} as const;
