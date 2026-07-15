import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi, serverApi } from '$lib/server/api';
import { readResponse } from '$lib/quiz';
import type { Actions, PageServerLoad } from './$types';

/**
 * The quiz, and this learner's attempts at it.
 *
 * muallim-api decides who may see this: whoever may read the lesson may read its
 * quiz. It also decides what is in it — there are no answers in the response, and
 * there is nowhere in its shape to put one.
 */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	const api = locals.accessToken
		? authedApi(url.origin, locals.accessToken)
		: serverApi(url.origin);

	const quiz = await api.GET('/v1/lessons/{id}/quiz', { params: { path: { id: params.id } } });

	if (quiz.error || !quiz.data) {
		error(
			quiz.response?.status ?? 500,
			problemMessage(quiz.error, 'That quiz could not be loaded.')
		);
	}

	const attempts = quiz.data.attempts ?? [];

	return {
		slug: params.slug,
		lessonId: params.id,
		quiz: quiz.data.quiz,
		attempts,
		open: attempts.find((a) => a.status === 'in_progress') ?? null,
		signedIn: Boolean(locals.accessToken)
	};
};

export const actions: Actions = {
	/** Begin, or resume the attempt already open. Idempotent at the API. */
	start: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/lessons/{id}/quiz/attempts',
			{ params: { path: { id: params.id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That attempt could not be started.')
			});
		}
	},

	/**
	 * Sign a URL for a drawing answer's PNG.
	 *
	 * A draw_image answer's bytes go straight to the object store, like an assignment
	 * file: this signs the URL, the browser PUTs the canvas to it, and the key comes
	 * back as the answer. The API refuses this for anything but a live draw_image
	 * question of the caller's own open attempt.
	 */
	presignDrawing: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const questionId = String(form.get('question_id') ?? '');
		const bytes = Number(form.get('bytes'));

		if (!questionId || !Number.isSafeInteger(bytes) || bytes < 1) {
			return fail(422, { message: 'That drawing could not be read.' });
		}

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/lessons/{id}/quiz/attempts/current/answers/{question_id}/drawing',
			{ params: { path: { id: params.id, question_id: questionId } }, body: { bytes } }
		);

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That drawing could not be uploaded.')
			});
		}

		return { upload: data };
	},

	/**
	 * Save every answer, then submit.
	 *
	 * One request per question, because that is the shape of the contract: an
	 * answer is replaced individually so a learner may change their mind about one
	 * without resending the rest. They go in parallel — no answer depends on
	 * another — and the attempt is submitted only once every one of them has landed.
	 * Submitting first would grade an attempt whose answers were still in flight.
	 */
	submit: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const api = authedApi(url.origin, locals.accessToken);

		const saves = readResponse(form).map(({ questionId, response }) =>
			api.PUT('/v1/lessons/{id}/quiz/attempts/current/answers/{question_id}', {
				params: { path: { id: params.id, question_id: questionId } },
				body: { response }
			})
		);

		for (const saved of await Promise.all(saves)) {
			if (saved.error) {
				return fail(saved.response?.status ?? 500, {
					message: problemMessage(saved.error, 'An answer could not be saved.')
				});
			}
		}

		if (form.get('intent') === 'save') {
			return { saved: true };
		}

		const submitted = await api.POST('/v1/lessons/{id}/quiz/attempts/current/submit', {
			params: { path: { id: params.id } }
		});

		if (submitted.error || !submitted.data) {
			return fail(submitted.response?.status ?? 500, {
				message: problemMessage(submitted.error, 'That attempt could not be submitted.')
			});
		}

		// The result is not ready, and will not be for as long as grading takes. The
		// review page waits for it.
		redirect(
			303,
			`/courses/${params.slug}/lessons/${params.id}/quiz/${submitted.data.attempt.number}`
		);
	}
};
