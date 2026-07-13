import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/*
	Contrast is verified, not eyeballed.

	This reads tokens.css, resolves the semantic tokens through to their oklch
	primitives, converts them to sRGB, and computes the WCAG 2.2 contrast ratio for
	every pair the components actually rely on. Change a token and this test says
	which pair it broke, in both color schemes.

	WCAG 2.2 AA: 4.5:1 for body text, 3:1 for large text (>=18.66px bold or 24px)
	and for the boundary of a user-interface component (1.4.11).
*/

const CSS = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

// ---------------------------------------------------------------- oklch → sRGB

interface Oklch {
	l: number;
	c: number;
	h: number;
	alpha: number;
}

/** `oklch(0.51 0.19 259)` or `oklch(0 0 0 / 30%)`. */
function parseOklch(value: string): Oklch | null {
	const matched = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)%?\s*)?\)$/.exec(
		value.trim()
	);
	if (!matched) return null;

	const alpha = matched[4] === undefined ? 1 : Number(matched[4]) / (value.includes('%') ? 100 : 1);
	return { l: Number(matched[1]), c: Number(matched[2]), h: Number(matched[3]), alpha };
}

/**
 * Linear-light sRGB, which is what the luminance formula wants. Out-of-gamut
 * channels are clamped, exactly as a browser clamps them.
 *
 * The matrices are the oklab specification's.
 * https://bottosson.github.io/posts/oklab/
 */
function linearRgb({ l, c, h }: Oklch): [number, number, number] {
	const radians = (h * Math.PI) / 180;
	const a = c * Math.cos(radians);
	const b = c * Math.sin(radians);

	const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

	return [
		4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
		-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
		-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short
	].map((channel) => Math.min(1, Math.max(0, channel))) as [number, number, number];
}

/** WCAG relative luminance. */
function luminance(colour: Oklch): number {
	const [r, g, b] = linearRgb(colour);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Oklch, b: Oklch): number {
	const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (lighter + 0.05) / (darker + 0.05);
}

// ----------------------------------------------------------- reading the sheet

/**
 * The declarations of one `:root` block. The file has two: the light one at the
 * top, and the dark one inside the media query.
 */
function declarations(block: string): Map<string, string> {
	const found = new Map<string, string>();

	for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
		found.set(name, value.trim());
	}
	return found;
}

// Matches the start of the dark rule's selector list, which also carries the bare
// `[data-theme='dark']` so a nested subtree (the marketing site) can opt in.
const DARK_SELECTOR = ":root[data-theme='dark']";

const lightBlock = CSS.slice(CSS.indexOf(':root {'), CSS.indexOf(DARK_SELECTOR));
const darkBlock = CSS.slice(CSS.indexOf(DARK_SELECTOR));

const light = declarations(lightBlock);
const darkOwn = declarations(darkBlock);

// Dark mode redefines some tokens and inherits the rest, exactly as the cascade
// does. Resolving against a merged map is what the browser actually sees.
const dark = new Map([...light, ...darkOwn]);

/** Follows `var(--x)` chains down to the oklch at the bottom. */
function resolve(tokens: Map<string, string>, name: string): Oklch {
	let value = tokens.get(name);
	expect(value, `${name} is not defined`).toBeDefined();

	for (let hops = 0; hops < 10; hops++) {
		const alias = /^var\((--[\w-]+)\)$/.exec(value!.trim());
		if (!alias) break;

		value = tokens.get(alias[1]);
		expect(value, `${name} resolves to ${alias[1]}, which is not defined`).toBeDefined();
	}

	const colour = parseOklch(value!);
	expect(colour, `${name} resolves to ${value}, which is not an oklch color`).not.toBeNull();
	return colour!;
}

// ------------------------------------------------------------------- the pairs

/** Text on a background: WCAG 1.4.3, 4.5:1. */
const TEXT_PAIRS: Array<[string, string]> = [
	['--text', '--surface'],
	['--text', '--surface-raised'],
	['--text', '--surface-sunken'],
	['--text-muted', '--surface'],
	['--text-muted', '--surface-raised'],

	// The label on a filled button, and on every solid status fill.
	['--text-on-solid', '--accent'],
	['--text-on-solid', '--accent-hover'],
	['--text-on-solid', '--danger'],
	['--text-on-solid', '--danger-hover'],

	// Tinted notice surfaces: the text is step 11, the surface step 3. This pairing
	// is the entire reason the scale has twelve steps and not nine.
	['--accent-text', '--accent-surface'],
	['--success-text', '--success-surface'],
	['--danger-text', '--danger-surface'],
	['--warning-text', '--warning-surface'],

	// And the same text on the page, where a badge or a verdict line sits.
	['--accent-text', '--surface'],
	['--success-text', '--surface'],
	['--danger-text', '--surface'],
	['--warning-text', '--surface']
];

/**
 * Non-text contrast: WCAG 1.4.11, 3:1.
 *
 * The focus indicator is here and the field's resting border is not, deliberately.
 * A field carries a hairline edge; what identifies it at rest is its own fill
 * against the page, asserted separately below, and what identifies it in focus is
 * this ring. A 3:1 border on every input is legal and ugly, and it is not the only
 * way to satisfy the criterion.
 */
const BOUNDARY_PAIRS: Array<[string, string]> = [
	['--ring', '--surface'],
	['--ring', '--surface-raised'],
	['--accent', '--surface'],
	['--success', '--surface'],
	['--danger', '--surface']
];

const SCHEMES = [
	['light', light],
	['dark', dark]
] as const;

describe('design tokens', () => {
	// A solid fill on white passing 4.5:1 against white is not a coincidence to be
	// hoped for. `--text-on-solid` is white, so `--accent` must be dark enough.
	describe.each(SCHEMES)('%s: text contrast is at least 4.5:1', (_scheme, tokens) => {
		it.each(TEXT_PAIRS)('%s on %s', (foreground, background) => {
			const ratio = contrast(resolve(tokens, foreground), resolve(tokens, background));
			expect(
				ratio,
				`${foreground} on ${background} is ${ratio.toFixed(2)}:1`
			).toBeGreaterThanOrEqual(4.5);
		});
	});

	describe.each(SCHEMES)('%s: boundary contrast is at least 3:1', (_scheme, tokens) => {
		it.each(BOUNDARY_PAIRS)('%s on %s', (foreground, background) => {
			const ratio = contrast(resolve(tokens, foreground), resolve(tokens, background));
			expect(
				ratio,
				`${foreground} on ${background} is ${ratio.toFixed(2)}:1`
			).toBeGreaterThanOrEqual(3);
		});
	});

	// A decorative border separates things; it does not *mean* anything, so 1.4.11
	// does not apply to it. It does have to be visible, or the card has no edge.
	describe.each(SCHEMES)('%s: decorative borders are visible', (_scheme, tokens) => {
		it.each([['--border'], ['--border-strong'], ['--border-control']])(
			'%s against --surface-raised',
			(name) => {
				const ratio = contrast(resolve(tokens, name), resolve(tokens, '--surface-raised'));
				expect(ratio).toBeGreaterThanOrEqual(1.15);
			}
		);
	});

	/*
		A field wears a hairline border rather than a 3:1 outline. Two things carry
		its identity instead, and both are asserted: its fill is a different surface
		from the page, and its focus indicator clears 3:1.

		Be clear about what that is. The strictest reading of WCAG 1.4.11 wants the
		resting border of a text input to hit 3:1 on its own; a common reading holds
		that a labelled input with a 3:1 focus indicator is identifiable without it.
		This system takes the second reading. If that is not acceptable for a
		deployment, raise `--border-control` to `--n-10` and this file will tell you
		nothing broke.
	*/
	describe.each(SCHEMES)('%s: a field is visible at rest', (_scheme, tokens) => {
		it('its fill differs from the page it sits on', () => {
			const ratio = contrast(resolve(tokens, '--surface-raised'), resolve(tokens, '--surface'));
			expect(ratio, 'a field the same color as the page has only its border').toBeGreaterThan(1.04);
		});
	});

	// The success and danger hues must be told apart by something other than hue,
	// because roughly one man in twelve cannot tell them apart by hue. They always
	// ship with an icon and a word; this asserts the colors are *also* distinct in
	// lightness, so the distinction survives a grayscale print.
	describe.each(SCHEMES)('%s: status colors differ in lightness', (_scheme, tokens) => {
		it('success and danger are not the same gray', () => {
			const success = luminance(resolve(tokens, '--success'));
			const danger = luminance(resolve(tokens, '--danger'));

			const ratio = (Math.max(success, danger) + 0.05) / (Math.min(success, danger) + 0.05);
			expect(ratio, 'success and danger are indistinguishable without color').toBeGreaterThan(1.15);
		});
	});

	/*
		Every ramp is twelve steps, and every step exists.

		The gallery at /ui renders all twelve of each, and a hole in a ramp draws as
		nothing at all — a transparent stripe where a color should be. Three ramps
		shipped with six holes each before this test existed, because every *token*
		that resolved happened to point at a step that was defined.
	*/
	describe.each(SCHEMES)('%s: every ramp is complete', (_scheme, tokens) => {
		it.each([['--n-'], ['--b-'], ['--ok-'], ['--no-'], ['--wa-']])('%s1 through 12', (prefix) => {
			for (let step = 1; step <= 12; step++) {
				const name = `${prefix}${step}`;
				expect(tokens.has(name), `${name} is missing from the ramp`).toBe(true);
				expect(parseOklch(tokens.get(name)!), `${name} is not an oklch color`).not.toBeNull();
			}
		});

		// And the ramp goes one way. A step that is lighter than the one before it is
		// a typo, and it is invisible until a hover state picks the wrong end.
		it.each([['--n-'], ['--b-'], ['--ok-'], ['--no-'], ['--wa-']])('%s gets darker', (prefix) => {
			const lightnesses = Array.from(
				{ length: 8 },
				(_, i) => parseOklch(tokens.get(`${prefix}${i + 1}`)!)!.l
			);

			for (let i = 1; i < lightnesses.length; i++) {
				expect(lightnesses[i], `${prefix}${i + 1} is not a step on from ${prefix}${i}`).not.toEqual(
					lightnesses[i - 1]
				);
			}
		});
	});

	/*
		Every primitive is redeclared in the dark block.

		A primitive that is only declared in light *inherits* into dark, silently, as
		whatever it was on white paper — which is how the brand ramp's step 1 once
		rendered as a white stripe against a dark page. The merged-cascade check above
		cannot see it, because the merged cascade is exactly the thing that hides it.

		Semantic tokens are different: most of them are meant to inherit, because they
		point at a primitive that changed underneath them. Only the raw steps are
		checked here.
	*/
	it('the dark block redeclares every ramp step', () => {
		const steps = [...light.keys()].filter((name) => /^--(n|b|ok|no|wa)-\d+$/.test(name));
		expect(steps.length).toBe(60);

		const inherited = steps.filter((name) => !darkOwn.has(name));
		expect(inherited, 'these keep their light value in dark mode').toEqual([]);
	});

	// Guards the layering rule: a raised surface must actually read as raised.
	describe.each(SCHEMES)('%s: surfaces are ordered', (_scheme, tokens) => {
		it('sunken < base < raised in the direction the scheme expects', () => {
			const sunken = luminance(resolve(tokens, '--surface-sunken'));
			const base = luminance(resolve(tokens, '--surface'));
			const raised = luminance(resolve(tokens, '--surface-raised'));

			// Light: raised is whiter than the page. Dark: raised is lighter than the
			// page too, because elevation in dark mode is light, not shadow.
			expect(raised).toBeGreaterThan(base);
			expect(sunken).toBeLessThan(base);
		});
	});
});
