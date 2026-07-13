/**
 * The rules a grading scale's *bands* have to satisfy, checked in the browser.
 *
 * They are rules about each other — no two floors alike, something covering zero —
 * which is why they are not a Zod schema; the name is one field, so it is one
 * (`scaleNameSchema`). The API is the authority either way: this is `internal/grade`,
 * said in the place the author is typing.
 */

export interface DraftBand {
	label: string;
	min: number | '';
	isPass: boolean;
}

export interface ScaleProblem {
	/** The band the problem is about, or `SCALE` for the whole scale. */
	index: number;
	message: string;
}

/** A problem about the whole scale — it has no one control to sit under. */
export const SCALE = -1;

/**
 * Bands, highest floor first — the order the API stores them and a reader reads
 * them. Sorting a copy: the editor keeps its rows in the order they were typed.
 */
export function sortedBands<T extends { min: number | '' }>(bands: T[]): T[] {
	return [...bands].sort((a, b) => Number(b.min || 0) - Number(a.min || 0));
}

/**
 * Why these bands cannot be saved yet, or an empty list when they can.
 *
 * Every reason `internal/grade` would refuse them: an empty label, a floor off the
 * 0–100 range, two bands sharing a floor, nothing covering zero, nothing that
 * passes. Refused here so the author fixes it in place rather than reading a 422.
 */
export function scaleProblems(bands: DraftBand[]): ScaleProblem[] {
	const problems: ScaleProblem[] = [];

	if (bands.length === 0) {
		problems.push({ index: SCALE, message: 'A scale needs at least one band.' });
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
			index: SCALE,
			message: 'One band must start at 0%, or a low score has no grade.'
		});
	}
	if (!anyPass) {
		problems.push({ index: SCALE, message: 'Mark at least one band as a pass.' });
	}

	return problems;
}

/** The whole-scale problems — the ones no single control can own. */
export function generalProblems(problems: ScaleProblem[]): string[] {
	return problems.filter((p) => p.index === SCALE).map((p) => p.message);
}

/** The problem attached to one band, if any, for the message beside its row. */
export function problemFor(problems: ScaleProblem[], index: number): string | undefined {
	return problems.find((p) => p.index === index)?.message;
}
