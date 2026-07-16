import { z } from 'zod';
import {
	Attachment01Icon,
	File01Icon,
	HelpCircleIcon,
	PlayCircleIcon,
	Task01Icon
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/svelte';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	The Course Builder's own model. It is a *design* of a course — modules and the
	lessons inside them — and it is the whole of what lives in a blueprint's
	`structure`, which muallim-api stores as opaque JSON (`unknown` on the wire). So
	the shape is defined and defended here rather than trusted: a blueprint read
	back could carry anything, and `parseStructure` is what turns anything into the
	five kinds this UI can draw.
*/

/** The kinds a lesson can be. muallim-api stores the string as-is; these are ours. */
export const LESSON_KINDS = ['video', 'text', 'quiz', 'assignment', 'file'] as const;
export type LessonKind = (typeof LESSON_KINDS)[number];

export interface Lesson {
	id: string;
	title: string;
	kind: LessonKind;
	notes: string;
}

export interface Module {
	id: string;
	title: string;
	lessons: Lesson[];
}

/** A blueprint's `structure` is an ordered list of modules. */
export type Structure = Module[];

/** The wire view, narrowed from the generated schema (`structure` is `unknown`). */
type BlueprintView = components['schemas']['BlueprintView'];

export interface Blueprint {
	id: string;
	name: string;
	description: string;
	structure: Structure;
	createdAt: string;
	updatedAt: string;
}

/** Label, icon, and badge tone for each kind — one place the whole UI reads. */
export const KIND_META: Record<
	LessonKind,
	{ label: string; icon: IconSvgElement; tone: BadgeTone }
> = {
	video: { label: 'Video', icon: PlayCircleIcon, tone: 'accent' },
	text: { label: 'Reading', icon: File01Icon, tone: 'neutral' },
	quiz: { label: 'Quiz', icon: HelpCircleIcon, tone: 'warning' },
	assignment: { label: 'Assignment', icon: Task01Icon, tone: 'success' },
	file: { label: 'File', icon: Attachment01Icon, tone: 'neutral' }
};

/** True for a value this UI can draw. Anything else is coerced to `text`. */
function isLessonKind(value: unknown): value is LessonKind {
	return typeof value === 'string' && (LESSON_KINDS as readonly string[]).includes(value);
}

/** A fresh id. `crypto.randomUUID` so a module and its lessons never collide. */
export function newId(): string {
	return crypto.randomUUID();
}

export function newLesson(title = '', kind: LessonKind = 'video', notes = ''): Lesson {
	return { id: newId(), title: title.trim(), kind, notes: notes.trim() };
}

export function newModule(title = 'Untitled module'): Module {
	return { id: newId(), title: title.trim() || 'Untitled module', lessons: [] };
}

/*
	Turn whatever came back from the API into a Structure this UI can trust.

	A blueprint's structure is opaque JSON, so every field is validated and a
	missing id is minted rather than left blank — two lessons with no id would be
	the same drag target. An entry that is not an object is dropped, not guessed.
*/
export function parseStructure(raw: unknown): Structure {
	if (!Array.isArray(raw)) return [];

	const modules: Structure = [];
	for (const entry of raw) {
		if (typeof entry !== 'object' || entry === null) continue;
		const m = entry as Record<string, unknown>;

		const lessonsRaw = Array.isArray(m.lessons) ? m.lessons : [];
		const lessons: Lesson[] = [];
		for (const l of lessonsRaw) {
			if (typeof l !== 'object' || l === null) continue;
			const lesson = l as Record<string, unknown>;
			lessons.push({
				id: typeof lesson.id === 'string' && lesson.id ? lesson.id : newId(),
				title: typeof lesson.title === 'string' ? lesson.title : '',
				kind: isLessonKind(lesson.kind) ? lesson.kind : 'text',
				notes: typeof lesson.notes === 'string' ? lesson.notes : ''
			});
		}

		modules.push({
			id: typeof m.id === 'string' && m.id ? m.id : newId(),
			title: typeof m.title === 'string' ? m.title : '',
			lessons
		});
	}
	return modules;
}

/** Adapt a wire blueprint into the editor's model. */
export function toBlueprint(view: BlueprintView): Blueprint {
	return {
		id: view.id,
		name: view.name,
		description: view.description ?? '',
		structure: parseStructure(view.structure),
		createdAt: view.created_at,
		updatedAt: view.updated_at
	};
}

// --- Immutable structure edits. Each returns a new array; none mutates its input.

/** Move an item to a new index, clamped. Returns a new array. */
function moveItem<T>(items: T[], from: number, to: number): T[] {
	if (from < 0 || from >= items.length) return items;
	const clamped = Math.max(0, Math.min(items.length - 1, to));
	if (from === clamped) return items;

	const next = items.slice();
	const [item] = next.splice(from, 1);
	next.splice(clamped, 0, item);
	return next;
}

export function addModule(structure: Structure, title?: string): Structure {
	return [...structure, newModule(title)];
}

export function renameModule(structure: Structure, moduleId: string, title: string): Structure {
	return structure.map((m) => (m.id === moduleId ? { ...m, title } : m));
}

export function removeModule(structure: Structure, moduleId: string): Structure {
	return structure.filter((m) => m.id !== moduleId);
}

/** Reorder a module by index — the drag target. */
export function moveModule(structure: Structure, from: number, to: number): Structure {
	return moveItem(structure, from, to);
}

/** Nudge a module one step — the keyboard control beside the handle. */
export function moveModuleBy(structure: Structure, moduleId: string, delta: number): Structure {
	const from = structure.findIndex((m) => m.id === moduleId);
	return from === -1 ? structure : moveItem(structure, from, from + delta);
}

export function addLesson(structure: Structure, moduleId: string, lesson: Lesson): Structure {
	return structure.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m));
}

export function updateLesson(
	structure: Structure,
	moduleId: string,
	lessonId: string,
	patch: Partial<Omit<Lesson, 'id'>>
): Structure {
	return structure.map((m) =>
		m.id === moduleId
			? {
					...m,
					lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l))
				}
			: m
	);
}

export function removeLesson(structure: Structure, moduleId: string, lessonId: string): Structure {
	return structure.map((m) =>
		m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
	);
}

/** Reorder a lesson inside one module by index. */
export function moveLessonWithin(
	structure: Structure,
	moduleId: string,
	from: number,
	to: number
): Structure {
	return structure.map((m) =>
		m.id === moduleId ? { ...m, lessons: moveItem(m.lessons, from, to) } : m
	);
}

/** Nudge a lesson one step within its module — the keyboard control. */
export function moveLessonBy(
	structure: Structure,
	moduleId: string,
	lessonId: string,
	delta: number
): Structure {
	const mod = structure.find((m) => m.id === moduleId);
	if (!mod) return structure;
	const from = mod.lessons.findIndex((l) => l.id === lessonId);
	return from === -1 ? structure : moveLessonWithin(structure, moduleId, from, from + delta);
}

/*
	Move a lesson out of one module and into another at a given index.

	Cross-module drag is supported: the lesson is spliced from its source and
	inserted into the target in one pass, so it can never exist in both or neither.
	A drop onto the same module falls through to a within-module reorder.
*/
export function moveLessonAcross(
	structure: Structure,
	fromModuleId: string,
	lessonId: string,
	toModuleId: string,
	toIndex: number
): Structure {
	const source = structure.find((m) => m.id === fromModuleId);
	const lesson = source?.lessons.find((l) => l.id === lessonId);
	if (!source || !lesson) return structure;

	if (fromModuleId === toModuleId) {
		const from = source.lessons.findIndex((l) => l.id === lessonId);
		return moveLessonWithin(structure, toModuleId, from, toIndex);
	}

	return structure.map((m) => {
		if (m.id === fromModuleId) {
			return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) };
		}
		if (m.id === toModuleId) {
			const next = m.lessons.slice();
			next.splice(Math.max(0, Math.min(next.length, toIndex)), 0, lesson);
			return { ...m, lessons: next };
		}
		return m;
	});
}

/** Totals for the header — lessons across every module. */
export function lessonCount(structure: Structure): number {
	return structure.reduce((sum, m) => sum + m.lessons.length, 0);
}

/*
	The blueprint's own fields. muallim-api requires only a name; the bounds here are
	this UI's, kept clear of the server's so a form never offers what the API
	refuses. Description is optional and trimmed to empty rather than left blank.
*/
export const BLUEPRINT_LIMITS = {
	name: { required: true, maxlength: 200 },
	description: { maxlength: 2000 }
} as const;

export const blueprintSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Give the course plan a name.')
		.max(BLUEPRINT_LIMITS.name.maxlength, 'That name is too long.'),
	description: z
		.string()
		.trim()
		.max(BLUEPRINT_LIMITS.description.maxlength, 'That description is too long.')
		.optional()
		.default('')
});

export type BlueprintInput = z.infer<typeof blueprintSchema>;
