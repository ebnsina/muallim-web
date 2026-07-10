import type { Action } from 'svelte/action';
import { prefersReducedMotion } from '$lib/motion';

interface Options {
	/** Milliseconds to stagger this element behind the one before it. */
	delay?: number;
	/** How much of the element must be showing. */
	threshold?: number;
}

/**
 * Reveals an element as it scrolls into view: it rises a few pixels and fades in,
 * once, and then it is a normal element again.
 *
 * The hidden state is applied *by this action*, not by a class in the markup.
 * That is the whole trick: with JavaScript off, or before hydration, nothing has
 * added `reveal` and the content is simply visible. A page that starts at
 * `opacity: 0` in the HTML is a page that stays blank for anyone whose script
 * failed to load, and search engines are the least of who that hurts.
 *
 * The observer disconnects on the first intersection. An element that re-hides
 * when scrolled past is an element that flickers on the way back up.
 */
export const inview: Action<HTMLElement, Options | undefined> = (node, options = {}) => {
	// Someone who asked for less motion gets the content, immediately, with none of
	// this. Not a shorter animation — none.
	if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
		return;
	}

	node.classList.add('reveal');
	node.style.transitionDelay = `${options.delay ?? 0}ms`;

	const observer = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;

			node.classList.add('reveal-in');
			observer.disconnect();
		},
		{ threshold: options.threshold ?? 0.15, rootMargin: '0px 0px -8% 0px' }
	);

	observer.observe(node);

	return { destroy: () => observer.disconnect() };
};
