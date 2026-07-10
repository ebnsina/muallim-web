import { describe, expect, it } from 'vitest';
import { canAuthor } from './roles';

describe('canAuthor', () => {
	it.each(['owner', 'admin', 'instructor'])('%s may author', (role) => {
		expect(canAuthor({ role })).toBe(true);
	});

	it('a student may not', () => {
		expect(canAuthor({ role: 'student' })).toBe(false);
	});

	it('a stranger may not', () => {
		expect(canAuthor(null)).toBe(false);
		expect(canAuthor(undefined)).toBe(false);
		expect(canAuthor({})).toBe(false);
	});

	/*
		The reason this is a list and not `role !== 'student'`.

		A role nobody has taught this file about is a role that gets the link, under
		the old test — and the link goes to a page lms-api answers 403 to. Denying by
		default means a new role starts invisible and is added deliberately.
	*/
	it('an unknown role may not', () => {
		expect(canAuthor({ role: 'auditor' })).toBe(false);
		expect(canAuthor({ role: 'parent' })).toBe(false);
		expect(canAuthor({ role: '' })).toBe(false);
	});

	// Case matters. lms-api sends lowercase, and a match that ignored case would be
	// a rule that quietly disagreed with the one enforcing it.
	it('does not guess at capitalisation', () => {
		expect(canAuthor({ role: 'Owner' })).toBe(false);
	});
});
