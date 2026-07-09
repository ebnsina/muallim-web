import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/** The curriculum, as the author sees it: drafts and all. */
async function curriculum(origin: string, accessToken: string, slug: string) {
	return authedApi(origin, accessToken).GET('/v1/courses/{slug}', {
		params: { path: { slug } }
	});
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const {
		data,
		error: problem,
		response
	} = await curriculum(url.origin, locals.accessToken, params.slug);

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'That course could not be loaded.'));
	}

	return {
		course: data.course,
		topics: data.topics ?? [],
		lessonCount: data.lesson_count
	};
};

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
