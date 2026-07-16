import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { canAuthor } from '$lib/roles';
import { apiAs, authedApi } from '$lib/server/api';
import { reviewSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** Every gateway the API knows, in the order a checkout tries them. The fake one last. */
const GATEWAYS = ['stripe', 'sslcommerz', 'bkash', 'fake'] as const;

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

	const { user } = await parent();
	const [progress, prerequisites, enrolments, announcements, reviews] = await rest;

	const mine = (enrolments?.data?.enrolments ?? []).find((e) => e.course_slug === params.slug);

	/*
		Which gateways this workspace can be paid through — for the readers allowed to
		ask. `GET /v1/billing/account` requires course:write, so a learner is answered
		403 and there is no other endpoint that lists them. A buyer who cannot see the
		list is not shown a picker; the checkout action finds the gateway instead.
	*/
	const gateways = canAuthor(user)
		? (
				await Promise.all(
					GATEWAYS.map(async (gateway) => {
						const { data } = await authedApi(url.origin, locals.accessToken!).GET(
							'/v1/billing/account',
							{ params: { query: { gateway } } }
						);
						return data?.account?.ready ? gateway : null;
					})
				)
			).filter((gateway) => gateway !== null)
		: [];

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
		enrolledAt: mine?.enrolled_at ?? null,

		// The reader's own enrolment: its state, and how it was come by. A bought one
		// cannot be cancelled — the API answers 409 — so the panel offers a refund to
		// ask for rather than a button that fails.
		enrolment: mine ? { status: mine.status, source: mine.source } : null,
		gateways,

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
	/*
		Buy a course. The order is pending until the gateway's webhook says otherwise.

		The buyer names a gateway when the page could offer a choice. When it could not
		— which is every learner, since the account endpoint requires course:write —
		the candidates are tried in turn and the first one that opens a checkout wins.
		A gateway the workspace has not connected refuses in one transaction and leaves
		no order behind, so this discovers what a learner may not read, and charges
		nobody twice. With one connected gateway it is one request, as before.
	*/
	buy: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const chosen = String((await request.formData()).get('gateway') ?? '');
		const candidates = GATEWAYS.filter((g) => (chosen ? g === chosen : true));

		const api = authedApi(url.origin, locals.accessToken);
		let last: { status: number; message: string } | null = null;

		for (const gateway of candidates) {
			const {
				data,
				error: problem,
				response
			} = await api.POST('/v1/courses/{slug}/checkout', {
				params: { path: { slug: params.slug } },
				body: {
					gateway,
					success_url: `${url.origin}/courses/${params.slug}?paid=1`,
					cancel_url: `${url.origin}/courses/${params.slug}`
				}
			});

			// The gateway's own page. A card number never touches this app, and never
			// touches muallim-api either.
			if (data) redirect(303, data.url);

			last = {
				status: response?.status ?? 500,
				message: problemMessage(problem, "We couldn't start your payment. Please try again.")
			};
		}

		return fail(last?.status ?? 500, {
			message: last?.message ?? "We couldn't start your payment. Please try again."
		});
	},

	enrol: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/enrol',
			{ params: { path: { slug: params.slug } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't enrol you on that course. Please try again.")
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
				message: problemMessage(problem, "We couldn't cancel your enrolment. Please try again.")
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
				reviewMessage: problemMessage(problem, "We couldn't save your review. Please try again.")
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
				reviewMessage: problemMessage(problem, "We couldn't remove your review. Please try again.")
			});
		}
		return { unreviewed: true };
	}
};
