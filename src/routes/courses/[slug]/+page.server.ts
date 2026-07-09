import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs, authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const api = apiAs(locals.accessToken);

	// Issued together. The curriculum does not depend on the progress, so waiting
	// for one before asking for the other would add a round trip to the page a
	// learner opens most often.
	const [curriculum, progress] = await Promise.all([
		api.GET('/v1/courses/{slug}', { params: { path: { slug: params.slug } } }),
		locals.accessToken
			? authedApi(locals.accessToken).GET('/v1/courses/{slug}/progress', {
					params: { path: { slug: params.slug } }
				})
			: Promise.resolve(null)
	]);

	if (curriculum.error || !curriculum.data) {
		// 404 for a draft, and for a course that never existed. Which one it is, is
		// not a stranger's business, and lms-api has already declined to say.
		error(
			curriculum.response?.status ?? 500,
			problemMessage(curriculum.error, 'That course could not be loaded.')
		);
	}

	return {
		course: curriculum.data.course,
		topics: curriculum.data.topics ?? [],
		lessonCount: curriculum.data.lesson_count,
		durationSeconds: curriculum.data.duration_seconds,

		// A reader who is not enrolled has no progress, and that is an ordinary
		// answer rather than a failure of this page.
		progress: progress?.data?.progress ?? null,
		signedIn: Boolean(locals.accessToken),
		next: url.pathname
	};
};

export const actions: Actions = {
	enrol: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const { error: problem, response } = await authedApi(locals.accessToken).POST(
			'/v1/courses/{slug}/enrol',
			{ params: { path: { slug: params.slug } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not enrol you on that course.')
			});
		}
		return { enrolled: true };
	},

	cancel: async ({ locals, params }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(locals.accessToken).DELETE(
			'/v1/courses/{slug}/enrol',
			{ params: { path: { slug: params.slug } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not cancel your enrolment.')
			});
		}
		return { cancelled: true };
	}
};
