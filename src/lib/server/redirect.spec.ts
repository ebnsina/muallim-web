import { describe, expect, it } from 'vitest';
import { safeRedirect } from './redirect';

describe('safeRedirect', () => {
	it('keeps a path on this site', () => {
		expect(safeRedirect('/dashboard')).toBe('/dashboard');
		expect(safeRedirect('/courses/go-basics?tab=curriculum')).toBe(
			'/courses/go-basics?tab=curriculum'
		);
	});

	it('falls back when there is nothing to honour', () => {
		expect(safeRedirect(null)).toBe('/dashboard');
		expect(safeRedirect(undefined)).toBe('/dashboard');
		expect(safeRedirect('')).toBe('/dashboard');
	});

	it('uses the supplied fallback', () => {
		expect(safeRedirect(null, '/')).toBe('/');
	});

	// Each of these is an open redirect if it survives. The protocol-relative and
	// backslash forms both begin with a slash, so a naive check passes them.
	it.each([
		'//evil.test',
		'//evil.test/login',
		'/\\evil.test',
		'/\\/evil.test',
		'https://evil.test',
		'http://evil.test',
		'javascript:alert(1)',
		'evil.test'
	])('refuses %s', (hostile) => {
		expect(safeRedirect(hostile)).toBe('/dashboard');
	});
});
