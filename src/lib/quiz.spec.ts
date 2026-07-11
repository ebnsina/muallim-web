import { describe, expect, it } from 'vitest';
import { readResponse } from './quiz';

/** A form the browser might send. */
function form(fields: Array<[string, string]>): FormData {
	const data = new FormData();
	for (const [name, value] of fields) data.append(name, value);
	return data;
}

describe('readResponse', () => {
	it('reads one answer per question, in the shape the API wants', () => {
		const answers = readResponse(
			form([
				['q:a:type', 'single_choice'],
				['q:a:choice', 'opt-1'],
				['q:b:type', 'multiple_choice'],
				['q:b:choices', 'opt-2'],
				['q:b:choices', 'opt-3'],
				['q:c:type', 'short_answer'],
				['q:c:text', ' Paris '],
				['q:d:type', 'open_ended'],
				['q:d:text', 'An essay.']
			])
		);

		expect(answers).toEqual([
			{ questionId: 'a', response: { choices: ['opt-1'] } },
			{ questionId: 'b', response: { choices: ['opt-2', 'opt-3'] } },
			{ questionId: 'c', response: { text: ' Paris ' } },
			{ questionId: 'd', response: { text: 'An essay.' } }
		]);
	});

	it('reads a range answer as a number, and a blank or non-numeric one as unanswered', () => {
		const answers = readResponse(
			form([
				['q:a:type', 'range'],
				['q:a:number', '100.5'],
				['q:b:type', 'range'],
				['q:b:number', '  '],
				['q:c:type', 'range'],
				['q:c:number', 'twelve']
			])
		);

		expect(answers).toEqual([
			{ questionId: 'a', response: { number: 100.5 } },
			{ questionId: 'b', response: {} },
			{ questionId: 'c', response: {} }
		]);
	});

	// A question left entirely alone still produces an entry. It is graded, not
	// skipped, and omitting it would keep whatever an earlier save had stored.
	it('sends an empty answer for a question nobody touched', () => {
		const answers = readResponse(
			form([
				['q:a:type', 'single_choice'],
				['q:b:type', 'multiple_choice']
			])
		);

		expect(answers).toEqual([
			{ questionId: 'a', response: {} },
			{ questionId: 'b', response: { choices: [] } }
		]);
	});

	it('puts the blanks in the order the prompt has them', () => {
		// Deliberately out of order, and past nine, where a string sort would fail.
		const answers = readResponse(
			form([
				['q:a:type', 'fill_blanks'],
				['q:a:blank:10', 'eleventh'],
				['q:a:blank:1', 'second'],
				['q:a:blank:0', 'first'],
				['q:a:blank:2', 'third']
			])
		);

		expect(answers[0].response.blanks).toEqual(['first', 'second', 'third', 'eleventh']);
	});

	it('orders the options by the rank the learner gave them', () => {
		const answers = readResponse(
			form([
				['q:a:type', 'ordering'],
				['q:a:rank:opt-x', '3'],
				['q:a:rank:opt-y', '1'],
				['q:a:rank:opt-z', '2']
			])
		);

		expect(answers[0].response.order).toEqual(['opt-y', 'opt-z', 'opt-x']);
	});

	// The bug this guards: `Number('')` is 0, so an unranked option would sort to
	// the front and claim first place. Dropping it leaves the sequence short, which
	// the server grades as wrong — which is what it is.
	it('drops an option the learner never ranked rather than placing it first', () => {
		const answers = readResponse(
			form([
				['q:a:type', 'ordering'],
				['q:a:rank:opt-x', ''],
				['q:a:rank:opt-y', '2'],
				['q:a:rank:opt-z', '1']
			])
		);

		expect(answers[0].response.order).toEqual(['opt-z', 'opt-y']);
	});

	it('pairs each option with the match beside it, and ignores the empty ones', () => {
		const answers = readResponse(
			form([
				['q:a:type', 'matching'],
				['q:a:pair:opt-1', 'match-b'],
				['q:a:pair:opt-2', ''],
				['q:a:pair:opt-3', 'match-a']
			])
		);

		expect(answers[0].response.pairs).toEqual({ 'opt-1': 'match-b', 'opt-3': 'match-a' });
	});

	// A type this build cannot draw. Sending nothing is honest; guessing is not.
	it('says nothing about a question type it does not know', () => {
		const answers = readResponse(
			form([
				['q:a:type', 'draw_image'],
				['q:a:text', 'a scribble']
			])
		);

		expect(answers).toEqual([{ questionId: 'a', response: {} }]);
	});

	// Field names are namespaced by question. One question's answer must never be
	// read as another's, and a stray field belongs to nobody.
	it('ignores fields that are not a question', () => {
		const answers = readResponse(
			form([
				['intent', 'submit'],
				['q:a:type', 'short_answer'],
				['q:a:text', 'mine'],
				['csrf', 'x']
			])
		);

		expect(answers).toEqual([{ questionId: 'a', response: { text: 'mine' } }]);
	});
});
