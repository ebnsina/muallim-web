import { error, fail } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

interface AssignmentBody {
	title: string;
	instructions: string;
	points: number;
	passing_points: number;
	max_files: number;
	max_bytes: number;
	due_at: string | null | undefined;
	allow_late: boolean;
}

/** What a `datetime-local` input produces, turned into an instant the API accepts. */
function deadlineFrom(value: FormDataEntryValue | null): string | null | undefined {
	if (value === null) return undefined;

	const local = String(value).trim();
	if (local === '') return null;

	const at = new Date(local);
	return Number.isNaN(at.getTime()) ? undefined : at.toISOString();
}

/** The same instant, in the shape `datetime-local` wants: local time, no zone. */
function toLocalInput(iso: string | null | undefined): string {
	if (!iso) return '';

	const at = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, '0');

	return (
		`${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}` +
		`T${pad(at.getHours())}:${pad(at.getMinutes())}`
	);
}

/**
 * A lesson's assignment, as its author sees it.
 *
 * A lesson may not have one, and that is not an error — it is the empty form.
 * lms-api answers 404 for both "no assignment" and "no lesson you may edit", and
 * `teach` has already established the second, so a 404 here means the first.
 */
export const load: PageServerLoad = async ({ locals, params, setHeaders, url }) => {
	if (!locals.accessToken) error(401, 'Sign in to edit this lesson.');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/lessons/{id}/assignment', {
		params: { path: { id: params.id } }
	});

	if (problem && response?.status !== 404) {
		error(response?.status ?? 500, problemMessage(problem, 'That lesson could not be loaded.'));
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		slug: params.slug,
		lessonId: params.id,
		assignment: data?.assignment ?? null,
		dueLocal: toLocalInput(data?.assignment.due_at)
	};
};

/**
 * Everything an author may set, read out of one form.
 *
 * `due_at` carries three meanings and they are all needed: a string sets the
 * deadline, `null` clears it, and an absent field leaves it alone. Only the first
 * two can come out of a form that always has the input in it.
 */
function bodyFrom(form: FormData): { body?: AssignmentBody; problem?: string } {
	const raw = form.get('due_at');
	const dueAt = deadlineFrom(raw);

	if (dueAt === undefined && raw !== null) {
		return { problem: 'That deadline is not a date.' };
	}

	return {
		body: {
			title: String(form.get('title') ?? '').trim(),
			instructions: String(form.get('instructions') ?? '').trim(),
			points: Number(form.get('points')),
			passing_points: Number(form.get('passing_points')),
			max_files: Number(form.get('max_files')),
			max_bytes: Number(form.get('max_bytes')),
			due_at: dueAt,
			allow_late: form.get('allow_late') === 'on'
		}
	};
}

export const actions: Actions = {
	/**
	 * Create or replace. One button, because an author does not care which verb the
	 * API needs — the page knows whether an assignment exists, and the API refuses a
	 * second one on the same lesson either way.
	 */
	save: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to edit this lesson.');

		const form = await request.formData();
		const { body, problem: invalid } = bodyFrom(form);
		if (!body) return fail(422, { message: invalid ?? 'That assignment is not valid.' });

		const api = authedApi(url.origin, locals.accessToken);
		const exists = form.get('exists') === 'true';

		// A patch may erase the deadline by sending `null`. A creation cannot erase
		// what does not exist yet, so there the field is simply left out.
		const { error: problem, response } = exists
			? await api.PATCH('/v1/lessons/{id}/assignment', {
					params: { path: { id: params.id } },
					body
				})
			: await api.POST('/v1/lessons/{id}/assignment', {
					params: { path: { id: params.id } },
					body: { ...body, due_at: body.due_at ?? undefined }
				});

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That assignment could not be saved.')
			});
		}

		return { saved: true };
	},

	/** Deletes every submission with it, and queues every uploaded file for deletion. */
	delete: async ({ locals, params, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to edit this lesson.');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/lessons/{id}/assignment',
			{ params: { path: { id: params.id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That assignment could not be removed.')
			});
		}

		return { deleted: true };
	}
};
