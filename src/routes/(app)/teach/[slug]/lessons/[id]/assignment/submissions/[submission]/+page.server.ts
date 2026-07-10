import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

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
		const points = Number(form.get('points'));

		// `0` is a grade, and `Number('')` is 0. An empty box is not a zero.
		if (!Number.isInteger(points) || String(form.get('points') ?? '').trim() === '') {
			return fail(422, { message: 'A grade is a whole number of points.' });
		}

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/assignment-submissions/{id}/mark',
			{
				params: { path: { id: params.submission } },
				body: { points, feedback: String(form.get('feedback') ?? '').trim() }
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
