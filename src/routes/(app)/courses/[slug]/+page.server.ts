import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs, authedApi } from '$lib/server/api';
import { reviewSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
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

	// Which prerequisites this reader has finished. muallim-api refuses the enrollment
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

		// After-enrollment drip counts from this learner's own enrollment, so the page
		// cannot compute an unlock date without it. Sequential drip has no date at
		// all, and muallim-api is the only thing that knows which lesson comes next.
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
	/** Buy a course. The order is pending until the gateway's webhook says otherwise. */
	buy: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/courses/{slug}/checkout', {
			params: { path: { slug: params.slug } },
			body: {
				gateway: 'fake',
				success_url: `${url.origin}/courses/${params.slug}?paid=1`,
				cancel_url: `${url.origin}/courses/${params.slug}`
			}
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not start that checkout.')
			});
		}

		// The gateway's own page. A card number never touches this app, and never
		// touches muallim-api either.
		redirect(303, data.url);
	},

	enrol: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/enrol',
			{ params: { path: { slug: params.slug } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not enroll you on that course.')
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
				message: problemMessage(problem, 'Could not cancel your enrollment.')
			});
		}
		return { cancelled: true };
	},

	review: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		// The same schema the section ran. That one was a courtesy; this one decides.
		const parsed = parseForm(reviewSchema, await request.formData());
		// About the stars, so it renders under the stars — the page routes it there.
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { rating, body } = parsed.value;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/courses/{slug}/reviews',
			{ params: { path: { slug: params.slug } }, body: { rating, body } }
		);

		// A failure of the call, not of a field: `reviewMessage` is the section's voice.
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
