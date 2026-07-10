import { describe, expect, it } from 'vitest';
import { deadlineState, flattenHeaders, formatBytes, rejectFile } from './upload';

describe('flattenHeaders', () => {
	it('keeps every signed header a script is allowed to send', () => {
		expect(
			flattenHeaders({ 'X-Amz-Acl': ['private'], 'Content-Type': ['application/pdf'] })
		).toEqual({ 'X-Amz-Acl': 'private', 'Content-Type': 'application/pdf' });
	});

	/*
		`fetch` will not let a script set Content-Length, and that is the whole reason
		signing it works: the browser fills it in from the body it is really sending.
		A script cannot claim one size and send another.
	*/
	it.each(['Content-Length', 'content-length', 'Host'])('leaves %s to the browser', (name) => {
		expect(flattenHeaders({ [name]: ['999'] })).toEqual({});
	});

	/*
		Go's http.Header holds a list per name because a header may legally repeat.
		Only the joined form is what was signed, so joining is not a convenience.
	*/
	it('joins a repeated header rather than picking one', () => {
		expect(flattenHeaders({ 'X-Amz-Meta': ['a', 'b'] })).toEqual({ 'X-Amz-Meta': 'a, b' });
	});

	it('drops a name with no values, which would send an empty header', () => {
		expect(flattenHeaders({ 'X-Empty': [] })).toEqual({});
	});
});

describe('formatBytes', () => {
	it.each([
		[0, '0 B'],
		[999, '999 B'],
		[1024, '1.0 KB'],
		[1536, '1.5 KB'],
		[10 * 1024, '10 KB'],
		[26214400, '25 MB'],
		[1073741824, '1.0 GB']
	])('%i bytes reads as %s', (bytes, want) => {
		expect(formatBytes(bytes)).toBe(want);
	});
});

describe('deadlineState', () => {
	const due = '2026-07-10T12:00:00Z';
	const before = new Date('2026-07-10T11:59:59Z');
	const after = new Date('2026-07-10T12:00:01Z');

	it('has no opinion when there is no deadline', () => {
		expect(deadlineState(null, false, after)).toBe('none');
	});

	it('is open before the deadline, whatever the late policy', () => {
		expect(deadlineState(due, false, before)).toBe('open');
		expect(deadlineState(due, true, before)).toBe('open');
	});

	// The deadline itself is not past. A learner who hands in on the stroke of the
	// hour is on time, and the API agrees: it compares `now > due_at`.
	it('is open at the exact moment of the deadline', () => {
		expect(deadlineState(due, false, new Date(due))).toBe('open');
	});

	it('is late, not closed, when late work is allowed', () => {
		expect(deadlineState(due, true, after)).toBe('late');
	});

	it('is closed when it is not', () => {
		expect(deadlineState(due, false, after)).toBe('closed');
	});
});

describe('rejectFile', () => {
	const limits = { maxBytes: 1024, maxFiles: 2, attached: 0 };

	it('accepts a file within every limit', () => {
		expect(rejectFile({ name: 'essay.pdf', size: 500 }, limits)).toBeNull();
	});

	it('accepts a file of exactly the limit', () => {
		expect(rejectFile({ name: 'essay.pdf', size: 1024 }, limits)).toBeNull();
	});

	it('refuses one byte over, and says what the limit is', () => {
		expect(rejectFile({ name: 'essay.pdf', size: 1025 }, limits)).toMatch(/1\.0 KB/);
	});

	// The store would accept a zero-byte PUT and the API would record a file that
	// nobody can open. Cheaper to say so here.
	it('refuses an empty file', () => {
		expect(rejectFile({ name: 'essay.pdf', size: 0 }, limits)).toMatch(/empty/);
	});

	it('refuses the file after the last one, in the plural it deserves', () => {
		expect(rejectFile({ name: 'c.pdf', size: 10 }, { ...limits, attached: 2 })).toBe(
			'You may attach 2 files.'
		);
		expect(rejectFile({ name: 'c.pdf', size: 10 }, { ...limits, maxFiles: 1, attached: 1 })).toBe(
			'You may attach 1 file.'
		);
	});
});
