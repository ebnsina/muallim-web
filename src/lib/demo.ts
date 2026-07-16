import { z } from 'zod';
import type { components } from '$lib/api/schema';

/**
 * A demo request, as the form means it.
 *
 * The intents are not listed here. They are the enum on `RequestDemoRequest`,
 * generated out of muallim-api's OpenAPI document and checked again by a `CHECK`
 * on `demo_requests.intent` — so the set is written once, in Go, and a value this
 * form can offer is a value the column will take. A literal union typed in here
 * would be a fourth copy of the same seven words, and the first to drift.
 *
 * Every rule below is muallim-api's rule, restated where the reader is. The API
 * decides; this only decides sooner, which is the difference between a sentence
 * under the field and a round trip to be told the name is empty.
 */

export type Intent = components['schemas']['RequestDemoRequest']['intent'];

/** The catalogue, in the order the form offers it, with our words for the wire's. */
export const INTENTS: { value: Intent; label: string; line: string }[] = [
	{ value: 'creator', label: 'A solo creator', line: 'You teach it and you sell it.' },
	{ value: 'school', label: 'A school or college', line: 'A register, exams, report cards.' },
	{ value: 'madrasa', label: 'A madrasa', line: 'Hifz, your own classes and scale.' },
	{ value: 'coaching', label: 'A coaching centre', line: 'Batches, and a fee per course.' },
	{ value: 'agency', label: 'An agency', line: 'A separate workspace per client.' },
	{ value: 'nonprofit', label: 'A nonprofit', line: 'Teach it free, grow a community.' },
	{ value: 'other', label: 'Something else', line: 'Tell us when we call.' }
];

const intentValues = INTENTS.map((i) => i.value) as [Intent, ...Intent[]];

/** Step one: who is asking. */
export const intentSchema = z.object({
	intent: z.enum(intentValues, { message: 'Tell us what you are asking about.' })
});

/** Step two: who to call. Bounds are the columns'. */
export const contactSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Enter your name.')
		.max(200, 'That name is longer than we can store.'),
	// The only thing worth asserting about an address is that it could be one: a
	// stricter rule rejects real addresses, and nothing is delivered to it — a
	// person reads it and replies.
	email: z
		.string()
		.trim()
		.min(1, 'Enter your email address.')
		.max(320, 'That address is longer than we can store.')
		.refine((v) => v.includes('@'), 'That does not look like an email address.'),
	// Free text on purpose, like the column. E.164 refuses half the ways a
	// Bangladeshi writes their own number, and we would rather have it.
	phone: z
		.string()
		.trim()
		.min(3, 'Enter a phone number.')
		.max(40, 'That number is longer than we can store.')
});

/**
 * Step three: the terms.
 *
 * An unticked box is a refusal rather than a field that failed, which is why it
 * has its own schema and its own step. muallim-api draws the same line: it returns
 * ErrNotAgreed before it opens a transaction, so nobody's phone number is stored
 * because they nearly agreed.
 */
export const termsSchema = z.object({
	agreed: z.literal('on', { message: 'Please agree to the terms before sending your details.' })
});

/** What the action submits: every step at once, because a step could be skipped. */
export const demoRequestSchema = intentSchema.extend(contactSchema.shape).extend(termsSchema.shape);

export type DemoRequest = z.output<typeof demoRequestSchema>;

/** The schema each step is allowed past. Indexed by step, so the form has no `if`. */
export const stepSchemas = [intentSchema, contactSchema, termsSchema] as const;
