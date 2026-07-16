import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { aiEnabled, imageEnabled } from '$lib/server/ai';
import { authedApi } from '$lib/server/api';
import {
	announcementSchema,
	cohortSchema,
	lessonSchema,
	prerequisiteSchema,
	previewSchema,
	priceSchema,
	renameSectionSchema,
	sectionSchema
} from '$lib/schemas';
import { parseForm } from '$lib/validation';
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
		api.GET('/v1/courses/{slug}/analytics', { params: { path: { slug: params.slug } } }),

		// Whether this workspace can be paid at all. A 503 means the deployment takes
		// no payments, and the section says so rather than offering a button that fails.
		api.GET('/v1/billing/account', { params: { query: { gateway: 'fake' } } })
	]);

	await parent();
	const [prerequisites, mine, templates, courseTemplate, announcements, analytics, account] =
		await rest;

	// Every other course in the workspace, so the author picks a prerequisite from
	// a list rather than typing a slug and finding out later that they mistyped it.
	const candidates = (mine.data?.courses ?? []).filter((c) => c.slug !== params.slug);

	// `course`, `topics` and `lessonCount` come from the layout.
	return {
		aiEnabled: aiEnabled(),
		imageEnabled: imageEnabled(),
		prerequisites: prerequisites.data?.prerequisites ?? [],
		candidates,

		// The certificate template picker. `null` template_id is the built-in default.
		certificateTemplates: templates.data?.templates ?? [],
		currentTemplateId: courseTemplate.data?.template_id ?? null,

		announcements: announcements.data?.announcements ?? [],
		analytics: analytics.data ?? null,

		// The payment account, and nothing invented: absent means this workspace has
		// not connected one, or this deployment sells nothing at all.
		account: account.data?.account ?? null
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

		const parsed = parseForm(sectionSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'addTopic', errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/topics',
			{ params: { path: { slug: params.slug } }, body: { title: parsed.value.title } }
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

		// Every section has a rename box, so the refusal names the one it came from.
		const parsed = parseForm(renameSectionSchema, form);
		if (!parsed.ok) {
			return fail(400, { scope: 'rename', topicId: id, errors: parsed.errors });
		}

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/topics/{id}',
			{ params: { path: { id } }, body: { title: parsed.value.title } }
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
	 * muallim-api requires every sibling named exactly once, and the client sends
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

		// Likewise: one "add a lesson" box per section, so the refusal names its section.
		const parsed = parseForm(lessonSchema, form);
		if (!parsed.ok) {
			return fail(400, { scope: 'addLesson', topicId, errors: parsed.errors });
		}

		// A new lesson starts as text with no video. muallim-api defaults to exactly
		// this, but the generated client requires both fields, and stating them is
		// clearer than relying on a default that lives in another repository.
		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/topics/{id}/lessons',
			{
				params: { path: { id: topicId } },
				body: { title: parsed.value.title, content_type: 'text', video_source: 'none' }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not add that lesson.')
			});
		}
	},

	/**
	 * Create a whole AI-drafted outline: each section, then its lessons, through the
	 * same endpoints the manual editor uses — so muallim-api validates every row, and a
	 * half-created section (topic saved, a lesson rejected) leaves the rest intact.
	 * Lessons start as empty text; the author fills each in (with AI, if they like).
	 */
	addOutline: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		let outline: unknown;
		try {
			outline = JSON.parse(String((await request.formData()).get('outline') ?? '[]'));
		} catch {
			return fail(400, { message: 'The outline could not be read.' });
		}
		if (!Array.isArray(outline) || outline.length === 0) {
			return fail(400, { message: 'No sections to add.' });
		}

		const api = authedApi(url.origin, locals.accessToken);
		let topics = 0;
		let lessons = 0;

		for (const section of outline as Array<{ title?: string; lessons?: unknown }>) {
			const title = String(section.title ?? '').trim();
			if (!title) continue;

			const { data, error: topicErr } = await api.POST('/v1/courses/{slug}/topics', {
				params: { path: { slug: params.slug } },
				body: { title }
			});
			const topicId = data?.topic?.id;
			if (topicErr || !topicId) continue;
			topics++;

			const list = Array.isArray(section.lessons) ? section.lessons : [];
			for (const raw of list) {
				const lessonTitle = String(
					(typeof raw === 'string' ? raw : (raw as { title?: string })?.title) ?? ''
				).trim();
				if (!lessonTitle) continue;

				const { error: lessonErr } = await api.POST('/v1/topics/{id}/lessons', {
					params: { path: { id: topicId } },
					body: { title: lessonTitle, content_type: 'text', video_source: 'none' }
				});
				if (!lessonErr) lessons++;
			}
		}

		return { outlineTopics: topics, outlineLessons: lessons };
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

	/** The preview clip a stranger watches. muallim-api resolves the link to a player. */
	/** Connect this workspace's payment account. The school is the merchant, not us. */
	connectPayments: async ({ locals, url }) => {
		guard(locals.accessToken);

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/billing/connect', {
			body: { gateway: 'fake', return_url: `${url.origin}${url.pathname}` }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not connect a payment account.')
			});
		}

		// The gateway's own onboarding. Nothing about a bank account touches this app.
		redirect(303, data.url);
	},

	/** Price the course, or make it free again. */
	setPrice: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const api = authedApi(url.origin, locals.accessToken);

		// A blank amount is not a price of nothing — it is the course going free.
		if (String(form.get('amount') ?? '').trim() === '') {
			const { error: problem, response } = await api.DELETE('/v1/courses/{slug}/price', {
				params: { path: { slug: params.slug } }
			});
			if (problem) {
				return fail(response?.status ?? 500, {
					message: problemMessage(problem, 'Could not make that course free.')
				});
			}
			return { priceSaved: true };
		}

		const parsed = parseForm(priceSchema, form);
		if (!parsed.ok) return fail(400, { scope: 'price', errors: parsed.errors });

		const { amount, currency } = parsed.value;

		// Minor units on the wire, always. The author types 1200; the API is told 120000.
		const { error: problem, response } = await api.PUT('/v1/courses/{slug}/price', {
			params: { path: { slug: params.slug } },
			body: {
				amount_minor: Math.round(amount * 100),
				currency: currency.toUpperCase(),
				gateway: 'fake'
			}
		});

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not price that course.')
			});
		}

		return { priceSaved: true };
	},

	/**
	 * Sign a URL for the course thumbnail. The browser PUTs the image to it, then
	 * confirms — same three-step flow an assignment file uses, and for the same
	 * reason: the bytes never pass through this server or the API, and the access
	 * token stays in its httpOnly cookie.
	 */
	presignImage: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const contentType = String(form.get('content_type') ?? '');
		const bytes = Number(form.get('bytes'));

		if (!Number.isSafeInteger(bytes) || bytes < 1) {
			return fail(422, { scope: 'image', message: 'That image could not be read.' });
		}

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/courses/{slug}/image/uploads', {
			params: { path: { slug: params.slug } },
			body: { content_type: contentType as 'image/png' | 'image/jpeg' | 'image/webp', bytes }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				scope: 'image',
				message: problemMessage(problem, 'That image could not be uploaded.')
			});
		}

		return { imageUpload: data };
	},

	/** Record a thumbnail now in the bucket. The API verifies it before writing. */
	confirmImage: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const key = String((await request.formData()).get('key') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/courses/{slug}/image',
			{ params: { path: { slug: params.slug } }, body: { key } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				scope: 'image',
				message: problemMessage(problem, 'That image could not be saved.')
			});
		}

		return { imageSaved: true };
	},

	setPreview: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const parsed = parseForm(previewSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'preview', errors: parsed.errors });

		const { preview_source, preview_url } = parsed.value;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/courses/{slug}',
			{
				params: { path: { slug: params.slug } },
				body: { preview_source, preview_url: preview_source === 'none' ? '' : preview_url }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not set that preview.')
			});
		}

		return { previewSaved: true };
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

		const parsed = parseForm(prerequisiteSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'prerequisite', errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/prerequisites',
			{
				params: { path: { slug: params.slug } },
				body: { requires_slug: parsed.value.requires_slug }
			}
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

	/*
		Enrol a pasted cohort. The addresses are already split, trimmed, lower-cased and
		de-duplicated by the schema — the same list the page counted — and muallim-api
		reports a line for every one of them. It creates no accounts: an address nobody
		in the workspace holds comes back `not_a_member` and is skipped.
	*/
	importCohort: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const parsed = parseForm(cohortSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'cohort', errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/enrolments/import',
			{
				params: { path: { slug: params.slug } },
				body: { emails: parsed.value.emails }
			}
		);

		// A 422 says why — an empty list, or more than 500 — so its sentence is shown.
		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not import that cohort.')
			});
		}

		return { imported: data };
	},

	postAnnouncement: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const parsed = parseForm(announcementSchema, await request.formData());
		if (!parsed.ok) return fail(400, { scope: 'announcement', errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses/{slug}/announcements',
			{
				params: { path: { slug: params.slug } },
				body: { title: parsed.value.title, body: parsed.value.body }
			}
		);

		// A failure of the call, not of a field: it stays the page's voice.
		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not post that announcement.')
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
				message: problemMessage(problem, 'Could not remove that announcement.')
			});
		}
	}
};
