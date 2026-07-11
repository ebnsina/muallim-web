import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, parent, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	// Started before the layout's curriculum is awaited, so they overlap. An author
	// waiting for round trips in series is waiting for no reason.
	const rest = Promise.all([
		api.GET('/v1/courses/{slug}/prerequisites', { params: { path: { slug: params.slug } } }),
		api.GET('/v1/me/courses', { params: { query: { limit: 100 } } }),
		api.GET('/v1/certificate-templates'),
		api.GET('/v1/courses/{slug}/certificate-template', { params: { path: { slug: params.slug } } }),
		api.GET('/v1/courses/{slug}/announcements', { params: { path: { slug: params.slug } } }),
		api.GET('/v1/courses/{slug}/analytics', { params: { path: { slug: params.slug } } })
	]);

	await parent();
	const [prerequisites, mine, templates, courseTemplate, announcements, analytics] = await rest;

	// Every other course in the workspace, so the author picks a prerequisite from
	// a list rather than typing a slug and finding out later that they mistyped it.
	const candidates = (mine.data?.courses ?? []).filter((c) => c.slug !== params.slug);

	// `course`, `topics` and `lessonCount` come from the layout.
	return {
		prerequisites: prerequisites.data?.prerequisites ?? [],
		candidates,

		// The certificate template picker. `null` template_id is the built-in default.
		certificateTemplates: templates.data?.templates ?? [],
		currentTemplateId: courseTemplate.data?.template_id ?? null,

		announcements: announcements.data?.announcements ?? [],
		analytics: analytics.data ?? null
	};
};

const DRIP_MODES = ['none', 'scheduled', 'after_enrolment', 'sequential'] as const;
type DripMode = (typeof DRIP_MODES)[number];

/** Narrows a submitted mode rather than asserting it: a form field is user input. */
function toDripMode(value: string): DripMode {
	return (DRIP_MODES as readonly string[]).includes(value) ? (value as DripMode) : 'none';
}

/** Every action needs a session and a form; this collapses the preamble. */
function guard(accessToken: string | null): asserts accessToken is string {
	if (!accessToken) redirect(303, '/login');
}

export const actions: Actions = {
	/** Choose what this course's certificate says. Empty is the built-in default. */
	setCertificateTemplate: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const chosen = String(form.get('template_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/courses/{slug}/certificate-template',
			{
				params: { path: { slug: params.slug } },
				body: { template_id: chosen === '' ? null : chosen }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That certificate template could not be applied.')
			});
		}

		return { templateSaved: true };
	},

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

	/**
	 * The whole new order, drag-and-dropped on the page and submitted at once.
	 *
	 * lms-api requires every sibling named exactly once, and the client sends
	 * exactly that — the list it just rearranged. A concurrent insert elsewhere
	 * makes the submitted list no longer name every sibling, and the API refuses it
	 * rather than half-applying, which is the safe failure.
	 */
	reorderTopics: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const ids = (await request.formData()).getAll('topic_ids').map(String);
		if (ids.length === 0) return fail(400, { message: 'No new order was submitted.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/courses/{slug}/topics/order',
			{ params: { path: { slug: params.slug } }, body: { topic_ids: ids } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not reorder the sections.')
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

	/** The whole new order of one section's lessons, dropped into place at once. */
	reorderLessons: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const topicId = String(form.get('topic_id') ?? '');
		const ids = form.getAll('lesson_ids').map(String);
		if (!topicId || ids.length === 0) return fail(400, { message: 'No new order was submitted.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/topics/{id}/lessons/order',
			{ params: { path: { id: topicId } }, body: { lesson_ids: ids } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not reorder the lessons.')
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
	},

	postAnnouncement: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const body = String(form.get('body') ?? '').trim();
		if (!title || !body) {
			return fail(400, { announcementMessage: 'An announcement needs a title and a body.' });
		}

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/announcements',
			{ params: { path: { slug: params.slug } }, body: { title, body } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				announcementMessage: problemMessage(problem, 'Could not post that announcement.')
			});
		}
		return { announcementPosted: true };
	},

	deleteAnnouncement: async ({ request, locals, url }) => {
		guard(locals.accessToken);

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/announcements/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				announcementMessage: problemMessage(problem, 'Could not remove that announcement.')
			});
		}
	}
};
