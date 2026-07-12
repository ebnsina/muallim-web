import { browser } from '$app/environment';
import { fly as svelteFly, type FlyParams, type TransitionConfig } from 'svelte/transition';
import { expoOut, quartInOut } from 'svelte/easing';

/**
 * Durations, in one place.
 *
 * Anything a person is waiting for is under 200ms; anything they are not is
 * under 300ms. Beyond that an animation stops being feedback and starts being a
 * thing to sit through.
 *
 * `press` is the one a finger feels rather than the eye watches — it has to land
 * inside the ~150ms a tap reads as instant, or the button feels like it argued.
 */
export const DURATION = {
	press: 140,
	instant: 120,
	base: 180,
	slow: 260,

	/* The only one over 300ms, and it is not UI: the marketing scroll reveal is
	   explanatory, seen once, and nobody is waiting behind it. */
	reveal: 600
} as const;

/** What each duration is for. The `/ui` gallery reads this rather than restating it. */
export const DURATION_USE: Record<keyof typeof DURATION, string> = {
	press: 'a button, a checkbox — the frame a finger feels',
	instant: 'a tooltip, a tick, a toast leaving',
	base: 'a dropdown, a card lifting, a toast arriving, a reorder settling',
	slow: 'a progress bar filling, a ring settling',
	reveal: 'the marketing scroll reveal — explanatory, not UI'
};

/**
 * The curves, for the places that need a string rather than a class: an inline
 * `style`, a WAAPI call, a Svelte transition's `css`.
 *
 * Identical to the `--ease-*` tokens `layout.css` hands Tailwind, and there is
 * exactly one reason they are written twice: a `.svelte` file cannot read a CSS
 * custom property at build time. If you change one, change the other.
 */
export const EASE = {
	out: 'cubic-bezier(0.23, 1, 0.32, 1)',
	inOut: 'cubic-bezier(0.77, 0, 0.175, 1)'
} as const;

export type EaseName = keyof typeof EASE;

/** What each curve is for, and the token that carries it. Read by the `/ui` gallery. */
export const EASE_USE: Record<EaseName, { token: string; use: string }> = {
	out: { token: '--ease-out', use: 'anything entering, exiting, or being pressed — the default' },
	inOut: { token: '--ease-in-out', use: 'something already on screen moving — a row reordering' }
};

/**
 * Tailwind's stock `ease-out`, kept only so the gallery can show what was replaced.
 * It decelerates politely and lands soft, which is why stock Tailwind motion reads
 * as nothing in particular. Do not use it.
 */
export const EASE_STOCK_OUT = 'cubic-bezier(0, 0, 0.2, 1)';

/**
 * The easing for Svelte's own transitions, which take a function and not a curve.
 *
 * `expoOut` and not `cubicOut`: cubic decelerates politely and lands soft, which
 * is the same complaint as the built-in CSS easings. Exponential leaves hard and
 * settles, and that is what reads as an element that *arrived*.
 */
export const easeOut = expoOut;

/**
 * The curve for something already on screen changing places — a reordered row, a
 * card flipping to a new slot.
 *
 * Movement is not an entrance, and it does not want `easeOut`. An exponential
 * curve covers most of its travel in the first few frames, so a dropped row shoots
 * across and then hangs at the end, which reads as a stutter rather than a settle.
 * Accelerating out and decelerating in is how a thing that was already moving
 * behaves. Matches `EASE.inOut` / `--ease-in-out`.
 */
export const easeInOut = quartInOut;

/**
 * Whether the person has asked for less motion.
 *
 * The global stylesheet already collapses CSS animation durations under
 * `prefers-reduced-motion`, and Svelte's built-in transitions compile to CSS
 * animations — so they are already covered. This exists for the transitions that
 * are *not* CSS: anything driven by a `tick` callback, and any code that decides
 * whether to animate at all.
 *
 * Read at call time rather than cached: a person can change the setting while the
 * page is open, and a cached answer would keep animating at them.
 */
export function prefersReducedMotion(): boolean {
	return browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A short rise, for something appearing where nothing was — a validation message,
 * a saved notice.
 *
 * Four pixels. An element that travels further than it is tall reads as arriving
 * from somewhere, and a form error does not arrive from anywhere.
 */
export function rise(node: Element, params: FlyParams = {}): TransitionConfig {
	if (prefersReducedMotion()) return { duration: 0 };

	return svelteFly(node, { y: -4, duration: DURATION.base, easing: easeOut, ...params });
}

/**
 * A menu opening off the control that owns it.
 *
 * Scale, not `slide`. Sliding a panel open animates its `height`, which is layout:
 * it re-runs layout, paint and composite every frame, and it is the wrong *shape*
 * of motion anyway — a floating menu is not unrolling, it is opening. It also
 * quietly wastes whatever `transform-origin` the element declares, because a
 * height animation has no origin to honour.
 *
 * This animates the standalone `scale` property, which *does* honour
 * `transform-origin` — so a panel classed `origin-top-right` grows out of the
 * button at its top right, rather than swelling from its own middle like something
 * that arrived from nowhere. Set the origin on the element to match its trigger.
 *
 * Reduced motion keeps the fade and drops the scale: the menu still announces
 * itself, it simply does not move.
 */
export function popover(node: Element, { duration = DURATION.base } = {}): TransitionConfig {
	if (prefersReducedMotion()) {
		return { duration: DURATION.instant, css: (t) => `opacity: ${t};` };
	}

	return {
		duration,
		easing: easeOut,
		// 0.95 → 1. Never from zero; a menu that grows from nothing came from nowhere.
		css: (t) => `opacity: ${t}; scale: ${0.95 + 0.05 * t};`
	};
}

/**
 * One word swapping for another in the same place.
 *
 * A plain cross-fade between two overlapping labels does not read as one word
 * becoming another — it reads as what it literally is, two words on top of each
 * other, both half-transparent, for a third of a second. The eye resolves the
 * overlap and the trick dies.
 *
 * Blur is what bridges them. A word that is leaving goes soft as it goes, so
 * there is no second sharp thing to read against the first, and the pair collapse
 * into a single object changing rather than two objects swapping. Six pixels, and
 * it never exceeds that: heavy blur is expensive to composite, Safari especially.
 *
 * Not for a swap the reader has to *read* — a status changing, a total updating.
 * Blurring a number is hiding it. This is for a word that is decoration.
 */
export function morph(
	node: Element,
	{ duration = DURATION.slow }: { duration?: number } = {}
): TransitionConfig {
	if (prefersReducedMotion()) return { duration: 0 };

	return {
		duration,
		easing: easeOut,
		// `u` runs 0→1 as the element leaves and 1→0 as it arrives, so the blur and the
		// drift are strongest at the far end of both and zero at rest.
		css: (t, u) => `opacity: ${t}; filter: blur(${u * 6}px); translate: 0 ${u * 4}px;`
	};
}
