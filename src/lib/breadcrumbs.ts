import { resolve } from '$app/paths';
import type { Crumb } from '$lib/components/Breadcrumbs.svelte';

/** As much of a lesson as a breadcrumb needs. */
interface Lesson {
	id: string;
	title: string;
}

interface Topic {
	// `null`, not just absent: that is what the generated client says the curriculum
	// endpoint may return for a section with nothing in it.
	lessons?: Lesson[] | null;
}

/**
 * A lesson's title, from the curriculum the layout loaded.
 *
 * A nested page — a quiz, an assignment, a marking queue — knows a lesson id from
 * its own URL and nothing else about it. The curriculum is already in hand.
 *
 * Falls back to "Lesson" rather than to an empty crumb or a raw uuid. A trail
 * that renders `Optics › › Quiz` looks broken, and one that renders a uuid tells
 * the reader something true and useless.
 */
export function lessonTitle(topics: Topic[], lessonId: string): string {
	for (const topic of topics) {
		for (const lesson of topic.lessons ?? []) {
			if (lesson.id === lessonId) return lesson.title;
		}
	}
	return 'Lesson';
}

/**
 * The trail down to a lesson, on the learner's side.
 *
 * `rest` is appended below the lesson: a quiz, an attempt, an assignment. Every
 * crumb here carries an `href`, including the one the caller is standing on —
 * `Breadcrumbs` drops it from the last one, so no caller has to remember.
 *
 * Through `resolve`, like every other link in this app. The base path is empty
 * today, and a hardcoded `/courses` is a link that breaks quietly the day it is not.
 */
export function lessonTrail(
	slug: string,
	courseTitle: string,
	lessonId: string,
	lesson: string,
	...rest: Crumb[]
): Crumb[] {
	return [
		{ label: 'Courses', href: resolve('/courses') },
		{ label: courseTitle, href: resolve(`/courses/${slug}`) },
		{ label: lesson, href: resolve(`/courses/${slug}/lessons/${lessonId}`) },
		...rest
	];
}

/** The same, under `/teach`, where the top of the trail is the author's own list. */
export function teachTrail(
	slug: string,
	courseTitle: string,
	lessonId: string,
	lesson: string,
	...rest: Crumb[]
): Crumb[] {
	return [
		{ label: 'Teach', href: resolve('/teach') },
		{ label: courseTitle, href: resolve(`/teach/${slug}`) },
		{ label: lesson, href: resolve(`/teach/${slug}/lessons/${lessonId}`) },
		...rest
	];
}
