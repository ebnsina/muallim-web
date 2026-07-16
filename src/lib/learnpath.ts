import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	Learning paths, as muallim-api models them: an ordered track of courses that is a
	draft until it is published. The bounds here are the API's own (`bin/openapi.json`);
	a rule invented in the web that the server does not share is a form that accepts
	what the API will refuse.
*/

export type Path = components['schemas']['LearningPathView'];
export type PathStatus = Path['status'];

/** The HTML constraints for the create form. Spread them onto the control. */
export const PATH_LIMITS = {
	title: { required: true, maxlength: 200 },
	slug: { required: true, maxlength: 200 },
	description: { maxlength: 2000 }
} as const;

// A blank box means "not set", so an optional field is absent rather than ''.
const blankIsAbsent = (value: unknown) => (value === '' ? undefined : value);

/*
	Creating a path. A title and a slug are both required — the slug is part of the
	path's address and the API asks for it up front, rather than deriving one. The
	description is optional and left off the wire when blank.
*/
export const createPathSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, 'Give the path a title.')
		.max(200, 'That is longer than 200 characters.'),
	slug: z
		.string()
		.trim()
		.min(1, 'Give the path a web address.')
		.max(200, 'That is longer than 200 characters.'),
	description: z.preprocess(
		blankIsAbsent,
		z.string().trim().max(2000, 'That is longer than 2000 characters.').optional()
	)
});

/** Editing a path's title and description. Both may be sent; a blank description clears it. */
export const editPathSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, 'Give the path a title.')
		.max(200, 'That is longer than 200 characters.'),
	description: z
		.string()
		.trim()
		.max(2000, 'That is longer than 2000 characters.')
		.optional()
		.transform((value) => value ?? '')
});

/** Draft is a work in progress; published is the state a learner can follow it in. */
export function pathStatusLabel(status: PathStatus): string {
	return status === 'published' ? 'Published' : 'Draft';
}

export function pathStatusTone(status: PathStatus): BadgeTone {
	return status === 'published' ? 'success' : 'warning';
}
