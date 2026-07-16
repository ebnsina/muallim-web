import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	Course bundles: a named group of courses sold at one price. muallim-api works
	in minor units (poisha); an admin prices in major ones (taka), so every amount
	box is a major number the action multiplies before the request leaves — the
	`teach` price form is the reference. The bounds here are muallim-api's own; a
	number this form accepts that the server refuses is a form that lied.
*/

export type Bundle = components['schemas']['BundleView'];

/** Major units to minor: an admin prices in taka, the API is told poisha. */
export const MINOR_PER_MAJOR = 100;

/** Taka in the box → poisha on the wire. */
export function toMinor(major: number): number {
	return Math.round(major * MINOR_PER_MAJOR);
}

/** Poisha from the wire → taka to prefill an edit box. */
export function toMajor(minor: number): number {
	return minor / MINOR_PER_MAJOR;
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

/** A price, as an admin types it: major units, more than nothing. The action multiplies. */
const amount = z.coerce
	.number({ error: 'A price is a number.' })
	.positive('A price is more than nothing.')
	.max(1_000_000, 'That is more than this system will bill.');

const currency = z
	.string()
	.trim()
	.length(3, 'A currency is three letters, like BDT or USD.')
	.transform((value) => value.toUpperCase());

/*
	A slug is the bundle's address: lowercase letters, digits, and single hyphens,
	never leading, trailing, or doubled. muallim-api validates the same shape; a
	slug this accepts that it refuses is a 422 the reader could have been spared.
*/
const slug = z
	.string()
	.trim()
	.min(1, 'Give the bundle a web address.')
	.max(120, 'That is longer than 120 characters.')
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		'Use lowercase letters, numbers and single hyphens only — like starter-pack.'
	);

/*
	Creating a bundle: a name and a slug it cannot do without, a price in taka the
	action sends as poisha, and an optional description. Currency defaults to BDT.
*/
export const bundleCreateSchema = z.object({
	name: text(200, 'Give the bundle a name.'),
	slug,
	description: optionalText(2000),
	price: amount,
	currency: currency.default('BDT')
});

/*
	Editing a bundle: its name, description, and price. The slug is its address and
	does not change here; the courses are set through their own list.
*/
export const bundleEditSchema = z.object({
	name: text(200, 'Give the bundle a name.'),
	description: optionalText(2000),
	price: amount
});

/** The HTML constraints for the bundle forms, as attributes. Spread onto the control. */
export const BUNDLE_LIMITS = {
	name: { required: true, maxlength: 200 },
	slug: { required: true, maxlength: 120 },
	description: { maxlength: 2000 },
	price: { required: true, type: 'number', min: 0, step: '0.01' },
	currency: { required: true, maxlength: 3, minlength: 3 }
} as const;
