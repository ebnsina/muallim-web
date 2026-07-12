import { describe, expect, it } from 'vitest';
import { minutes, span } from './duration';

describe('minutes', () => {
	it('rounds to the nearest minute', () => {
		expect(minutes(0)).toBe(0);
		expect(minutes(29)).toBe(0);
		expect(minutes(30)).toBe(1);
		expect(minutes(600)).toBe(10);
	});
});

describe('span', () => {
	it('states minutes under an hour', () => {
		expect(span(0)).toBe('0m');
		expect(span(60)).toBe('1m');
		expect(span(59 * 60)).toBe('59m');
	});

	it('states hours and minutes above one', () => {
		expect(span(60 * 60)).toBe('1h 0m');
		expect(span(347 * 60)).toBe('5h 47m');
	});

	// The two must agree about the same number of seconds: 90 minutes is "1h 30m",
	// not "1h 90m", which is what a stray modulo gets you.
	it('never carries more than 59 minutes past an hour', () => {
		expect(span(90 * 60)).toBe('1h 30m');
		expect(span(119 * 60)).toBe('1h 59m');
		expect(span(120 * 60)).toBe('2h 0m');
	});
});
