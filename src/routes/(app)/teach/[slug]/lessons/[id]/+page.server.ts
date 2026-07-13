import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { aiEnabled } from '$lib/server/ai';
import { authedApi } from '$lib/server/api';
import { lessonEditSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

const CONTENT_TYPES = ['text', 'video', 'quiz', 'assignment', 'live', 'scorm', 'h5p'] as const;
const VIDEO_SOURCES = ['none', 'youtube', 'vimeo', 'embed', 'hosted'] as const;

type ContentType = (typeof CONTENT_TYPES)[number];
type VideoSource = (typeof VIDEO_SOURCES)[number];

/** Narrows a submitted enum rather than asserting it: a form field is user input. */
function oneOf<T extends string>(allowed: readonly T[], value: string, fallback: T): T {
	return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * The author reads the lesson through the same endpoint a learner does. muallim-api
 * answers with `access: "author"` and the full body, because entitlement is
 * decided there and not here.
 */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);

	// The curriculum carries the course's drip mode and this lesson's stored
	// schedule; the content endpoint carries the body. Neither depends on the
	// other.
	const [content, tree] = await Promise.all([
		api.GET('/v1/lessons/{id}/content', { params: { path: { id: params.id } } }),
		api.GET('/v1/courses/{slug}', { params: { path: { slug: params.slug } } })
	]);

	if (content.error || !content.data) {
		error(
			content.response?.status ?? 500,
			problemMessage(content.error, 'That lesson could not be loaded.')
		);
	}

	const scheduled = (tree.data?.topics ?? [])
		.flatMap((t) => t.lessons ?? [])
		.find((l) => l.id === params.id);

	return {
		lesson: content.data.lesson,
		slug: params.slug,
		aiEnabled: aiEnabled(),
		courseTitle: tree.data?.course.title ?? '',
		dripMode: tree.data?.course.drip_mode ?? 'none',

		// The stored schedule, not the reader's computed unlock date. An author edits
		// what is written down.
		availableAt: scheduled?.available_at ?? null,
		availableAfterDays: scheduled?.available_after_days ?? null
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();

		const parsed = parseForm(lessonEditSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const contentType: ContentType = oneOf(
			CONTENT_TYPES,
			String(form.get('content_type') ?? ''),
			'text'
		);
		const videoSource: VideoSource = oneOf(
			VIDEO_SOURCES,
			String(form.get('video_source') ?? ''),
			'none'
		);

		// Read only in the mode that shows them. A PATCH omitting a field leaves the
		// column alone, so an author editing a sequential course cannot silently wipe
		// the dates they will want back when they switch modes again.
		const dripMode = String(form.get('drip_mode') ?? 'none');

		const availableAt =
			dripMode === 'scheduled' && parsed.value.available_at
				? new Date(parsed.value.available_at).toISOString()
				: undefined;

		const availableAfterDays =
			dripMode === 'after_enrolment' ? parsed.value.available_after_days : undefined;

		// Every field the form owns is sent, so this PATCH is a complete statement of
		// what the author last saw and edited. Sending a subset would let a field
		// the form renders but omits keep a value nobody can see — and sending an
		// empty `content` from a form that never showed it would erase the lesson.
		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/lessons/{id}',
			{
				params: { path: { id: params.id } },
				body: {
					title: parsed.value.title,
					content: parsed.value.content,
					content_type: contentType,
					video_source: videoSource,
					video_url: parsed.value.video_url,
					duration_seconds: parsed.value.duration_seconds,
					is_preview: form.get('is_preview') === 'on',
					...(availableAt !== undefined ? { available_at: availableAt } : {}),
					...(availableAfterDays !== undefined ? { available_after_days: availableAfterDays } : {})
				}
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not save that lesson.')
			});
		}

		redirect(303, `/teach/${params.slug}`);
	}
};
