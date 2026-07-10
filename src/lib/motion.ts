import { browser } from '$app/environment';
import { fly as svelteFly, type FlyParams, type TransitionConfig } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

/**
 * Durations, in one place.
 *
 * Anything a person is waiting for is under 200ms; anything they are not is
 * under 300ms. Beyond that an animation stops being feedback and starts being a
 * thing to sit through.
 */
export const DURATION = {
	instant: 120,
	base: 180,
	slow: 260
} as const;

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

	return svelteFly(node, { y: -4, duration: DURATION.base, easing: cubicOut, ...params });
}
