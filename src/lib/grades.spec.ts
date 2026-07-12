import { describe, expect, it } from 'vitest';
import { bandTone, marksByItem, percentOf } from './grades';

const entry = (item_id: string, points: number, max_points: number) => ({
	item_id,
	points,
	max_points
});

describe('marksByItem', () => {
	it('finds a mark by the item it belongs to', () => {
		const marks = marksByItem([entry('a', 3, 5), entry('b', 5, 5)]);

		expect(marks.get('a')?.points).toBe(3);
		expect(marks.get('b')?.points).toBe(5);
	});

	// An item nobody has been marked on. The page prints an em dash, not a zero.
	it('has nothing for an unmarked item', () => {
		expect(marksByItem([]).get('a')).toBeUndefined();
	});
});

describe('percentOf', () => {
	it.each([
		[10, 10, 100],
		[0, 10, 0],
		[8, 9, 89],
		[1, 3, 33]
	])('%i of %i is %i%%', (points, max, want) => {
		expect(percentOf(entry('a', points, max))).toBe(want);
	});

	/*
		Half up, matching the API's total. A row that rounded down beside a total that
		rounded up shows 1 of 8 as 12% next to 13%, and somebody opens a ticket.
	*/
	it('rounds half up, as the API does', () => {
		expect(percentOf(entry('a', 1, 8))).toBe(13); // 12.5%
		expect(percentOf(entry('a', 3, 8))).toBe(38); // 37.5%
	});

	// An item worth nothing cannot be a percentage of itself. The API refuses to
	// create one; this refuses to divide by it.
	it('does not divide by zero', () => {
		expect(percentOf(entry('a', 0, 0))).toBe(0);
	});
});

describe('bandTone', () => {
	/*
		From `is_pass`, never from the label.

		"D" passes on the default scale. "Merit" does not exist on it. A component that
		matched on letters would be wrong for every workspace that grades its own way,
		and right only for the one it was written against.
	*/
	it('colors a pass green and a fail red, whatever it is called', () => {
		expect(bandTone({ label: 'D', is_pass: true })).toBe('success');
		expect(bandTone({ label: 'A', is_pass: false })).toBe('danger');
		expect(bandTone({ label: 'Merit', is_pass: true })).toBe('success');
	});

	// Nothing marked is not a failure. It has no band at all, and no color.
	it('is neutral when there is no band', () => {
		expect(bandTone(undefined)).toBe('neutral');
		expect(bandTone(null)).toBe('neutral');
	});
});
