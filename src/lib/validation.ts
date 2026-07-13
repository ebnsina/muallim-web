import { z } from 'zod';
import type { SubmitFunction } from '@sveltejs/kit';

/*
	One schema, three places it runs: the field's own HTML attributes, this schema in
	the page before the request leaves, and the same schema in the action, which is
	the only one that decides. muallim-api validates again behind all three.
*/

/** One message per field. The first one: a reader fixes what is wrong, one thing at a time. */
export type FieldErrors = Record<string, string>;

/** One message per field. `z.flattenError` is Zod 4's shape; v3's `.flatten()` is gone.
 *  A rule about two fields belongs to neither, so it lands under `form`. */
export function fieldErrors(error: z.ZodError): FieldErrors {
	const flat = z.flattenError(error);

	const errors: FieldErrors = {};
	for (const [field, messages] of Object.entries(flat.fieldErrors)) {
		const first = (messages as string[] | undefined)?.[0];
		if (first) errors[field] = first;
	}

	const whole = flat.formErrors[0];
	if (whole) errors.form = whole;

	return errors;
}

/** Read a `FormData` through a schema. It is all strings, so the schema coerces. */
export function parseForm<T extends z.ZodType>(
	schema: T,
	data: FormData
): { ok: true; value: z.output<T> } | { ok: false; errors: FieldErrors } {
	const raw: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
	for (const key of new Set(data.keys())) {
		const all = data.getAll(key);
		raw[key] = all.length > 1 ? all : all[0];
	}

	const result = schema.safeParse(raw);
	return result.success
		? { ok: true, value: result.data }
		: { ok: false, errors: fieldErrors(result.error) };
}

/** `use:enhance`'s submit function, with the schema in front of it. Errors clear on a
 *  good submit: one left under a field the reader has fixed is a lie. */
export function validated<T extends z.ZodType>(
	schema: T,
	setErrors: (errors: FieldErrors) => void,
	onValid?: SubmitFunction
): SubmitFunction {
	return (input) => {
		const result = parseForm(schema, input.formData);

		if (!result.ok) {
			setErrors(result.errors);
			input.cancel();
			return;
		}

		setErrors({});
		return onValid?.(input);
	};
}
