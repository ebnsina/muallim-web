import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { gradeSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** The assignment's own maximum, carried by the form so the schema can bound the mark. */
function maxPoints(form: FormData): number {
	const max = Number(form.get('max_points'));
	return Number.isInteger(max) && max > 0 ? max : 1000;
}

/** One learner's work, with what it is worth. */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) error(401, 'Sign in to mark this assignment.');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/assignment-submissions/{id}', {
		params: { path: { id: params.submission } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'That submission could not be loaded.'));
	}

	return {
		slug: params.slug,
		lessonId: params.id,
		submissionId: params.submission,
		assignment: data.assignment,
		submission: data.submission
	};
};

export const actions: Actions = {
	/**
	 * Record a grade.
	 *
	 * Clearing the pass mark completes the lesson, in the transaction that recorded
	 * the grade — so the course roll-up can never disagree with the marks it
	 * summarises. Re-marking is allowed and idempotent.
	 */
	mark: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to mark this assignment.');

		const form = await request.formData();

		// The schema the page ran; this one decides. A blank box is not a zero.
		const parsed = parseForm(gradeSchema(maxPoints(form)), form);
		if (!parsed.ok) return fail(422, { errors: parsed.errors });

		const { points, feedback } = parsed.value;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/assignment-submissions/{id}/mark',
			{
				params: { path: { id: params.submission } },
				body: { points, feedback }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That grade could not be recorded.')
			});
		}

		// Back to the queue, which is where the next thing to mark is.
		redirect(303, `/teach/${params.slug}/lessons/${params.id}/assignment/submissions`);
	},

	/** A signed URL for one of this learner's files. Requires `submission:grade`. */
	download: async ({ request, locals, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to mark this assignment.');

		const form = await request.formData();

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/assignment-files/{id}/download', {
			params: { path: { id: String(form.get('file_id') ?? '') } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That file could not be downloaded.')
			});
		}

		return { url: data.url };
	}
};
