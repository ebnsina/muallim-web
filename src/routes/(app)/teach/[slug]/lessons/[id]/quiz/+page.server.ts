import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

const TYPES = [
	'true_false',
	'single_choice',
	'multiple_choice',
	'fill_blanks',
	'short_answer',
	'ordering',
	'matching',
	'open_ended',
	'range'
] as const;

type QuestionType = (typeof TYPES)[number];

/** Narrows a submitted enum rather than asserting it: a form field is user input. */
function oneOf<T extends string>(allowed: readonly T[], value: string, fallback: T): T {
	return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function wholeNumber(raw: FormDataEntryValue | null, fallback: number): number {
	const value = String(raw ?? '').trim();
	if (value === '') return fallback;

	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed >= 0 ? parsed : NaN;
}

/**
 * The accepted spellings, one line per blank, alternatives separated by `|`.
 *
 *     4 | four
 *     Paris
 *
 * A form cannot express a ragged array of arrays, and this is the smallest thing
 * that can. Empty lines are dropped rather than becoming a blank nobody can fill.
 */
function acceptedAnswers(raw: string): string[][] {
	return raw
		.split('\n')
		.map((line) =>
			line
				.split('|')
				.map((s) => s.trim())
				.filter(Boolean)
		)
		.filter((blank) => blank.length > 0);
}

/**
 * The options, as parallel arrays of the three fields a row has. A row whose
 * content is blank is a row the author added and never filled in.
 */
function options(form: FormData) {
	const contents = form.getAll('option_content').map(String);
	const correct = new Set(form.getAll('option_correct').map(String));
	const matches = form.getAll('option_match').map(String);

	return contents
		.map((content, index) => ({
			content: content.trim(),
			// The checkbox carries its row's index, because an unchecked checkbox sends
			// nothing at all and the positions would otherwise slide.
			is_correct: correct.has(String(index)),
			match_content: (matches[index] ?? '').trim()
		}))
		.filter((option) => option.content !== '');
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	// The lesson, for its title; and the quiz, which may not exist yet. A 404 from
	// the second is the answer "no quiz", not a failure.
	const [lesson, quiz] = await Promise.all([
		api.GET('/v1/lessons/{id}/content', { params: { path: { id: params.id } } }),
		api.GET('/v1/lessons/{id}/quiz/authoring', { params: { path: { id: params.id } } })
	]);

	if (lesson.error || !lesson.data) {
		error(
			lesson.response?.status ?? 500,
			problemMessage(lesson.error, 'That lesson could not be loaded.')
		);
	}
	if (quiz.error && quiz.response?.status !== 404) {
		error(
			quiz.response?.status ?? 500,
			problemMessage(quiz.error, 'That quiz could not be loaded.')
		);
	}

	return {
		slug: params.slug,
		lessonId: params.id,
		lessonTitle: lesson.data.lesson.title,
		quiz: quiz.data?.quiz ?? null,
		questions: quiz.data?.questions ?? []
	};
};

export const actions: Actions = {
	create: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'A quiz needs a title.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/lessons/{id}/quiz',
			{ params: { path: { id: params.id } }, body: { title } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That quiz could not be created.')
			});
		}
	},

	settings: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'A quiz needs a title.' });

		const timeLimit = wholeNumber(form.get('time_limit_seconds'), 0);
		const maxAttempts = wholeNumber(form.get('max_attempts'), 0);
		const passing = wholeNumber(form.get('passing_percent'), 0);

		if (Number.isNaN(timeLimit) || Number.isNaN(maxAttempts) || Number.isNaN(passing)) {
			return fail(400, { message: 'The limits must be whole numbers, zero or more.' });
		}
		if (passing > 100) {
			return fail(400, { message: 'The passing grade is a percentage.' });
		}

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/lessons/{id}/quiz',
			{
				params: { path: { id: params.id } },
				body: {
					title,
					description: String(form.get('description') ?? ''),
					time_limit_seconds: timeLimit,
					max_attempts: maxAttempts,
					passing_percent: passing
				}
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Those settings could not be saved.')
			});
		}
	},

	/**
	 * Append a question.
	 *
	 * Almost nothing is checked here. lms-api refuses a question nobody could
	 * answer correctly — single choice with no correct option or two, an ordering
	 * question with a "correct" item — and it is the only place that can, because
	 * it is the only place that grades. Restating those rules here would give an
	 * author two sources of truth about their own quiz.
	 */
	addQuestion: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const type: QuestionType = oneOf(TYPES, String(form.get('type') ?? ''), 'single_choice');

		const prompt = String(form.get('prompt') ?? '').trim();
		if (!prompt) return fail(400, { message: 'A question needs a prompt.' });

		const points = wholeNumber(form.get('points'), 1);
		if (Number.isNaN(points)) {
			return fail(400, { message: 'Points must be a whole number, zero or more.' });
		}

		const typed = type === 'short_answer' || type === 'fill_blanks';
		const chooses = type !== 'open_ended' && type !== 'range' && !typed;

		// A range's bounds ride in `accepted` as a single [low, high] pair.
		const range =
			type === 'range'
				? [
						[
							String(form.get('range_low') ?? '').trim(),
							String(form.get('range_high') ?? '').trim()
						]
					]
				: null;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/lessons/{id}/quiz/questions',
			{
				params: { path: { id: params.id } },
				body: {
					type,
					prompt,
					points,
					explanation: String(form.get('explanation') ?? '').trim(),
					case_sensitive: form.get('case_sensitive') === 'on',

					// Sent only for the types that read them. An `accepted` array on a
					// choice question is an answer nothing reads, and lms-api says so.
					...(typed ? { accepted: acceptedAnswers(String(form.get('accepted') ?? '')) } : {}),
					...(range ? { accepted: range } : {}),
					...(chooses ? { options: options(form) } : {})
				}
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That question could not be added.')
			});
		}
	},

	deleteQuestion: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const id = String(form.get('question_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/questions/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That question could not be removed.')
			});
		}
	},

	deleteQuiz: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/lessons/{id}/quiz',
			{ params: { path: { id: params.id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That quiz could not be removed.')
			});
		}

		redirect(303, `/teach/${params.slug}/lessons/${params.id}`);
	}
};
