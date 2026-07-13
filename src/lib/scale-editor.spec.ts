import { describe, expect, it } from 'vitest';
import {
	generalProblems,
	nameProblem,
	problemFor,
	scaleProblems,
	sortedBands,
	type DraftBand
} from './scale-editor';

const band = (label: string, min: number | '', isPass = false): DraftBand => ({
	label,
	min,
	isPass
});

const passFail = [band('Pass', 50, true), band('Fail', 0)];

describe('sortedBands', () => {
	it('orders by floor, highest first', () => {
		const sorted = sortedBands([band('C', 70), band('A', 90), band('F', 0)]);
		expect(sorted.map((b) => b.label)).toEqual(['A', 'C', 'F']);
	});

	it('does not mutate its input', () => {
		const bands = [band('C', 70), band('A', 90)];
		sortedBands(bands);
		expect(bands.map((b) => b.label)).toEqual(['C', 'A']);
	});

	// A band still being typed has an empty floor. It sorts as 0 rather than throwing.
	it('treats an unfilled floor as zero', () => {
		const sorted = sortedBands([band('', ''), band('A', 90)]);
		expect(sorted[0].label).toBe('A');
	});
});

describe('scaleProblems', () => {
	it('is happy with a valid scale', () => {
		expect(scaleProblems('Pass/fail', passFail)).toEqual([]);
	});

	// The name has a control of its own, so its problem sits under that control and
	// never in the whole-scale summary.
	it('wants a name, and pins the problem to the name field', () => {
		const problems = scaleProblems('  ', passFail);

		expect(nameProblem(problems)).toBe('Give the scale a name.');
		expect(generalProblems(problems)).not.toContain('Give the scale a name.');
	});

	it('wants at least one band', () => {
		expect(generalProblems(scaleProblems('Empty', []))).toContain(
			'A scale needs at least one band.'
		);
	});

	// A gap at the bottom leaves a low score with no grade at all.
	it('insists something covers zero', () => {
		const gap = [band('Pass', 50, true), band('Fail', 10)];
		expect(generalProblems(scaleProblems('Gap', gap))).toContain(
			'One band must start at 0%, or a low score has no grade.'
		);
	});

	// A scale nobody can pass is a scale somebody mistyped.
	it('insists something passes', () => {
		const cruel = [band('Fail', 0), band('Also fail', 50)];
		expect(generalProblems(scaleProblems('Cruel', cruel))).toContain(
			'Mark at least one band as a pass.'
		);
	});

	/*
		Two bands at one floor is the interesting one: the letter would depend on which
		row the server reached first, so the API refuses it. The problem is pinned to
		the second band, and names the first.
	*/
	it('rejects two bands sharing a floor, and points at the later one', () => {
		const clash = [band('Pass', 50, true), band('Merit', 50, true), band('Fail', 0)];
		const problems = scaleProblems('Ambiguous', clash);

		expect(problemFor(problems, 1)).toBe('Same floor as band 1.');
		expect(problemFor(problems, 0)).toBeUndefined();
	});

	it.each([
		[-1, 'A floor is a number from 0 to 100.'],
		[101, 'A floor is a number from 0 to 100.'],
		['', 'A floor is a number from 0 to 100.']
	])('rejects a floor of %s', (min, message) => {
		const bands = [band('Pass', min as number | '', true), band('Fail', 0)];
		expect(problemFor(scaleProblems('Bad', bands), 0)).toBe(message);
	});

	it('wants every band labelled', () => {
		const bands = [band('  ', 50, true), band('Fail', 0)];
		expect(problemFor(scaleProblems('Silent', bands), 0)).toBe('This band needs a label.');
	});
});
