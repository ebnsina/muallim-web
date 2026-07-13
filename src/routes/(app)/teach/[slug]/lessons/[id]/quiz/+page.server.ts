import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { aiEnabled } from '$lib/server/ai';
import { authedApi } from '$lib/server/api';
import { questionSchema, quizSettingsSchema, quizTitleSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
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
	'range',
	'image_answering',
	'image_matching'
] as const;

type QuestionType = (typeof TYPES)[number];

/** Narrows a submitted enum rather than asserting it: a form field is user input. */
function oneOf<T extends string>(allowed: readonly T[], value: string, fallback: T): T {
	return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
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

	const category = url.searchParams.get('bank') ?? '';

	// The lesson, the quiz (which may not exist yet — a 404 means "no quiz"), and
	// the reusable question bank to add from.
	const [lesson, quiz, bank] = await Promise.all([
		api.GET('/v1/lessons/{id}/content', { params: { path: { id: params.id } } }),
		api.GET('/v1/lessons/{id}/quiz/authoring', { params: { path: { id: params.id } } }),
		api.GET('/v1/quiz-bank', { params: { query: { category: category || undefined, limit: 50 } } })
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
		lessonContent: lesson.data.lesson.content ?? '',
		aiEnabled: aiEnabled(),
		quiz: quiz.data?.quiz ?? null,
		questions: quiz.data?.questions ?? [],
		bank: bank.data?.questions ?? [],
		bankCategories: bank.data?.categories ?? [],
		bankFilter: category
	};
};

export const actions: Actions = {
	create: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const parsed = parseForm(quizTitleSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'create', errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/lessons/{id}/quiz',
			{ params: { path: { id: params.id } }, body: { title: parsed.value.title } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That quiz could not be created.')
			});
		}
	},

	settings: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		// One refusal per box: "the limits must be whole numbers" named three inputs at
		// once, so it could not sit under any of them.
		const parsed = parseForm(quizSettingsSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'settings', errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/lessons/{id}/quiz',
			{ params: { path: { id: params.id } }, body: parsed.value }
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
	 * Almost nothing is checked here. muallim-api refuses a question nobody could
	 * answer correctly — single choice with no correct option or two, an ordering
	 * question with a "correct" item — and it is the only place that can, because
	 * it is the only place that grades. Restating those rules here would give an
	 * author two sources of truth about their own quiz.
	 */
	addQuestion: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const type: QuestionType = oneOf(TYPES, String(form.get('type') ?? ''), 'single_choice');

		const parsed = parseForm(questionSchema, form);
		if (!parsed.ok) return fail(400, { scope: 'question', errors: parsed.errors });

		const { prompt, points, explanation } = parsed.value;

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
					explanation,
					case_sensitive: form.get('case_sensitive') === 'on',

					// Sent only for the types that read them. An `accepted` array on a
					// choice question is an answer nothing reads, and muallim-api says so.
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

	/**
	 * Add a batch of AI-generated questions. Each is mapped to the same body a hand
	 * authored one would send and POSTed individually, so muallim-api's validator — the
	 * one a human submission hits — refuses a malformed question rather than trusting
	 * the model. Returns how many landed and how many were rejected.
	 */
	addFromAi: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		let items: unknown;
		try {
			items = JSON.parse(String((await request.formData()).get('questions') ?? '[]'));
		} catch {
			return fail(400, { message: 'The generated questions could not be read.' });
		}
		if (!Array.isArray(items) || items.length === 0) {
			return fail(400, { message: 'No questions to add.' });
		}

		const api = authedApi(url.origin, locals.accessToken);
		const CHOICE = new Set(['single_choice', 'multiple_choice', 'true_false']);
		let added = 0;
		let rejected = 0;

		for (const raw of items as Array<Record<string, unknown>>) {
			const type = String(raw.type ?? '');
			const prompt = String(raw.prompt ?? '').trim();
			if (!prompt || !TYPES.includes(type as QuestionType)) {
				rejected++;
				continue;
			}
			const points = Number.isInteger(raw.points) ? (raw.points as number) : 1;
			const body: Record<string, unknown> = {
				type,
				prompt,
				points,
				explanation: '',
				case_sensitive: false
			};

			if (CHOICE.has(type)) {
				const opts = Array.isArray(raw.options) ? raw.options : [];
				body.options = opts
					.map((o) => {
						const opt = (o ?? {}) as Record<string, unknown>;
						return {
							content: String(opt.content ?? '').trim(),
							is_correct: Boolean(opt.correct),
							match_content: ''
						};
					})
					.filter((o) => o.content !== '');
			} else if (type === 'short_answer') {
				const answers = Array.isArray(raw.answers) ? raw.answers : [];
				body.accepted = [answers.map((a) => String(a).trim()).filter(Boolean)];
			} else {
				rejected++;
				continue;
			}

			const { error: problem } = await api.POST('/v1/lessons/{id}/quiz/questions', {
				params: { path: { id: params.id } },
				body: body as never
			});
			if (problem) rejected++;
			else added++;
		}

		return { aiAdded: added, aiRejected: rejected };
	},

	saveToBank: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const id = String(form.get('question_id') ?? '');
		const category = String(form.get('category') ?? '').trim();

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/questions/{id}/save-to-bank',
			{ params: { path: { id } }, body: { category } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That question could not be saved to the bank.')
			});
		}
		return { savedToBank: true };
	},

	addFromBank: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const bankQuestionId = String((await request.formData()).get('bank_question_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/lessons/{id}/quiz/questions/from-bank',
			{ params: { path: { id: params.id } }, body: { bank_question_id: bankQuestionId } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That question could not be added from the bank.')
			});
		}
	},

	deleteBankQuestion: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const id = String((await request.formData()).get('bank_question_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/quiz-bank/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That bank question could not be removed.')
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
