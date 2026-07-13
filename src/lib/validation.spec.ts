import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { newCourseSchema, replySchema } from './schemas';
import { fieldErrors, parseForm } from './validation';

/** A form, as a browser would send it. */
function form(fields: Record<string, string>): FormData {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
}

describe('parseForm', () => {
	it('reads a good form into its values', () => {
		const result = parseForm(newCourseSchema, form({ title: 'Optics', summary: 'Light.' }));

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toEqual({ title: 'Optics', summary: 'Light.', slug: '' });
	});

	it('keys each message to the field it is about', () => {
		const result = parseForm(newCourseSchema, form({ title: '', summary: 'x'.repeat(501) }));

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.title).toBe('Give the course a title.');
			expect(result.errors.summary).toMatch(/longer than 500/);
		}
	});

	// What the browser's `required` lets through: a space is a character.
	it('refuses a field holding only whitespace', () => {
		const result = parseForm(replySchema, form({ body: '   ' }));

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.errors.body).toBe('Write a reply first.');
	});

	it('coerces the strings FormData is made of', () => {
		const schema = z.object({ points: z.coerce.number().int() });
		const result = parseForm(schema, form({ points: '80' }));

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.points).toBe(80);
	});
});

describe('fieldErrors', () => {
	it('keeps one message per field — a reader fixes one thing at a time', () => {
		const schema = z.object({
			title: z.string().min(5, 'Too short.').regex(/^A/, 'Start with A.')
		});
		const parsed = schema.safeParse({ title: 'b' });

		expect(parsed.success).toBe(false);
		if (!parsed.success) expect(fieldErrors(parsed.error)).toEqual({ title: 'Too short.' });
	});

	// A rule about two fields at once belongs to neither, so it is the form's.
	it('puts a message about no single field under `form`', () => {
		const schema = z
			.object({ from: z.number(), to: z.number() })
			.refine((v) => v.to > v.from, { message: 'The end comes after the start.' });
		const parsed = schema.safeParse({ from: 5, to: 1 });

		expect(parsed.success).toBe(false);
		if (!parsed.success)
			expect(fieldErrors(parsed.error).form).toBe('The end comes after the start.');
	});
});
