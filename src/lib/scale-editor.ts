/**
 * The rules a grading scale has to satisfy, checked in the browser.
 *
 * The API is the authority — it refuses a bad scale whatever this file says — but
 * an author building one wants to know a band is duplicated before they press
 * Save, not after. This is the same rule set as `internal/grade`, said in the
 * place the author is typing.
 */

export interface DraftBand {
	label: string;
	min: number | '';
	isPass: boolean;
}

export interface ScaleProblem {
	/** The band the problem is about, or -1 for a whole-scale problem. */
	index: number;
	message: string;
}

/**
 * Bands, highest floor first — the order the API stores them and a reader reads
 * them. Sorting a copy: the editor keeps its rows in the order they were typed.
 */
export function sortedBands<T extends { min: number | '' }>(bands: T[]): T[] {
	return [...bands].sort((a, b) => Number(b.min || 0) - Number(a.min || 0));
}

/**
 * Why this scale cannot be saved yet, or an empty list when it can.
 *
 * Every reason `internal/grade` would refuse it: an empty label, a floor off the
 * 0–100 range, two bands sharing a floor, nothing covering zero, nothing that
 * passes. Refused here so the author fixes it in place rather than reading a 422.
 */
export function scaleProblems(name: string, bands: DraftBand[]): ScaleProblem[] {
	const problems: ScaleProblem[] = [];

	if (name.trim() === '') {
		problems.push({ index: -1, message: 'Give the scale a name.' });
	}
	if (bands.length === 0) {
		problems.push({ index: -1, message: 'A scale needs at least one band.' });
		return problems;
	}

	const floors = new Map<number, number>();
	let coversZero = false;
	let anyPass = false;

	bands.forEach((band, index) => {
		if (band.label.trim() === '') {
			problems.push({ index, message: 'This band needs a label.' });
		}
		if (band.min === '' || band.min < 0 || band.min > 100) {
			problems.push({ index, message: 'A floor is a number from 0 to 100.' });
		} else {
			// Two bands at one floor: the letter would depend on which the server
			// reached first, so the API refuses it and so does this.
			const seen = floors.get(band.min);
			if (seen !== undefined) {
				problems.push({ index, message: `Same floor as band ${seen + 1}.` });
			} else {
				floors.set(band.min, index);
			}
			if (band.min === 0) coversZero = true;
		}
		if (band.isPass) anyPass = true;
	});

	if (!coversZero) {
		problems.push({
			index: -1,
			message: 'One band must start at 0%, or a low score has no grade.'
		});
	}
	if (!anyPass) {
		problems.push({ index: -1, message: 'Mark at least one band as a pass.' });
	}

	return problems;
}

/** The whole-scale problems, for the summary above the form. */
export function generalProblems(problems: ScaleProblem[]): string[] {
	return problems.filter((p) => p.index === -1).map((p) => p.message);
}

/** The problem attached to one band, if any, for the message beside its row. */
export function problemFor(problems: ScaleProblem[], index: number): string | undefined {
	return problems.find((p) => p.index === index)?.message;
}
