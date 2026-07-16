import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	The Certificate Designer's shared vocabulary — the element model, its sample
	text, and the pure functions the editor mutates a layout with. The API stores
	`layout` as opaque JSON (`unknown`), so this module is where that JSON is given
	a shape and defended: `normalizeLayout` is the only door untrusted layout comes
	through, and everything downstream may assume a clean `LayoutElement[]`.

	Deliberately self-contained: it does not touch the legacy certificate editor,
	`Certificate.svelte`, or `certificate-preview.ts`.
*/

/** The design as the API returns it. `layout` stays `unknown` until normalised. */
export type DesignView = components['schemas']['DesignView'];

export type Orientation = 'landscape' | 'portrait';
export type ElementKind = 'title' | 'learner' | 'course' | 'date' | 'serial' | 'signatory' | 'text';
export type Align = 'left' | 'center' | 'right';

/**
 * One text element on the certificate. `x`, `y`, `w`, and `fontSize` are all
 * fractions of the canvas, never pixels — so a layout renders identically at a
 * thumbnail's size and a full sheet's. `x`/`y` are the box's top-left corner,
 * `fontSize` is a fraction of the canvas width.
 */
export interface LayoutElement {
	id: string;
	kind: ElementKind;
	x: number;
	y: number;
	w: number;
	fontSize: number;
	fontWeight: number;
	color: string;
	align: Align;
	text: string;
}

interface KindSpec {
	kind: ElementKind;
	label: string;
	/** Authored kinds carry their own `text`; the rest render a live placeholder. */
	authored: boolean;
	sample: string;
	fontSize: number;
	fontWeight: number;
}

/** The palette, in the order it appears in the UI, with each kind's defaults. */
export const ELEMENT_KINDS: readonly KindSpec[] = [
	{
		kind: 'title',
		label: 'Title',
		authored: true,
		sample: 'Certificate of Completion',
		fontSize: 0.06,
		fontWeight: 700
	},
	{
		kind: 'learner',
		label: 'Learner',
		authored: false,
		sample: 'Ayesha Rahman',
		fontSize: 0.05,
		fontWeight: 600
	},
	{
		kind: 'course',
		label: 'Course',
		authored: false,
		sample: 'Introduction to Tajwid',
		fontSize: 0.035,
		fontWeight: 500
	},
	{
		kind: 'date',
		label: 'Date',
		authored: false,
		sample: '16 July 2026',
		fontSize: 0.022,
		fontWeight: 400
	},
	{
		kind: 'serial',
		label: 'Serial',
		authored: false,
		sample: 'MUAL-2026-000123',
		fontSize: 0.02,
		fontWeight: 400
	},
	{
		kind: 'signatory',
		label: 'Signatory',
		authored: true,
		sample: 'Ustadh Imran Ali',
		fontSize: 0.028,
		fontWeight: 500
	},
	{
		kind: 'text',
		label: 'Free text',
		authored: true,
		sample: 'Awarded in recognition of dedicated study.',
		fontSize: 0.026,
		fontWeight: 400
	}
];

const KIND_BY_NAME = new Map(ELEMENT_KINDS.map((k) => [k.kind, k]));

export function kindSpec(kind: ElementKind): KindSpec {
	return KIND_BY_NAME.get(kind) ?? ELEMENT_KINDS[0];
}

/** The words a placeholder stands in for, so the editor shows a real certificate. */
export function sampleText(kind: ElementKind): string {
	return kindSpec(kind).sample;
}

/**
 * What an element renders as: its authored text (falling back to the sample so a
 * fresh element is never an invisible empty box), or the live placeholder.
 */
export function displayText(el: LayoutElement): string {
	const spec = kindSpec(el.kind);
	if (!spec.authored) return spec.sample;
	return el.text.trim() ? el.text : spec.sample;
}

export const DESIGN_LIMITS = {
	name: { required: true, maxlength: 120 },
	text: { maxlength: 500 }
} as const;

export const ORIENTATIONS: readonly Orientation[] = ['landscape', 'portrait'];
export const ALIGNMENTS: readonly Align[] = ['left', 'center', 'right'];

const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = z.string().regex(HEX, 'Use a six-digit hex colour, like #1f2937.');

/** What create and rename share; the API defaults the rest. */
export const createDesignSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Give the design a name.')
		.max(120, 'Keep the name under 120 characters.')
});
export type CreateDesign = z.infer<typeof createDesignSchema>;

const elementSchema = z.object({
	id: z.string().min(1),
	kind: z.enum(['title', 'learner', 'course', 'date', 'serial', 'signatory', 'text']),
	x: z.number(),
	y: z.number(),
	w: z.number(),
	fontSize: z.number(),
	fontWeight: z.number(),
	color: hex,
	align: z.enum(['left', 'center', 'right']),
	text: z.string().max(500)
});

/** The whole document a Save writes. Bounds mirror the editor's own clamps. */
export const saveDesignSchema = z.object({
	name: z.string().trim().min(1, 'Give the design a name.').max(120),
	orientation: z.enum(['landscape', 'portrait']),
	accent: hex,
	background_color: hex,
	layout: z.array(elementSchema).max(50, 'A certificate holds at most 50 elements.')
});
export type SaveDesign = z.infer<typeof saveDesignSchema>;

function clamp(n: number, lo: number, hi: number): number {
	if (!Number.isFinite(n)) return lo;
	return Math.min(hi, Math.max(lo, n));
}

/**
 * The only door untrusted `layout` JSON comes through. Anything malformed is
 * dropped rather than trusted, and every number is clamped into range — a saved
 * design edited by hand cannot push an element off the canvas or to a zero size.
 */
export function normalizeLayout(raw: unknown): LayoutElement[] {
	if (!Array.isArray(raw)) return [];

	const out: LayoutElement[] = [];
	for (const item of raw) {
		if (!item || typeof item !== 'object') continue;
		const el = item as Record<string, unknown>;
		const kind = el.kind;
		if (typeof kind !== 'string' || !KIND_BY_NAME.has(kind as ElementKind)) continue;

		const spec = kindSpec(kind as ElementKind);
		const align = el.align === 'left' || el.align === 'right' ? el.align : 'center';
		const color = typeof el.color === 'string' && HEX.test(el.color) ? el.color : '#1f2937';

		out.push({
			id: typeof el.id === 'string' && el.id ? el.id : crypto.randomUUID(),
			kind: kind as ElementKind,
			x: clamp(Number(el.x), 0, 1),
			y: clamp(Number(el.y), 0, 1),
			w: clamp(Number(el.w), 0.05, 1),
			fontSize: clamp(Number(el.fontSize), 0.01, 0.3),
			fontWeight: clamp(Number(el.fontWeight), 100, 900),
			color,
			align: align as Align,
			text: typeof el.text === 'string' ? el.text.slice(0, 500) : spec.sample
		});
	}
	return out;
}

/** A new element, dropped near the middle and staggered so it never lands atop the last. */
export function addElement(layout: LayoutElement[], kind: ElementKind): LayoutElement[] {
	const spec = kindSpec(kind);
	const w = 0.6;
	const y = clamp(0.16 + layout.length * 0.09, 0.05, 0.85);
	const el: LayoutElement = {
		id: crypto.randomUUID(),
		kind,
		x: (1 - w) / 2,
		y,
		w,
		fontSize: spec.fontSize,
		fontWeight: spec.fontWeight,
		color: kind === 'title' ? '#1f2937' : '#374151',
		align: 'center',
		text: spec.authored ? spec.sample : ''
	};
	return [...layout, el];
}

/** Replace one element with a patched copy, leaving the rest and their order intact. */
export function updateElement(
	layout: LayoutElement[],
	id: string,
	patch: Partial<LayoutElement>
): LayoutElement[] {
	return layout.map((el) => (el.id === id ? { ...el, ...patch } : el));
}

export function removeElement(layout: LayoutElement[], id: string): LayoutElement[] {
	return layout.filter((el) => el.id !== id);
}

/** The canvas's aspect ratio, wide for landscape and tall for portrait. */
export function aspectRatio(orientation: Orientation): number {
	return orientation === 'portrait' ? 1 / Math.SQRT2 : Math.SQRT2;
}
