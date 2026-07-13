import { describe, expect, it } from 'vitest';
import { canAuthor, canManagePeople } from './roles';

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
		the old test — and the link goes to a page muallim-api answers 403 to. Denying by
		default means a new role starts invisible and is added deliberately.
	*/
	it('an unknown role may not', () => {
		expect(canAuthor({ role: 'auditor' })).toBe(false);
		expect(canAuthor({ role: 'parent' })).toBe(false);
		expect(canAuthor({ role: '' })).toBe(false);
	});

	// Case matters. muallim-api sends lowercase, and a match that ignored case would be
	// a rule that quietly disagreed with the one enforcing it.
	it('does not guess at capitalisation', () => {
		expect(canAuthor({ role: 'Owner' })).toBe(false);
	});
});

describe('canManagePeople', () => {
	it.each(['owner', 'admin'])('%s holds user:manage', (role) => {
		expect(canManagePeople({ role })).toBe(true);
	});

	// An instructor may read the member list — muallim-api grants user:read — but not
	// invite, promote, or remove. /people is the manage page, so it is not for them.
	it('an instructor may not', () => {
		expect(canManagePeople({ role: 'instructor' })).toBe(false);
	});

	it('a student, a stranger, and an unknown role may not', () => {
		expect(canManagePeople({ role: 'student' })).toBe(false);
		expect(canManagePeople(null)).toBe(false);
		expect(canManagePeople(undefined)).toBe(false);
		expect(canManagePeople({})).toBe(false);
		expect(canManagePeople({ role: 'auditor' })).toBe(false);
		expect(canManagePeople({ role: 'Owner' })).toBe(false);
	});
});
