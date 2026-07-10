import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/**
 * The curriculum, as the author sees it: drafts and all.
 *
 * The page reads it from the layout. This is for the reorder actions, which must
 * not: they need the order as it stands *now*, not as it stood when the page was
 * rendered, because somebody else may have added a section since.
 */
async function curriculum(origin: string, accessToken: string, slug: string) {
	return authedApi(origin, accessToken).GET('/v1/courses/{slug}', {
		params: { path: { slug } }
	});
}

export const load: PageServerLoad = async ({ locals, params, parent, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	// Started before the layout's curriculum is awaited, so the two overlap. An
	// author waiting for two round trips in series is waiting for no reason.
	const rest = Promise.all([
		api.GET('/v1/courses/{slug}/prerequisites', { params: { path: { slug: params.slug } } }),
		api.GET('/v1/me/courses', { params: { query: { limit: 100 } } })
	]);

	await parent();
	const [prerequisites, mine] = await rest;

	// Every other course in the workspace, so the author picks a prerequisite from
	// a list rather than typing a slug and finding out later that they mistyped it.
	const candidates = (mine.data?.courses ?? []).filter((c) => c.slug !== params.slug);

	// `course`, `topics` and `lessonCount` come from the layout.
	return {
		prerequisites: prerequisites.data?.prerequisites ?? [],
		candidates
	};
};

const DRIP_MODES = ['none', 'scheduled', 'after_enrolment', 'sequential'] as const;
type DripMode = (typeof DRIP_MODES)[number];

/** Narrows a submitted mode rather than asserting it: a form field is user input. */
function toDripMode(value: string): DripMode {
	return (DRIP_MODES as readonly string[]).includes(value) ? (value as DripMode) : 'none';
}

/**
 * Returns `ids` with the element at `id` swapped one place in `delta`'s
 * direction, or null when there is nowhere to go.
 *
 * The result names every sibling exactly once, which is what lms-api requires: a
 * short list would silently leave the unnamed siblings where they were, and a
 * list naming a foreign id would silently do nothing to it. Both are refused
 * rather than half-applied, so a concurrent insert makes this fail cleanly
 * instead of scrambling the order.
 */
function swapped(ids: string[], id: string, delta: number): string[] | null {
	const from = ids.indexOf(id);
	if (from < 0) return null;

	const to = from + delta;
	if (to < 0 || to >= ids.length) return null;

	const out = [...ids];
	[out[from], out[to]] = [out[to], out[from]];
	return out;
}

/** Every action needs a session and a form; this collapses the preamble. */
function guard(accessToken: string | null): asserts accessToken is string {
	if (!accessToken) redirect(303, '/login');
}

export const actions: Actions = {
	addTopic: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const title = String((await request.formData()).get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'Give the section a title.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/topics',
			{ params: { path: { slug: params.slug } }, body: { title } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not add that section.')
			});
		}
	},

	renameTopic: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'A section needs a title.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/topics/{id}',
			{ params: { path: { id } }, body: { title } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not rename that section.')
			});
		}
	},

	deleteTopic: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/topics/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not delete that section.')
			});
		}
	},

	moveTopic: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const delta = form.get('direction') === 'up' ? -1 : 1;

		// Read the current order rather than trust the page: it may have been
		// rendered before somebody else added a section.
		const { data, error: problem } = await curriculum(url.origin, locals.accessToken, params.slug);
		if (problem || !data) {
			return fail(500, { message: 'Could not read the current order.' });
		}

		const order = swapped(
			(data.topics ?? []).map((t) => t.id),
			id,
			delta
		);
		if (!order) return fail(400, { message: 'That section cannot move any further.' });

		const { error: reorderProblem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/courses/{slug}/topics/order',
			{ params: { path: { slug: params.slug } }, body: { topic_ids: order } }
		);

		if (reorderProblem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(reorderProblem, 'Could not reorder the sections.')
			});
		}
	},

	addLesson: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const topicId = String(form.get('topic_id') ?? '');
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'Give the lesson a title.' });

		// A new lesson starts as text with no video. lms-api defaults to exactly
		// this, but the generated client requires both fields, and stating them is
		// clearer than relying on a default that lives in another repository.
		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/topics/{id}/lessons',
			{
				params: { path: { id: topicId } },
				body: { title, content_type: 'text', video_source: 'none' }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not add that lesson.')
			});
		}
	},

	deleteLesson: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/lessons/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not delete that lesson.')
			});
		}
	},

	moveLesson: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const topicId = String(form.get('topic_id') ?? '');
		const delta = form.get('direction') === 'up' ? -1 : 1;

		const { data, error: problem } = await curriculum(url.origin, locals.accessToken, params.slug);
		if (problem || !data) {
			return fail(500, { message: 'Could not read the current order.' });
		}

		const topic = (data.topics ?? []).find((t) => t.id === topicId);
		if (!topic) return fail(404, { message: 'That section no longer exists.' });

		const order = swapped(
			(topic.lessons ?? []).map((l) => l.id),
			id,
			delta
		);
		if (!order) return fail(400, { message: 'That lesson cannot move any further.' });

		const { error: reorderProblem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/topics/{id}/lessons/order',
			{ params: { path: { id: topicId } }, body: { lesson_ids: order } }
		);

		if (reorderProblem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(reorderProblem, 'Could not reorder the lessons.')
			});
		}
	},

	setDripMode: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const mode = toDripMode(String((await request.formData()).get('mode') ?? ''));

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/courses/{slug}/drip',
			{ params: { path: { slug: params.slug } }, body: { mode } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not change how this course releases its lessons.')
			});
		}
	},

	addPrerequisite: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const requiresSlug = String((await request.formData()).get('requires_slug') ?? '');
		if (!requiresSlug) return fail(400, { message: 'Choose a course to require.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/prerequisites',
			{ params: { path: { slug: params.slug } }, body: { requires_slug: requiresSlug } }
		);

		if (problem) {
			// A cycle comes back 422 and says which edge closed it; a duplicate 409.
			// Both messages say what to do next, so they are shown as they are.
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not add that prerequisite.')
			});
		}
	},

	removePrerequisite: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const requiresSlug = String((await request.formData()).get('requires_slug') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/courses/{slug}/prerequisites/{requires_slug}',
			{ params: { path: { slug: params.slug, requires_slug: requiresSlug } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not remove that prerequisite.')
			});
		}
	},

	togglePreview: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		// Only the one field. A PATCH carrying an empty `content` would erase the
		// lesson body, which is not what pressing "make this a preview" means.
		const isPreview = form.get('is_preview') === 'true';

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/lessons/{id}',
			{ params: { path: { id } }, body: { is_preview: isPreview } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not change that lesson.')
			});
		}
	}
};
