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
