import { describe, expect, it } from 'vitest';
import { lessonTitle, lessonTrail, teachTrail } from './breadcrumbs';

const topics = [
	{ lessons: [{ id: 'a', title: 'An introduction' }] },
	{ lessons: [{ id: 'b', title: 'The method' }] },
	{ lessons: [] },
	{}
];

describe('lessonTitle', () => {
	it('finds a lesson in any section', () => {
		expect(lessonTitle(topics, 'a')).toBe('An introduction');
		expect(lessonTitle(topics, 'b')).toBe('The method');
	});

	/*
		A lesson the curriculum does not list. It happens: an author deletes a lesson
		in another tab, and the id in this URL now names nothing.

		"Lesson" and not an empty string — a trail that renders `Optics › › Quiz`
		looks broken — and not the uuid, which is true and useless.
	*/
	it('names an unknown lesson rather than rendering a hole', () => {
		expect(lessonTitle(topics, 'gone')).toBe('Lesson');
		expect(lessonTitle([], 'gone')).toBe('Lesson');
	});

	// A section with no lessons, and a section whose lessons the API omitted, are
	// both things the curriculum endpoint really returns.
	it('steps over an empty or absent section', () => {
		expect(() => lessonTitle(topics, 'anything')).not.toThrow();
	});
});

describe('lessonTrail', () => {
	it('walks from the catalog down to the lesson', () => {
		expect(lessonTrail('optics', 'The Book of Optics', 'lid', 'Refraction')).toEqual([
			{ label: 'Courses', href: '/courses' },
			{ label: 'The Book of Optics', href: '/courses/optics' },
			{ label: 'Refraction', href: '/courses/optics/lessons/lid' }
		]);
	});

	it('appends whatever the page adds below the lesson', () => {
		const trail = lessonTrail('optics', 'Optics', 'lid', 'Refraction', {
			label: 'Quiz',
			href: '/courses/optics/lessons/lid/quiz'
		});

		expect(trail).toHaveLength(4);
		expect(trail.at(-1)).toEqual({ label: 'Quiz', href: '/courses/optics/lessons/lid/quiz' });
	});

	/*
		Every crumb carries an href, including the last. `Breadcrumbs` is what drops it
		from the current page, so no caller has to remember to — and a caller that
		builds a trail for a different purpose still gets a complete one.
	*/
	it('leaves the href on the last crumb for the component to strip', () => {
		const trail = lessonTrail('optics', 'Optics', 'lid', 'Refraction');
		expect(trail.at(-1)?.href).toBe('/courses/optics/lessons/lid');
	});
});

describe('teachTrail', () => {
	// The same shape, rooted at the author's own list rather than the catalog. An
	// author dropped into /courses from /teach has lost their way back.
	it('roots the trail at Teach, not Courses', () => {
		const trail = teachTrail('optics', 'Optics', 'lid', 'Refraction');

		expect(trail[0]).toEqual({ label: 'Teach', href: '/teach' });
		expect(trail[1].href).toBe('/teach/optics');
		expect(trail[2].href).toBe('/teach/optics/lessons/lid');
	});
});
