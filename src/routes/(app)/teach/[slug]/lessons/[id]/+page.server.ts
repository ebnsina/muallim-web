import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
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
 * The author reads the lesson through the same endpoint a learner does. lms-api
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
		const title = String(form.get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'A lesson needs a title.' });

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

		// Sent only in the mode that reads it. A PATCH omitting a field leaves the
		// column alone, so an author editing a sequential course cannot silently wipe
		// the dates they will want back when they switch modes again.
		const dripMode = String(form.get('drip_mode') ?? 'none');

		const availableAtRaw = String(form.get('available_at') ?? '').trim();
		const availableAt =
			dripMode === 'scheduled' && availableAtRaw !== ''
				? new Date(availableAtRaw).toISOString()
				: undefined;

		const afterDaysRaw = String(form.get('available_after_days') ?? '').trim();
		const availableAfterDays =
			dripMode === 'after_enrolment' && afterDaysRaw !== '' ? Number(afterDaysRaw) : undefined;

		if (
			availableAfterDays !== undefined &&
			(!Number.isInteger(availableAfterDays) || availableAfterDays < 0)
		) {
			return fail(400, { message: 'Days after enrolling must be a whole number, zero or more.' });
		}
		if (availableAt !== undefined && Number.isNaN(Date.parse(availableAt))) {
			return fail(400, { message: 'That release date is not a date.' });
		}

		const durationRaw = String(form.get('duration_seconds') ?? '').trim();
		const duration = durationRaw === '' ? 0 : Number(durationRaw);
		if (!Number.isInteger(duration) || duration < 0) {
			return fail(400, { message: 'Duration must be a whole number of seconds.' });
		}

		// Every field the form owns is sent, so this PATCH is a complete statement of
		// what the author last saw and edited. Sending a subset would let a field
		// the form renders but omits keep a value nobody can see — and sending an
		// empty `content` from a form that never showed it would erase the lesson.
		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/lessons/{id}',
			{
				params: { path: { id: params.id } },
				body: {
					title,
					content: String(form.get('content') ?? ''),
					content_type: contentType,
					video_source: videoSource,
					video_url: String(form.get('video_url') ?? '').trim(),
					duration_seconds: duration,
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
