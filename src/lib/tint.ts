const GOLDEN_ANGLE = 137.508;

/**
 * A hue, in degrees, for a decorative pastel tint.
 *
 * The four semantic tokens (accent, success, warning, danger) are too few for a
 * grid of cards — a page repeats them, and two of the four read as the same
 * blue. This gives a whole wheel instead: the golden angle steps successive
 * cards as far apart as a circle allows, so a colour never marches down a
 * column, and the title mixes in so the run is not identical on every page.
 *
 * A hue only — the card turns it into a wash with `oklch(L C hue)`, choosing L
 * and C per theme, so the same number is a soft tint in light mode and a muted
 * one in the dark. Deterministic, so the server and the browser never disagree
 * and paint two different colours across a hydration.
 */
export function courseHue(title: string, index = 0): number {
	let h = 0;
	for (let i = 0; i < title.length; i++) h = (Math.imul(h, 31) + title.charCodeAt(i)) | 0;
	return Math.round((index * GOLDEN_ANGLE + Math.abs(h)) % 360);
}
