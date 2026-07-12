import { describe, expect, it } from 'vitest';
import { isProblem, problemCorrelationId, problemMessage } from './problem';

const problem = {
	title: 'Not Found',
	status: 404,
	detail: 'The requested resource does not exist.',
	instance: '/v1/courses/missing',
	correlation_id: 'LE6OFPBDFF5AZKUQVWCUXTKPRL'
};

describe('isProblem', () => {
	it('accepts a document from muallim-api', () => {
		expect(isProblem(problem)).toBe(true);
	});

	it('accepts the minimum required fields', () => {
		expect(isProblem({ title: 'Conflict', status: 409 })).toBe(true);
	});

	it.each([
		['null', null],
		['undefined', undefined],
		['a string', 'not found'],
		['a number', 404],
		['an array', []],
		['an object missing status', { title: 'Not Found' }],
		['an object with a non-numeric status', { title: 'Not Found', status: '404' }]
	])('rejects %s', (_label, value) => {
		expect(isProblem(value)).toBe(false);
	});
});

describe('problemMessage', () => {
	it('prefers detail, which the API guarantees is safe to display', () => {
		expect(problemMessage(problem)).toBe('The requested resource does not exist.');
	});

	it('falls back to title when detail is absent', () => {
		expect(problemMessage({ title: 'Conflict', status: 409 })).toBe('Conflict');
	});

	// A thrown TypeError or a stray HTML error page must never reach the user.
	it('returns the generic fallback for a non-problem payload', () => {
		expect(problemMessage(new TypeError('fetch failed'))).toBe('Something went wrong.');
		expect(problemMessage('<html>502 Bad Gateway</html>')).toBe('Something went wrong.');
	});

	it('honours a caller-supplied fallback', () => {
		expect(problemMessage(undefined, 'Could not load the course.')).toBe(
			'Could not load the course.'
		);
	});
});

describe('problemCorrelationId', () => {
	it('extracts the id a user can quote to support', () => {
		expect(problemCorrelationId(problem)).toBe('LE6OFPBDFF5AZKUQVWCUXTKPRL');
	});

	it('is undefined when the payload is not a problem document', () => {
		expect(problemCorrelationId({ oops: true })).toBeUndefined();
	});
});
