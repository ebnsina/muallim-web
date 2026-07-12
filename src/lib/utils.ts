import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names, and lets a later one win over an earlier one of the same
 * kind — `cn('px-3', 'px-4')` is `px-4`, not both.
 *
 * That is the whole reason for tailwind-merge: a component sets its own padding,
 * a caller passes `class="px-6"`, and without this the two both land in the
 * attribute and the cascade decides by source order in a generated stylesheet,
 * which is to say arbitrarily.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Which of the five auroras a thing wears, from its own id.
 *
 * Stable by construction: the same slug picks the same light on the server and in
 * the browser, on every reload. `Math.random()` here would hand a card one colour
 * during the server render and another during hydration — a mismatch you can see.
 */
export function auroraFor(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
	return `aurora aurora-${(hash % 5) + 1}`;
}
