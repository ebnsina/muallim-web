import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { awardSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/**
 * One attempt, as its marker sees it: the questions with their answer key, and
 * what the learner wrote.
 *
 * This and the authoring view are the only two responses in the whole API that
 * carry a correct answer. Both require a permission to reach.
 */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const submission = await authedApi(url.origin, locals.accessToken).GET('/v1/attempts/{id}', {
		params: { path: { id: params.attempt } }
	});

	if (submission.error || !submission.data) {
		error(
			submission.response?.status ?? 500,
			problemMessage(submission.error, 'That attempt could not be loaded.')
		);
	}

	const answers = new Map((submission.data.answers ?? []).map((a) => [a.question_id, a]));

	return {
		slug: params.slug,
		lessonId: params.id,
		attemptId: params.attempt,
		attempt: submission.data.attempt,

		// Only the essays are markable. The rest are shown for context, and muallim-api
		// refuses a mark on them — an instructor who could overwrite the machine's
		// verdict on a multiple-choice question could quietly make a wrong answer right.
		questions: (submission.data.questions ?? []).map((question) => ({
			...question,
			answer: answers.get(question.id) ?? null
		}))
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const questionId = String(form.get('question_id') ?? '');

		// One marking form per open question, so a refusal names the question it is
		// about — otherwise it would light up every box on the page.
		const max = Number(form.get('max_points'));
		const parsed = parseForm(awardSchema(Number.isInteger(max) && max > 0 ? max : 1000), form);
		if (!parsed.ok) return fail(400, { questionId, errors: parsed.errors });

		const { points } = parsed.value;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/attempts/{id}/answers/{question_id}/mark',
			{
				params: { path: { id: params.attempt, question_id: questionId } },
				body: { points, feedback: String(form.get('feedback') ?? '').trim() }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That mark could not be recorded.')
			});
		}
	}
};
