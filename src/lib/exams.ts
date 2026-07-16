import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	Exams and report cards, as muallim-api models them. The bounds and enums here are
	the API's own (`bin/openapi.json`); a rule invented in the web that the server does
	not share is a form that accepts what the API will refuse.
*/

export type Exam = components['schemas']['ExamView'];
export type ExamStatus = Exam['status'];
export type GradingScale = components['schemas']['GradingScaleView'];
export type GradeBand = components['schemas']['GradeBandView'];
export type Subject = components['schemas']['SubjectView'];
export type MarkInput = components['schemas']['MarkInput'];
export type ReportCard = components['schemas']['ReportCardView'];
export type SubjectResult = components['schemas']['SubjectResultView'];
export type Term = components['schemas']['TermView'];

/** The HTML constraints for the exam forms. Spread them onto the control. */
export const EXAM_LIMITS = {
	name: { required: true, maxlength: 200 },
	fullMarks: { type: 'number', min: 0, max: 1000, step: 1 },
	obtained: { type: 'number', min: 0, max: 1000, step: 1 },
	heldOn: { type: 'date' }
} as const;

// A blank picker or box means "not set", so an empty option is absent, not ''.
const blankIsAbsent = (value: unknown) => (value === '' ? undefined : value);
const optionalUuid = (message: string) => z.preprocess(blankIsAbsent, z.uuid(message).optional());
const optionalDate = (message: string) =>
	z.preprocess(
		blankIsAbsent,
		z
			.string()
			.refine((value) => !Number.isNaN(Date.parse(value)), message)
			.optional()
	);

/*
	Creating an exam. The name and the scale it is graded against are required; the
	class, term, and the day it was held place it, and any of the three may be left off.
*/
export const createExamSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Give the exam a name.')
		.max(200, 'That is longer than 200 characters.'),
	scale_id: z.uuid('Choose a grading scale.'),
	grade_level_id: optionalUuid('Choose a class.'),
	term_id: optionalUuid('Choose a term.'),
	held_on: optionalDate('That is not a date.')
});

/** Draft is being marked; published is the state a report card can be read in. */
export function examStatusLabel(status: ExamStatus): string {
	return status === 'published' ? 'Published' : 'Draft';
}

export function examStatusTone(status: ExamStatus): BadgeTone {
	return status === 'published' ? 'success' : 'warning';
}

/** A GPA to two places, as a report card carries it. */
export function formatGpa(gpa: number): string {
	return gpa.toFixed(2);
}

/** A percentage, rounded to a whole number the same way the API rounds a total. */
export function formatPercent(percent: number): string {
	return `${Math.round(percent)}%`;
}

/** A pass reads calm; a fail reads as the one thing to notice on the card. */
export function passTone(passed: boolean): BadgeTone {
	return passed ? 'success' : 'danger';
}
