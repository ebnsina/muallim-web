import { error } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/**
 * What has been handed in.
 *
 * Waiting-to-be-marked by default, because that is the only reason to open this
 * page. `?all=1` widens it. Drafts are never here — muallim-api excludes them from
 * this endpoint whatever is asked, and a marker has no business reading work
 * nobody has finished.
 */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) error(401, 'Sign in to mark this assignment.');

	const awaiting = !url.searchParams.has('all');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET(
		'/v1/lessons/{id}/assignment/submissions',
		{
			params: { path: { id: params.id }, query: { awaiting } }
		}
	);

	if (problem || !data) {
		error(
			response?.status ?? 500,
			problemMessage(problem, 'That marking queue could not be loaded.')
		);
	}

	return {
		slug: params.slug,
		lessonId: params.id,
		awaiting,
		submissions: data.submissions
	};
};
