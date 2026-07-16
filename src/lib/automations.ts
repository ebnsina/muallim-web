import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	Automations: a workspace's own rules for the mail it sends — "when a learner
	enrols, email them this". A rule names one event, and its subject and body may
	only use the placeholders that event offers. muallim-api holds that list and
	refuses a template that reaches past it, so the list is fetched, never written
	here: an event added there must reach this form without a release.
*/

export type Automation = components['schemas']['AutomationRuleView'];
export type AutomationEvent = components['schemas']['AutomationEventView'];

/** The events the write endpoints accept, spelled as they spell them. */
export type EventKey = Automation['event'];

/*
	The raw key is muallim-api's word, not an author's. Anything unmapped falls
	through as itself: an invented name for an event we have not met would read as
	fact and be wrong.
*/
const EVENT_LABELS: Record<EventKey, string> = {
	'learner.enrolled': 'When a learner enrols',
	'course.completed': 'When a learner finishes a course'
};

const EVENT_DESCRIPTIONS: Record<EventKey, string> = {
	'learner.enrolled': 'Sent once, as soon as someone joins a course.',
	'course.completed': 'Sent once, when someone reaches the end of a course.'
};

/** The event in plain words. An event we have no words for keeps its own name. */
export function eventLabel(event: string): string {
	return EVENT_LABELS[event as EventKey] ?? event;
}

/** One line on when the mail goes out, or nothing when we cannot say. */
export function eventDescription(event: string): string {
	return EVENT_DESCRIPTIONS[event as EventKey] ?? '';
}

/** What a placeholder looks like to the author, and to muallim-api: `{{learner_name}}`. */
export function placeholderToken(name: string): string {
	return `{{${name}}}`;
}

/** `{{learner_name}}` → "the learner's name", near enough to read aloud. */
export function placeholderHint(name: string): string {
	return name.replace(/_/g, ' ');
}

const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

/** Every placeholder a template names, in the order it names them, without repeats. */
export function placeholdersIn(text: string): string[] {
	return [...new Set([...text.matchAll(PLACEHOLDER_PATTERN)].map((m) => m[1]))];
}

/*
	The names a template uses that its event cannot fill. muallim-api refuses these
	outright; catching them here means the author is told beside the box rather than
	after the save.
*/
export function unknownPlaceholders(text: string, allowed: readonly string[]): string[] {
	const known = new Set(allowed);
	return placeholdersIn(text).filter((name) => !known.has(name));
}

/** The placeholders one event offers, or none when the event is not among them. */
export function placeholdersFor(events: AutomationEvent[], event: string): string[] {
	return events.find((e) => e.event === event)?.placeholders ?? [];
}

// `.trim()` before `.min(1)`: `required` asks whether a character was typed, and a
// space is a character.
const subject = z
	.string()
	.trim()
	.min(1, 'Give the email a subject line.')
	.max(300, 'That is longer than 300 characters.');

const body = z
	.string()
	.trim()
	.min(1, 'Write what the email should say.')
	.max(5000, 'That is longer than 5,000 characters.');

/*
	The event is a string, not a list this file knows: the chooser is built from
	muallim-api's own events, and an enum written here would refuse a new one the
	day it ships. muallim-api rejects an event it does not have.
*/
const event = z.string().trim().min(1, 'Choose when this email should be sent.');

/** A ticked checkbox arrives as "on"; an unticked one does not arrive at all. */
const checkbox = z
	.union([z.literal('on'), z.literal('true'), z.undefined()])
	.transform((value) => value !== undefined);

/*
	Writing a rule: the event it fires on, and the mail itself. Switched off unless
	the author says otherwise — a rule being drafted must not reach the next person
	who enrols.
*/
export const automationCreateSchema = z.object({
	event,
	subject,
	body,
	enabled: checkbox
});

/*
	Editing a rule: the subject, the body, and whether it is on. The event is fixed
	when the rule is written — one that fires on something else is a different rule.
*/
export const automationEditSchema = z.object({
	id: z.string().uuid('That automation could not be found.'),
	subject,
	body,
	enabled: checkbox
});

/** The HTML constraints for the automation form, as attributes. Spread onto the control. */
export const AUTOMATION_LIMITS = {
	subject: { required: true, maxlength: 300 },
	body: { required: true, maxlength: 5000 }
} as const;
