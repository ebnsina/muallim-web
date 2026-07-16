/**
 * What a role lets somebody see in the navigation.
 *
 * None of this is a control. muallim-api decides what a request may do, from the
 * bearer token, and it refuses a student who types `/teach` whether or not this
 * file agrees. What lives here is a courtesy: a link to a page that will answer
 * 403 is a link nobody should be shown.
 *
 * `role !== 'student'` was the old test, written inline. It is the same answer
 * for the roles that exist today and the wrong one the day a role is added —
 * a `viewer`, an `auditor`, a `parent` — because it admits everything it has not
 * heard of. Naming the roles that may author denies the rest by default.
 */
const AUTHORS = new Set(['owner', 'admin', 'instructor']);

/** Whether to draw the "Teach" link. Absent, unknown, and student all deny. */
export function canAuthor(user: { role?: string } | null | undefined): boolean {
	return user?.role !== undefined && AUTHORS.has(user.role);
}

// The same roles moderate the community today. A courtesy for the "New board"
// and pin/lock affordances; muallim-api enforces forum:moderate regardless.
const MODERATORS = new Set(['owner', 'admin', 'instructor']);

/** Whether to show forum moderation controls. Absent and student deny. */
export function canModerate(user: { role?: string } | null | undefined): boolean {
	return user?.role !== undefined && MODERATORS.has(user.role);
}

// `user:manage` — invite, promote, remove — belongs to these two. An instructor may
// read the member list and nothing else, so /people would refuse them the invitations
// half of the page; a link to it is a link that 403s.
const MANAGERS = new Set(['owner', 'admin']);

/** Whether to draw the "People" link. Instructor, student, and unknown all deny. */
export function canManagePeople(user: { role?: string } | null | undefined): boolean {
	return user?.role !== undefined && MANAGERS.has(user.role);
}

// `academics:manage` — the institution roster, attendance, exams, fees, the rest —
// belongs to the same two. muallim-api enforces the permission; a link to /manage for
// anyone else is a link that 403s, so the "Manage" nav entry is drawn only for these.
const ACADEMIC_MANAGERS = new Set(['owner', 'admin']);

/** Whether to draw the "Manage" link. Instructor, student, and unknown all deny. */
export function canManageInstitution(user: { role?: string } | null | undefined): boolean {
	return user?.role !== undefined && ACADEMIC_MANAGERS.has(user.role);
}

// `portal:read` — a guardian reading their own child's day, a student reading their
// own. muallim-api grants it to these two roles and gates it a second time on the
// family tie, so a link here reveals nothing; without one, a guardian signed in and
// found nothing at all, which is what this is fixing.
const PORTAL_READERS = new Set(['guardian', 'student']);

/** Whether to draw the portal link. Staff have their own screens and deny here. */
export function canReadPortal(user: { role?: string } | null | undefined): boolean {
	return user?.role !== undefined && PORTAL_READERS.has(user.role);
}
