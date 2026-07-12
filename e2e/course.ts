import { expect, type APIRequestContext } from '@playwright/test';
import { OWNER, STUDENT } from './accounts';

export interface Course {
	slug: string;
	title: string;
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
let cachedStudentToken: string | undefined;

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
 * The owner's bearer, cached across the worker. Specs that call the API as the
 * owner use this rather than logging in again: each Argon2id verification is slow
 * by design and a fresh login per test trips the auth rate limiter under the full
 * suite.
 */
export async function ownerToken(request: APIRequestContext): Promise<string> {
	return bearer(request);
}

/** The student's bearer, cached for the same reason the owner's is. */
async function studentBearer(request: APIRequestContext): Promise<string> {
	if (cachedStudentToken) return cachedStudentToken;

	const response = await request.post('/api/v1/auth/login', {
		data: { email: STUDENT.email, password: STUDENT.password }
	});
	expect(response.ok(), 'the student should exist by now; the setup project creates them').toBe(
		true
	);

	const { tokens } = await response.json();
	cachedStudentToken = tokens.access_token as string;
	return cachedStudentToken;
}

/**
 * Builds a published course with one preview lesson and one gated lesson,
 * through the API, and returns the ids a test needs to address them.
 *
 * Each spec makes its own, under a slug nobody else uses. These tests share a
 * workspace — muallim-api resolves it from the Host header, and there is one host —
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

	return { slug, title: `Course ${slug}`, previewLessonId, gatedLessonId };
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

export interface QuizCourse {
	slug: string;
	lessonId: string;
	/** Has the student enrol, take the quiz, and submit it. */
	studentAttempt: (request: APIRequestContext) => Promise<void>;
}

/**
 * A published course with one quiz lesson.
 *
 * The quiz has a single-choice question worth 3 and a short answer worth 2,
 * against a 60% bar — so answering only the first is exactly a pass. With
 * `essay: true` it also has a ten-point essay, which nothing but a person can
 * grade.
 */
export async function quizCourse(
	request: APIRequestContext,
	slug: string,
	options: { essay?: boolean; withQuiz?: boolean } = {}
): Promise<QuizCourse> {
	const { essay = false, withQuiz = true } = options;

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

	const lesson = await request.post(`/api/v1/topics/${topicId}/lessons`, {
		headers: auth,
		data: { title: 'The quiz', content_type: 'quiz', video_source: 'none' }
	});
	expect(lesson.ok(), `add lesson: ${lesson.status()} ${await lesson.text()}`).toBe(true);
	const lessonId = (await lesson.json()).lesson.id as string;

	const publish = await request.post(`/api/v1/courses/${slug}/publish`, { headers: auth });
	expect(publish.ok(), `publish: ${publish.status()} ${await publish.text()}`).toBe(true);

	if (!withQuiz) {
		return { slug, lessonId, studentAttempt: async () => {} };
	}

	const quiz = await request.post(`/api/v1/lessons/${lessonId}/quiz`, {
		headers: auth,
		data: { title: 'Chapter one', passing_percent: 60 }
	});
	expect(quiz.ok(), `create quiz: ${quiz.status()} ${await quiz.text()}`).toBe(true);

	const question = async (data: Record<string, unknown>) => {
		const response = await request.post(`/api/v1/lessons/${lessonId}/quiz/questions`, {
			headers: auth,
			data
		});
		expect(response.ok(), `add question: ${response.status()} ${await response.text()}`).toBe(true);
		return (await response.json()).question;
	};

	const choice = await question({
		type: 'single_choice',
		prompt: 'Which is compiled?',
		points: 3,
		explanation: 'Because it is compiled.',
		options: [{ content: 'Python' }, { content: 'Go', is_correct: true }]
	});

	await question({
		type: 'short_answer',
		prompt: 'Roman name for Paris?',
		points: 2,
		accepted: [['Lutetia']]
	});

	if (essay) {
		await question({ type: 'open_ended', prompt: 'Why?', points: 10 });
	}

	const rightOption = choice.options.find((o: { is_correct: boolean }) => o.is_correct)
		.id as string;

	return {
		slug,
		lessonId,

		async studentAttempt(request: APIRequestContext) {
			const studentToken = await studentBearer(request);
			const headers = { Authorization: `Bearer ${studentToken}` };

			const enrolled = await request.post(`/api/v1/courses/${slug}/enrol`, { headers });
			expect(enrolled.ok(), `enrol: ${enrolled.status()}`).toBe(true);

			const started = await request.post(`/api/v1/lessons/${lessonId}/quiz/attempts`, { headers });
			expect(started.ok(), `start: ${started.status()}`).toBe(true);

			// Everything the machine can grade, answered rightly: 5 of 15. Only the
			// essay stands between this attempt and a settled score.
			const answers: Array<[string, unknown]> = [[choice.id, { choices: [rightOption] }]];
			const quizView = await request.get(`/api/v1/lessons/${lessonId}/quiz`, { headers });
			expect(quizView.ok()).toBe(true);

			for (const q of (await quizView.json()).quiz.questions) {
				if (q.type === 'short_answer') answers.push([q.id, { text: 'Lutetia' }]);
				if (q.type === 'open_ended') answers.push([q.id, { text: 'Because errors are values.' }]);
			}

			for (const [questionId, response] of answers) {
				const saved = await request.put(
					`/api/v1/lessons/${lessonId}/quiz/attempts/current/answers/${questionId}`,
					{ headers, data: { response } }
				);
				expect(saved.ok(), `answer: ${saved.status()} ${await saved.text()}`).toBe(true);
			}

			const submitted = await request.post(
				`/api/v1/lessons/${lessonId}/quiz/attempts/current/submit`,
				{ headers }
			);
			expect(submitted.ok(), `submit: ${submitted.status()}`).toBe(true);

			// Wait for the worker. The marking queue only holds attempts it has reached.
			await expect
				.poll(
					async () => {
						const attempt = await request.get(`/api/v1/lessons/${lessonId}/quiz/attempts/1`, {
							headers
						});
						return (await attempt.json()).attempt.status;
					},
					{ timeout: 15_000 }
				)
				.toBe('awaiting_review');
		}
	};
}

export interface AssignmentCourse {
	slug: string;
	lessonId: string;
}

/**
 * A published course whose one lesson carries a file assignment, with the
 * student already enrolled.
 *
 * Enrolled through the API rather than through the page: this fixture exists so
 * an upload test can start at the upload, and clicking "Enrol" first is the
 * enrolment test's job.
 */
export async function assignmentCourse(
	request: APIRequestContext,
	slug: string,
	assignment: Record<string, unknown> = {}
): Promise<AssignmentCourse> {
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

	const lesson = await request.post(`/api/v1/topics/${topicId}/lessons`, {
		headers: auth,
		data: { title: 'The assignment', content_type: 'assignment', video_source: 'none' }
	});
	expect(lesson.ok(), `add lesson: ${lesson.status()} ${await lesson.text()}`).toBe(true);
	const lessonId = (await lesson.json()).lesson.id as string;

	const created = await request.post(`/api/v1/lessons/${lessonId}/assignment`, {
		headers: auth,
		data: {
			title: 'Essay: the House of Wisdom',
			instructions: 'Describe one translation made there, and why it mattered.',
			points: 100,
			passing_points: 60,
			max_files: 2,
			max_bytes: 1048576,
			allow_late: true,
			...assignment
		}
	});
	expect(created.ok(), `create assignment: ${created.status()} ${await created.text()}`).toBe(true);

	const publish = await request.post(`/api/v1/courses/${slug}/publish`, { headers: auth });
	expect(publish.ok(), `publish: ${publish.status()} ${await publish.text()}`).toBe(true);

	const enrol = await request.post(`/api/v1/courses/${slug}/enrol`, {
		headers: { Authorization: `Bearer ${await studentBearer(request)}` }
	});
	expect(enrol.ok(), `enrol: ${enrol.status()} ${await enrol.text()}`).toBe(true);

	return { slug, lessonId };
}
