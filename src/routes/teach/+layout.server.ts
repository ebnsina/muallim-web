import { error, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { LayoutServerLoad } from './$types';

/**
 * Guards every page under /teach.
 *
 * Without this, `/teach/{slug}` renders for anyone: it loads the course through
 * `get-course`, which is public, and a published course is readable by
 * strangers. Every write the page offered was refused with 403, so nothing could
 * be damaged — but a student was shown an editor, and being told "no" once per
 * button is not the same as not being offered the button.
 *
 * The check asks lms-api rather than deciding here. `/v1/me/courses` requires
 * `course:write` and answers 403 without it, so the authorisation rule stays in
 * the one place that owns it; mapping roles to permissions in this repo would be
 * a copy that silently rots. `limit=1` keeps it to a single indexed row.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const { error: problem, response } = await authedApi(url.origin, locals.accessToken).GET(
		'/v1/me/courses',
		{ params: { query: { limit: 1 } } }
	);

	if (problem) {
		// 403 renders as a 403: whoever is here needs a different role, and telling
		// them the page does not exist would be a lie they cannot act on.
		error(response?.status ?? 500, problemMessage(problem, 'You cannot author courses here.'));
	}
};
