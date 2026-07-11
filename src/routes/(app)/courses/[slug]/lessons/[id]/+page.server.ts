import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs, authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	// The lesson body and the reader's own note are two independent reads; started
	// together, they cost one round trip, not two. The note is private, so it is
	// fetched only when there is somebody to fetch it for.
	const contentRequest = apiAs(url.origin, locals.accessToken).GET('/v1/lessons/{id}/content', {
		params: { path: { id: params.id } }
	});
	const noteRequest = locals.accessToken
		? authedApi(url.origin, locals.accessToken).GET('/v1/lessons/{id}/note', {
				params: { path: { id: params.id } }
			})
		: null;
	const highlightsRequest = locals.accessToken
		? authedApi(url.origin, locals.accessToken).GET('/v1/lessons/{id}/highlights', {
				params: { path: { id: params.id } }
			})
		: null;

	const { data, error: problem, response } = await contentRequest;

	if (problem || !data) {
		// A lesson behind a paywall, on a course the reader cannot see, and a lesson
		// that does not exist all answer 404. Passing the status straight through
		// keeps it that way.
		error(response?.status ?? 500, problemMessage(problem, 'That lesson could not be loaded.'));
	}

	// The margin — note and marks — that fails to load is not worth failing the
	// lesson over: the reader came to read, not to annotate. It falls back to empty,
	// and writing still works.
	const [noteResult, highlightsResult] = await Promise.all([noteRequest, highlightsRequest]);

	return {
		lesson: data.lesson,
		access: data.access,
		slug: params.slug,
		signedIn: Boolean(locals.accessToken),
		note: noteResult?.data?.note.body ?? '',
		highlights: highlightsResult?.data?.highlights ?? []
	};
};

export const actions: Actions = {
	/**
	 * One action for both directions. lms-api treats completion as a toggle and
	 * recomputes the course roll-up in the same transaction, so a reopened lesson
	 * cannot leave a course sitting at 100%.
	 */
	complete: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const form = await request.formData();
		const complete = form.get('complete') !== 'false';

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/lessons/{id}/complete', {
			params: { path: { id: params.id } },
			body: { complete }
		});

		if (problem) {
			return fail(response?.status ?? 500, {
				message: complete
					? problemMessage(problem, 'Could not mark that lesson complete.')
					: problemMessage(problem, 'Could not reopen that lesson.')
			});
		}

		return { completed: complete, progress: data?.progress ?? null };
	},

	/**
	 * Save the reader's private note. Idempotent: the whole note is sent, and an
	 * empty one clears it — the API treats a note emptied and one never written the
	 * same, so the page does not have to.
	 */
	saveNote: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const body = String((await request.formData()).get('body') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/lessons/{id}/note',
			{
				params: { path: { id: params.id } },
				body: { body }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				noteMessage: problemMessage(problem, 'Could not save your note.')
			});
		}

		return { noteSaved: true };
	},

	/** Mark a passage. The offsets and quote come from the reader's selection. */
	addHighlight: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const form = await request.formData();
		const quote = String(form.get('quote') ?? '');
		const start = Number(form.get('start'));
		const end = Number(form.get('end'));

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/lessons/{id}/highlights', {
			params: { path: { id: params.id } },
			body: { quote, start, end, note: '' }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				highlightMessage: problemMessage(problem, 'Could not save that highlight.')
			});
		}

		return { highlight: data.highlight };
	},

	/** Change the note on a marked passage, by its own id. */
	editHighlight: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const note = String(form.get('note') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/highlights/{id}',
			{ params: { path: { id } }, body: { note } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				highlightMessage: problemMessage(problem, 'Could not save that note.')
			});
		}

		return { highlightSaved: true };
	},

	/** Remove a marked passage. */
	deleteHighlight: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/highlights/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				highlightMessage: problemMessage(problem, 'Could not remove that highlight.')
			});
		}

		return { highlightDeleted: true };
	}
};
