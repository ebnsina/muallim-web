/** The brand hue, for a tinted thing that names no difficulty of its own. */
export const DEFAULT_HUE = 255;

/*
	A hue per difficulty — a ramp a reader can learn in one glance: a green
	beginner, a blue intermediate, an amber advanced, a rose expert. Colour that
	means something and is the same on every card, rather than a shade picked at
	random from the card's place in a list.

	A hue only — the card turns it into a wash with `oklch(L C hue)`, choosing L and
	C per theme, so the same difficulty is a soft tint in light mode and a muted one
	in the dark.
*/
const DIFFICULTY_HUE: Record<string, number> = {
	beginner: 150,
	intermediate: 255,
	advanced: 60,
	expert: 350
};

export function difficultyHue(difficulty: string): number {
	return DIFFICULTY_HUE[difficulty] ?? DEFAULT_HUE;
}
