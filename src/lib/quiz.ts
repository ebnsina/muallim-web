/**
 * The one shape lms-api accepts for an answer, whatever the question type.
 *
 * Exactly one field is meaningful per type. Sending the wrong one is not an
 * error: it is a wrong answer, which is also what sending nothing is.
 */
export interface QuizResponse {
	choices?: string[];
	text?: string;
	blanks?: string[];
	order?: string[];
	pairs?: Record<string, string>;
	number?: number;
}

export interface Answer {
	questionId: string;
	response: QuizResponse;
}

/**
 * Field names carry the question they belong to, because a quiz is one form and
 * a browser gives us a flat list of names.
 *
 *   q:<id>:type              the question's type, so this can read the rest
 *   q:<id>:choice            true_false, single_choice
 *   q:<id>:choices           multiple_choice (repeated)
 *   q:<id>:text              short_answer, open_ended
 *   q:<id>:blank:<n>         fill_blanks
 *   q:<id>:rank:<optionId>   ordering
 *   q:<id>:pair:<optionId>   matching
 */
const TYPE = /^q:([^:]+):type$/;

/**
 * Reads every question's answer out of a submitted quiz form.
 *
 * Driven by the `type` fields rather than by scanning for answers, so a question
 * the learner left entirely alone still produces an entry — an unanswered
 * question is graded, not skipped, and one that vanished from the payload would
 * quietly keep whatever was saved for it on a previous pass.
 *
 * Nothing here trusts the form to be well formed. It is user input: an ordering
 * question whose ranks are missing yields an empty order, which is wrong rather
 * than an exception.
 */
export function readResponse(form: FormData): Answer[] {
	const answers: Answer[] = [];

	for (const [field, value] of form.entries()) {
		const matched = TYPE.exec(field);
		if (!matched) continue;

		const questionId = matched[1];
		answers.push({ questionId, response: answerFor(form, questionId, String(value)) });
	}

	return answers;
}

function answerFor(form: FormData, id: string, type: string): QuizResponse {
	switch (type) {
		case 'true_false':
		case 'single_choice':
		case 'image_answering': {
			const choice = form.get(`q:${id}:choice`);
			return choice ? { choices: [String(choice)] } : {};
		}

		case 'multiple_choice':
			return { choices: form.getAll(`q:${id}:choices`).map(String) };

		case 'short_answer':
		case 'open_ended':
			return { text: String(form.get(`q:${id}:text`) ?? '') };

		case 'fill_blanks':
			return { blanks: indexed(form, `q:${id}:blank:`) };

		case 'ordering':
			return { order: ordered(form, `q:${id}:rank:`) };

		case 'matching':
		case 'image_matching':
			return { pairs: paired(form, `q:${id}:pair:`) };

		case 'range': {
			// A blank or non-numeric answer is unanswered, not zero.
			const raw = String(form.get(`q:${id}:number`) ?? '').trim();
			const n = Number(raw);
			return raw !== '' && Number.isFinite(n) ? { number: n } : {};
		}

		default:
			// A type this build cannot render. Sending nothing is the honest answer;
			// the server grades it as unanswered rather than trusting a guess.
			return {};
	}
}

/** The blanks, in the order the prompt has them. */
function indexed(form: FormData, prefix: string): string[] {
	const blanks: Array<{ at: number; value: string }> = [];

	for (const [field, value] of form.entries()) {
		if (!field.startsWith(prefix)) continue;
		blanks.push({ at: Number(field.slice(prefix.length)), value: String(value) });
	}

	return blanks.sort((a, b) => a.at - b.at).map((b) => b.value);
}

/**
 * The option ids, in the order the learner ranked them.
 *
 * A rank nobody filled in, or one that is not a number, drops the option out of
 * the sequence — leaving it short, which the server grades as wrong. It does not
 * silently place it first, which a `Number('') === 0` would have done.
 */
function ordered(form: FormData, prefix: string): string[] {
	const ranked: Array<{ rank: number; id: string }> = [];

	for (const [field, value] of form.entries()) {
		if (!field.startsWith(prefix)) continue;

		const rank = Number(String(value));
		if (String(value).trim() === '' || !Number.isFinite(rank)) continue;

		ranked.push({ rank, id: field.slice(prefix.length) });
	}

	return ranked.sort((a, b) => a.rank - b.rank).map((r) => r.id);
}

/** Each option id against the match the learner put beside it. */
function paired(form: FormData, prefix: string): Record<string, string> {
	const pairs: Record<string, string> = {};

	for (const [field, value] of form.entries()) {
		if (!field.startsWith(prefix)) continue;
		if (String(value) === '') continue;

		pairs[field.slice(prefix.length)] = String(value);
	}

	return pairs;
}
