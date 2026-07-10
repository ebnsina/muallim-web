import type { BadgeTone } from '$lib/components';

/** As much of a mark as a page needs. */
export interface Entry {
	item_id: string;
	points: number;
	max_points: number;
}

export interface Band {
	label: string;
	is_pass: boolean;
}

/**
 * The mark against an item, or undefined when there is none.
 *
 * A map, not a `find` per row. A gradebook is learners × items, and a linear scan
 * inside both loops is the client-side twin of the N+1 the API refuses to make.
 */
export function marksByItem(entries: Entry[]): Map<string, Entry> {
	const marks = new Map<string, Entry>();
	for (const entry of entries) marks.set(entry.item_id, entry);
	return marks;
}

/**
 * One mark as a whole percentage, rounded half up.
 *
 * The same arithmetic the API does for the course total. A row that rounded down
 * while the total rounded half up would show 8 of 9 as 88% beside a total of 89%,
 * and somebody would open a ticket about it.
 */
export function percentOf(entry: Entry): number {
	if (entry.max_points <= 0) return 0;
	return Math.round((entry.points / entry.max_points) * 100);
}

/**
 * What colour a band is.
 *
 * From `is_pass`, which the scale's author set — never from the label. "D" passes
 * on the default scale and "Merit" does not exist on it, and a component that
 * matched on letters would be wrong for every workspace that grades its own way.
 */
export function bandTone(band: Band | undefined | null): BadgeTone {
	if (!band) return 'neutral';
	return band.is_pass ? 'success' : 'danger';
}

/**
 * What to print where a mark would go.
 *
 * An em dash, not a zero. A learner who has not been marked has not scored
 * nothing; those are different, and the gradebook is read by people who are
 * deciding whether to chase somebody.
 */
export const UNMARKED = '—';
