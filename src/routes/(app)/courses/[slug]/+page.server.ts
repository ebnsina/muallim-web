import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs, authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, parent, url }) => {
	const api = apiAs(url.origin, locals.accessToken);

	/*
		Issued before the layout's answer is awaited, not after.

		The curriculum comes from the layout now, and `await parent()` on the first
		line would hold these three behind it — turning one round trip into two on the
		page a learner opens most often. Started first, awaited last, they overlap it.
	*/
	const rest = Promise.all([
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
			: Promise.resolve(null),
		locals.accessToken
			? authedApi(url.origin, locals.accessToken).GET('/v1/courses/{slug}/announcements', {
					params: { path: { slug: params.slug } }
				})
			: Promise.resolve(null),
		locals.accessToken
			? authedApi(url.origin, locals.accessToken).GET('/v1/courses/{slug}/reviews', {
					params: { path: { slug: params.slug } }
				})
			: Promise.resolve(null)
	]);

	await parent();
	const [progress, prerequisites, enrolments, announcements, reviews] = await rest;

	// Which prerequisites this reader has finished. lms-api refuses the enrolment
	// and names them, but a learner should see the gate before they walk into it.
	const finished = new Set(
		(enrolments?.data?.enrolments ?? [])
			.filter((e) => e.status === 'completed')
			.map((e) => e.course_slug)
	);

	return {
		// `course`, `topics`, `lessonCount` and `durationSeconds` come from the layout,
		// which every page below this one needs anyway. SvelteKit merges them in.
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
		announcements: announcements?.data?.announcements ?? [],
		reviews: reviews?.data?.reviews ?? [],
		reviewSummary: reviews?.data?.summary ?? { count: 0, average: 0 },
		myReview: reviews?.data?.mine ?? null,
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
	},

	review: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const rating = Number(form.get('rating') ?? 0);
		const body = String(form.get('body') ?? '').trim();
		if (!rating || rating < 1 || rating > 5) {
			return fail(400, { reviewMessage: 'Choose a rating from 1 to 5 stars.' });
		}

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/courses/{slug}/reviews',
			{ params: { path: { slug: params.slug } }, body: { rating, body } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				reviewMessage: problemMessage(problem, 'Could not save your review.')
			});
		}
		return { reviewed: true };
	},

	unreview: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/courses/{slug}/reviews',
			{ params: { path: { slug: params.slug } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				reviewMessage: problemMessage(problem, 'Could not remove your review.')
			});
		}
		return { unreviewed: true };
	}
};
