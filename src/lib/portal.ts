// Types for the parent-and-pupil portal, derived from the operation responses
// (huma inlines these as anonymous structs, so they are read off `paths`, not
// `components['schemas']`).
import type { paths } from '$lib/api/schema';

type ChildrenBody = NonNullable<
	paths['/v1/portal/children']['get']['responses']['200']['content']['application/json']
>;
export type Child = NonNullable<ChildrenBody['children']>[number];

type AttendanceBody = NonNullable<
	paths['/v1/portal/children/{id}/attendance']['get']['responses']['200']['content']['application/json']
>;
export type AttendanceDay = NonNullable<AttendanceBody['days']>[number];
export type AttendanceSummary = AttendanceBody['summary'];

type FeesBody = NonNullable<
	paths['/v1/portal/children/{id}/fees']['get']['responses']['200']['content']['application/json']
>;
export type Ledger = FeesBody['ledger'];
export type Invoice = NonNullable<Ledger['invoices']>[number];

type HifzBody = NonNullable<
	paths['/v1/portal/children/{id}/hifz']['get']['responses']['200']['content']['application/json']
>;
export type HifzSummary = HifzBody['summary'];

/** An ISO date `days` ago, for the default attendance and hifz windows. */
export function isoDaysAgo(days: number, today = new Date()): string {
	const d = new Date(today);
	d.setDate(d.getDate() - days);
	return d.toISOString().slice(0, 10);
}

/** Today as an ISO date. */
export function isoToday(today = new Date()): string {
	return today.toISOString().slice(0, 10);
}
