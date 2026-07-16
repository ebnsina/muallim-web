import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	The library module's types and its forms' rules. A book is a title with a number
	of copies; a loan hands one copy to a student until it is returned. The bounds are
	muallim-api's own — a number invented here the server does not share is a form that
	accepts what the API will refuse.
*/

export type Book = components['schemas']['BookView'];
export type Loan = components['schemas']['LoanView'];

/** The states a loan may be in. muallim-api's enum; an unknown one is refused here too. */
export const LOAN_STATUSES = ['out', 'returned'] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export function loanStatusLabel(status: LoanStatus): string {
	return status === 'out' ? 'Borrowed' : 'Returned';
}

/** Out is a copy in a student's hands; returned is one back on the shelf. */
export function loanStatusTone(status: LoanStatus): BadgeTone {
	return status === 'out' ? 'warning' : 'success';
}

/** A loan is overdue when it is still out and its due date has passed. */
export function isOverdue(loan: Loan): boolean {
	return loan.status === 'out' && Date.parse(loan.due_at) < Date.now();
}

/** How a book's copies read: none free is a title fully out on loan. */
export function copiesTone(book: Book): BadgeTone {
	return book.available_copies > 0 ? 'accent' : 'neutral';
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

/** A date box, as an admin types it: YYYY-MM-DD, and a real date. */
const requiredDate = (missing: string, invalid: string) =>
	z
		.string({ error: missing })
		.trim()
		.min(1, missing)
		.refine((value) => !Number.isNaN(Date.parse(value)), invalid);

/*
	A book: a title and a count of copies, with an author, an ISBN and a category as the
	record. Only the title is required — a title with no other detail is still catalogued.
	Copies default to one; the API counts availability down from the total as loans go out.
*/
export const addBookSchema = z.object({
	title: text(200, 'Give the book a title.'),
	author: optionalText(120),
	isbn: optionalText(20),
	category: optionalText(60),
	total_copies: z.coerce
		.number({ error: 'Copies is a number.' })
		.int('Copies is a whole number.')
		.min(1, 'A book has at least one copy.')
		.max(100_000, 'That is more copies than this system will hold.')
});
export type AddBookInput = z.output<typeof addBookSchema>;

/*
	Issuing a loan: a book, the student borrowing it, and the day it is due back. The API
	takes a due timestamp; the form types a date, and the action sends the end of that day.
	No copy free is the API's 409, shown as it came.
*/
export const issueLoanSchema = z.object({
	book_id: z.uuid('Choose a book.'),
	student_id: z.uuid('Choose a student.'),
	due_date: requiredDate('Choose a due date.', 'That due date is not a date.')
});
export type IssueLoanInput = z.output<typeof issueLoanSchema>;

/** A YYYY-MM-DD due date to the end-of-day UTC timestamp the API stores. */
export function dueDateToTimestamp(dueDate: string): string {
	return `${dueDate}T23:59:59Z`;
}

/** The HTML constraints for the library forms, as attributes. Spread them onto the control. */
export const LIBRARY_LIMITS = {
	title: { required: true, maxlength: 200 },
	author: { maxlength: 120 },
	isbn: { maxlength: 20 },
	category: { maxlength: 60 },
	totalCopies: { required: true, type: 'number', min: 1, step: '1' },
	dueDate: { required: true, type: 'date' }
} as const;
