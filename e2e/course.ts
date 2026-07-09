import { expect, type APIRequestContext } from '@playwright/test';
import { OWNER } from './accounts';

export interface Course {
	slug: string;
	previewLessonId: string;
	gatedLessonId: string;
}

/**
 * Cached for the life of the worker process. Every sign-in costs an Argon2id
 * verification, which is slow by design; re-authenticating for each fixture made
 * the suite slower than the pages it tests.
 *
 * The access token lives fifteen minutes, comfortably longer than a run.
 */
let cachedToken: string | undefined;

async function bearer(request: APIRequestContext): Promise<string> {
	if (cachedToken) return cachedToken;

	const response = await request.post('/api/v1/auth/login', {
		data: { email: OWNER.email, password: OWNER.password }
	});
	expect(response.ok(), 'the owner should exist by now; the setup project creates them').toBe(true);

	const { tokens } = await response.json();
	cachedToken = tokens.access_token as string;
	return cachedToken;
}

/**
 * Builds a published course with one preview lesson and one gated lesson,
 * through the API, and returns the ids a test needs to address them.
 *
 * Each spec makes its own, under a slug nobody else uses. These tests share a
 * workspace — lms-api resolves it from the Host header, and there is one host —
 * so isolation is a naming discipline rather than a transaction.
 */
export async function publishedCourse(request: APIRequestContext, slug: string): Promise<Course> {
	const token = await bearer(request);
	const auth = { Authorization: `Bearer ${token}` };

	const course = await request.post('/api/v1/courses', {
		headers: auth,
		data: { slug, title: `Course ${slug}`, summary: 'Built by an end-to-end test.' }
	});
	expect(course.ok(), `create course: ${course.status()} ${await course.text()}`).toBe(true);

	const topic = await request.post(`/api/v1/courses/${slug}/topics`, {
		headers: auth,
		data: { title: 'Section one' }
	});
	expect(topic.ok()).toBe(true);
	const topicId = (await topic.json()).topic.id;

	const lesson = async (title: string, isPreview: boolean) => {
		const response = await request.post(`/api/v1/topics/${topicId}/lessons`, {
			headers: auth,
			data: {
				title,
				content: `The body of ${title}.`,
				content_type: 'text',
				video_source: 'none',
				is_preview: isPreview
			}
		});
		expect(response.ok(), `add lesson: ${response.status()} ${await response.text()}`).toBe(true);
		return (await response.json()).lesson.id as string;
	};

	const previewLessonId = await lesson('A free preview', true);
	const gatedLessonId = await lesson('Behind the paywall', false);

	const publish = await request.post(`/api/v1/courses/${slug}/publish`, { headers: auth });
	expect(publish.ok(), `publish: ${publish.status()} ${await publish.text()}`).toBe(true);

	return { slug, previewLessonId, gatedLessonId };
}

/** Creates a course and leaves it a draft. */
export async function draftCourse(request: APIRequestContext, slug: string): Promise<string> {
	const token = await bearer(request);

	const course = await request.post('/api/v1/courses', {
		headers: { Authorization: `Bearer ${token}` },
		data: { slug, title: `Draft ${slug}` }
	});
	expect(course.ok(), `create draft: ${course.status()} ${await course.text()}`).toBe(true);

	return slug;
}

/** Makes `requires` a prerequisite of `course`, through the API. */
export async function requirePrerequisite(
	request: APIRequestContext,
	slug: string,
	requiresSlug: string
): Promise<void> {
	const token = await bearer(request);

	const response = await request.post(`/api/v1/courses/${slug}/prerequisites`, {
		headers: { Authorization: `Bearer ${token}` },
		data: { requires_slug: requiresSlug }
	});
	expect(response.ok(), `add prerequisite: ${response.status()} ${await response.text()}`).toBe(
		true
	);
}

/** Sets how a course releases its lessons. */
export async function setDripMode(
	request: APIRequestContext,
	slug: string,
	mode: 'none' | 'scheduled' | 'after_enrolment' | 'sequential'
): Promise<void> {
	const token = await bearer(request);

	const response = await request.put(`/api/v1/courses/${slug}/drip`, {
		headers: { Authorization: `Bearer ${token}` },
		data: { mode }
	});
	expect(response.ok(), `set drip mode: ${response.status()} ${await response.text()}`).toBe(true);
}
