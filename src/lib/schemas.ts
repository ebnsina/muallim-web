import { z } from 'zod';

/*
	Every form's rules, once — read by the page and by the action. The bounds are
	muallim-api's own (`bin/openapi.json`); a number invented here that the server
	does not share is a form that accepts what the API will refuse.
*/

/** The HTML constraints, as attributes. Spread them onto the control. */
export const LIMITS = {
	courseTitle: { required: true, maxlength: 200 },
	courseSummary: { maxlength: 500 },
	courseSlug: { maxlength: 200 },
	sectionTitle: { required: true, maxlength: 200 },
	lessonTitle: { required: true, maxlength: 200 },
	announcementTitle: { required: true, maxlength: 200 },
	announcementBody: { required: true, maxlength: 5000 },
	boardTitle: { required: true, maxlength: 200 },
	boardDescription: { maxlength: 500 },
	threadTitle: { required: true, maxlength: 200 },
	threadBody: { required: true, maxlength: 20000 },
	reply: { required: true, maxlength: 20000 },
	scaleName: { required: true, maxlength: 100 },
	reviewBody: { maxlength: 5000 }
} as const;

// `.trim()` before `.min(1)`: the browser's `required` asks whether a character was
// typed, and a space is a character.
const text = (max: number, missing: string) =>
	z.string().trim().min(1, missing).max(max, `That is longer than ${max} characters.`);

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `That is longer than ${max} characters.`)
		.optional()
		.transform((value) => value ?? '');

/** A whole number in a range. FormData is strings, so it coerces. */
const wholeNumber = (min: number, max: number, message: string) =>
	z.coerce.number({ error: message }).int(message).min(min, message).max(max, message);

// ----------------------------------------------------------------- courses

export const newCourseSchema = z.object({
	title: text(200, 'Give the course a title.'),
	summary: optionalText(500),

	// Blank is legal: the action derives it from the title.
	slug: optionalText(200)
});

export const sectionSchema = z.object({
	title: text(200, 'Give the section a title.')
});

export const lessonSchema = z.object({
	title: text(200, 'Give the lesson a title.')
});

export const announcementSchema = z.object({
	title: text(200, 'Give the announcement a title.'),
	body: text(5000, 'An announcement needs something to say.')
});

// ------------------------------------------------------------------- forum

export const boardSchema = z.object({
	title: text(200, 'Give the board a title.'),
	description: optionalText(500)
});

export const threadSchema = z.object({
	title: text(200, 'Give the thread a title.'),
	body: text(20000, 'Write something to start the thread.')
});

export const replySchema = z.object({
	body: text(20000, 'Write a reply first.')
});

// ------------------------------------------------------------------ grades

export const scaleNameSchema = z.object({
	name: text(100, 'Give the scale a name.')
});

/** A mark, bounded by the assignment's own maximum — so the max is a parameter. */
export const gradeSchema = (maxPoints: number) =>
	z.object({
		points: wholeNumber(0, maxPoints, `A grade is a whole number from 0 to ${maxPoints}.`)
	});

// ------------------------------------------------------------------ review

export const reviewSchema = z.object({
	rating: wholeNumber(1, 5, 'Choose a rating from 1 to 5 stars.'),
	body: optionalText(5000)
});
