import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	The course-taxonomy module's types and its forms' rules. A category and a tag are
	each a name; muallim-api derives the slug, so nothing here sends one. The bounds
	are the server's own — a number invented here it does not share is a form that
	accepts what the API will refuse.
*/

export type Category = components['schemas']['CourseCategoryView'];
export type Tag = components['schemas']['TagView'];
export type CourseSummary = components['schemas']['CourseSummary'];

// `.trim()` before `.min(1)`: `required` asks whether a character was typed, and a
// space is a character.
const name = (max: number, missing: string) =>
	z.string().trim().min(1, missing).max(max, `That is longer than ${max} characters.`);

/** A category: a name, and nothing else — the server derives the slug. */
export const categorySchema = z.object({
	name: name(120, 'Give the category a name.')
});

/** A tag: a name, and nothing else — the server derives the slug. */
export const tagSchema = z.object({
	name: name(60, 'Give the tag a name.')
});

/** The HTML constraints for the taxonomy forms, as attributes. Spread onto the control. */
export const TAXONOMY_LIMITS = {
	categoryName: { required: true, maxlength: 120 },
	tagName: { required: true, maxlength: 60 }
} as const;

/** A GET-taxonomy response carries a category even when there is none; an empty id is "none". */
export function hasCategory(category: Category | null | undefined): category is Category {
	return !!category && !!category.id;
}
