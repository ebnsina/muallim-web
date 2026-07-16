import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	Live class sessions: a bring-your-own-link meeting on a course. An instructor
	schedules a session with a pasted join URL; enrolled learners see it and click
	Join. The bounds here are muallim-api's own (`bin/openapi.json`) — a number
	invented that the server does not share is a form that accepts what it refuses.
*/

/** One scheduled session, as the API returns it. `host_user_id` is a uuid, not a name. */
export type Session = components['schemas']['LiveSessionView'];

/** HTML constraints, as attributes. Spread onto the control. */
export const SESSION_LIMITS = {
	title: { required: true, maxlength: 200 },
	description: { maxlength: 4000 },
	joinUrl: { required: true, type: 'url', maxlength: 2048, placeholder: 'https://…' },
	startsAt: { required: true, type: 'datetime-local' },
	endsAt: { type: 'datetime-local' }
} as const;

/*
	`datetime-local` produces `YYYY-MM-DDTHH:mm` in the browser's own zone; the API
	speaks RFC 3339 in UTC. `new Date(local)` reads the wall-clock string as local
	time, and `toISOString()` hands back the UTC instant it names.
*/
export function toRFC3339(local: string): string {
	return new Date(local).toISOString();
}

/** The reverse, to seed the input when editing: a UTC instant as a local wall time. */
export function toDatetimeLocal(iso: string | undefined | null): string {
	if (!iso) return '';
	const when = new Date(iso);
	const offset = when.getTimezoneOffset() * 60_000;
	return new Date(when.getTime() - offset).toISOString().slice(0, 16);
}

/** Not yet over: measured against the end when there is one, else the start. */
export function isUpcoming(session: Session, now: number = Date.now()): boolean {
	const end = session.ends_at ?? session.starts_at;
	return Date.parse(end) >= now;
}

const dayFormat = new Intl.DateTimeFormat(undefined, {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	year: 'numeric'
});
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** A friendly line for a session's time: "Sat, 20 Jul 2026 · 2:30 PM – 3:30 PM". */
export function formatSessionWhen(session: Session): string {
	const start = new Date(session.starts_at);
	const day = dayFormat.format(start);
	const from = timeFormat.format(start);
	if (!session.ends_at) return `${day} · ${from}`;

	const end = new Date(session.ends_at);
	// Same calendar day: one date, a time range. Different day: spell the end out.
	const to =
		dayFormat.format(end) === day
			? timeFormat.format(end)
			: `${dayFormat.format(end)} · ${timeFormat.format(end)}`;
	return `${day} · ${from} – ${to}`;
}

// Blank means "not given", so an empty box is neither a date nor an error on its own.
const blankIsAbsent = (value: unknown) => (value === '' ? undefined : value);

const isDate = (value: string) => !Number.isNaN(Date.parse(value));

/** An http(s) link, and only that — a `mailto:` or a bare word is not a meeting. */
const joinUrl = z
	.string()
	.trim()
	.min(1, 'Paste the meeting link.')
	.max(2048, 'That link is longer than 2048 characters.')
	.refine((value) => {
		try {
			const url = new URL(value);
			return url.protocol === 'http:' || url.protocol === 'https:';
		} catch {
			return false;
		}
	}, 'Enter a full link that starts with http:// or https://');

/*
	Schedule (or re-schedule) a session. Title and a start are required; the join
	link must be a real http(s) URL; an end, if given, comes after the start. Runs
	in the page as a courtesy and in the action as the decision — muallim-api
	validates again behind both.
*/
export const scheduleSessionSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(1, 'Give the session a title.')
			.max(200, 'That title is longer than 200 characters.'),
		description: z
			.string()
			.trim()
			.max(4000, 'That is longer than 4000 characters.')
			.optional()
			.transform((value) => value ?? ''),
		join_url: joinUrl,
		starts_at: z
			.string()
			.trim()
			.min(1, 'Choose when it starts.')
			.refine(isDate, 'That start time is not a date.'),
		ends_at: z.preprocess(
			blankIsAbsent,
			z.string().refine(isDate, 'That end time is not a date.').optional()
		)
	})
	.superRefine((value, ctx) => {
		if (value.ends_at && Date.parse(value.ends_at) <= Date.parse(value.starts_at)) {
			ctx.addIssue({
				code: 'custom',
				message: 'The end time must be after the start.',
				path: ['ends_at']
			});
		}
	});

export type ScheduleSession = z.output<typeof scheduleSessionSchema>;
