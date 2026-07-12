import { describe, expect, it } from 'vitest';
import { exactTime, relativeTime } from './relative-time';

const now = new Date('2026-07-12T12:00:00Z');
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();

describe('relativeTime', () => {
	it('states the past in the largest unit that fits', () => {
		expect(relativeTime(ago(30), now)).toBe('30 seconds ago');
		expect(relativeTime(ago(5 * 60), now)).toBe('5 minutes ago');
		expect(relativeTime(ago(3 * 3600), now)).toBe('3 hours ago');
		expect(relativeTime(ago(2 * 86400), now)).toBe('2 days ago');
		expect(relativeTime(ago(21 * 86400), now)).toBe('3 weeks ago');
		expect(relativeTime(ago(400 * 86400), now)).toBe('last year');
	});

	// `numeric: 'auto'` is the whole point: nobody writes "1 days ago".
	it('says yesterday rather than 1 day ago', () => {
		expect(relativeTime(ago(0), now)).toBe('now');
		expect(relativeTime(ago(86400), now)).toBe('yesterday');
	});

	it('handles a clock that is slightly ahead', () => {
		expect(relativeTime(new Date(now.getTime() + 5 * 60_000), now)).toBe('in 5 minutes');
	});

	it('renders nothing for a date it cannot read', () => {
		expect(relativeTime('not a date', now)).toBe('');
		expect(exactTime('not a date')).toBe('');
	});
});

describe('exactTime', () => {
	it('carries the day and the time, because that is what the hover is for', () => {
		const stamp = exactTime(new Date('2026-07-12T12:00:00Z'));
		expect(stamp).toMatch(/2026/);
		expect(stamp).toMatch(/\d:\d\d/);
	});
});
