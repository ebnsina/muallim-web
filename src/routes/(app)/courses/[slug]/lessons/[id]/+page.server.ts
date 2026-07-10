import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs, authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const {
		data,
		error: problem,
		response
	} = await apiAs(url.origin, locals.accessToken).GET('/v1/lessons/{id}/content', {
		params: { path: { id: params.id } }
	});

	if (problem || !data) {
		// A lesson behind a paywall, on a course the reader cannot see, and a lesson
		// that does not exist all answer 404. Passing the status straight through
		// keeps it that way.
		error(response?.status ?? 500, problemMessage(problem, 'That lesson could not be loaded.'));
	}

	return {
		lesson: data.lesson,
		access: data.access,
		slug: params.slug,
		signedIn: Boolean(locals.accessToken)
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
	}
};
