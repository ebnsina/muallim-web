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
