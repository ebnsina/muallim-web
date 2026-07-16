import { describe, expect, it } from 'vitest';
import {
	invitationTone,
	isOutstanding,
	memberTone,
	roleHint,
	roleLabel,
	type Invitation
} from './people';
import { ROLES } from './schemas';

const invitation = (status: Invitation['status']): Invitation => ({
	id: '018f0000-0000-7000-8000-000000000000',
	email: 'ada@example.com',
	role: 'instructor',
	status,
	created_at: '2026-07-01T09:00:00Z',
	expires_at: '2026-07-08T09:00:00Z'
});

describe('roleLabel', () => {
	it('names every role the API can send', () => {
		expect(ROLES.map(roleLabel)).toEqual(['Owner', 'Admin', 'Instructor', 'Student', 'Guardian']);
	});
});

describe('roleHint', () => {
	// A picker with a blank hint under one of its options is a picker that looks broken.
	it('says something about every role', () => {
		for (const role of ROLES) expect(roleHint(role).length).toBeGreaterThan(0);
	});
});

describe('memberTone', () => {
	it('a suspended member reads as a stop, not a caution', () => {
		expect(memberTone('active')).toBe('success');
		expect(memberTone('suspended')).toBe('danger');
	});
});

describe('invitationTone', () => {
	it.each([
		['pending', 'warning'],
		['accepted', 'success'],
		['revoked', 'neutral'],
		['expired', 'neutral']
	] as const)('%s is %s', (status, tone) => {
		expect(invitationTone(status)).toBe(tone);
	});
});

describe('isOutstanding', () => {
	// Withdrawing an accepted, revoked, or expired invitation is a 404 from the API.
	it('only a pending invitation can be withdrawn', () => {
		expect(isOutstanding(invitation('pending'))).toBe(true);
		expect(isOutstanding(invitation('accepted'))).toBe(false);
		expect(isOutstanding(invitation('revoked'))).toBe(false);
		expect(isOutstanding(invitation('expired'))).toBe(false);
	});
});
