import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs, authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const api = apiAs(url.origin, locals.accessToken);

	// Issued together. The curriculum does not depend on the progress, so waiting
	// for one before asking for the other would add a round trip to the page a
	// learner opens most often.
	const [curriculum, progress, prerequisites, enrolments] = await Promise.all([
		api.GET('/v1/courses/{slug}', { params: { path: { slug: params.slug } } }),
		locals.accessToken
			? authedApi(url.origin, locals.accessToken).GET('/v1/courses/{slug}/progress', {
					params: { path: { slug: params.slug } }
				})
			: Promise.resolve(null),
		api.GET('/v1/courses/{slug}/prerequisites', { params: { path: { slug: params.slug } } }),
		locals.accessToken
			? authedApi(url.origin, locals.accessToken).GET('/v1/me/enrolments', {
					params: { query: { limit: 100 } }
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

	// Which prerequisites this reader has finished. lms-api refuses the enrolment
	// and names them, but a learner should see the gate before they walk into it.
	const finished = new Set(
		(enrolments?.data?.enrolments ?? [])
			.filter((e) => e.status === 'completed')
			.map((e) => e.course_slug)
	);

	return {
		course: curriculum.data.course,
		topics: curriculum.data.topics ?? [],
		lessonCount: curriculum.data.lesson_count,
		durationSeconds: curriculum.data.duration_seconds,

		prerequisites: (prerequisites.data?.prerequisites ?? []).map((c) => ({
			slug: c.slug,
			title: c.title,
			done: finished.has(c.slug)
		})),

		// After-enrolment drip counts from this learner's own enrolment, so the page
		// cannot compute an unlock date without it. Sequential drip has no date at
		// all, and lms-api is the only thing that knows which lesson comes next.
		enrolledAt:
			(enrolments?.data?.enrolments ?? []).find((e) => e.course_slug === params.slug)
				?.enrolled_at ?? null,

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

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
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

	cancel: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
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
