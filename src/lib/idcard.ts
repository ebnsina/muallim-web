import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	The ID-card designer's shared vocabulary — the element model, its sample text,
	and the pure functions the editor mutates a layout with. Mirrors `certdesign.ts`
	for the certificate builder: the API stores `layout` as opaque JSON (`unknown`),
	so this module is where that JSON is given a shape and defended. `normalizeLayout`
	is the only door untrusted layout comes through, and everything downstream may
	assume a clean `LayoutElement[]`.

	Deliberately self-contained: it does not touch the certificate designer or its
	components.
*/

/** A template as the API returns it. `layout` stays `unknown` until normalised. */
export type TemplateView = components['schemas']['IDCardTemplateView'];

export type Orientation = 'portrait' | 'landscape';
export type Subject = 'student' | 'staff';
export type ElementKind =
	| 'name'
	| 'photo'
	| 'id_number'
	| 'class_or_role'
	| 'valid_until'
	| 'blood_group'
	| 'school_name'
	| 'text';
export type Align = 'left' | 'center' | 'right';

/**
 * One element on the card. `x`, `y`, `w`, and `fontSize` are all fractions of the
 * canvas, never pixels — so a layout renders identically at a thumbnail's size and
 * a full card's. `x`/`y` are the box's top-left corner, `fontSize` a fraction of
 * the canvas width. `text` is unused by the `photo` element.
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
	/** Authored kinds carry their own `text`; data kinds render a live placeholder. */
	authored: boolean;
	/** The photo kind draws a bordered box, not text. */
	photo: boolean;
	sample: string;
	fontSize: number;
	fontWeight: number;
}

/** The palette, in the order it appears in the UI, with each kind's defaults. */
export const ELEMENT_KINDS: readonly KindSpec[] = [
	{
		kind: 'photo',
		label: 'Photo',
		authored: false,
		photo: true,
		sample: 'Photo',
		fontSize: 0.05,
		fontWeight: 400
	},
	{
		kind: 'name',
		label: 'Name',
		authored: false,
		photo: false,
		sample: 'Aminul Islam',
		fontSize: 0.075,
		fontWeight: 700
	},
	{
		kind: 'id_number',
		label: 'ID number',
		authored: false,
		photo: false,
		sample: '2026-001',
		fontSize: 0.05,
		fontWeight: 500
	},
	{
		kind: 'class_or_role',
		label: 'Class / role',
		authored: false,
		photo: false,
		sample: 'Class 6 · A',
		fontSize: 0.045,
		fontWeight: 500
	},
	{
		kind: 'valid_until',
		label: 'Valid until',
		authored: false,
		photo: false,
		sample: '2027-12-31',
		fontSize: 0.04,
		fontWeight: 400
	},
	{
		kind: 'blood_group',
		label: 'Blood group',
		authored: false,
		photo: false,
		sample: 'B+',
		fontSize: 0.045,
		fontWeight: 500
	},
	{
		kind: 'school_name',
		label: 'School name',
		authored: true,
		photo: false,
		sample: 'Muallim Academy',
		fontSize: 0.055,
		fontWeight: 700
	},
	{
		kind: 'text',
		label: 'Free text',
		authored: true,
		photo: false,
		sample: 'Student Identity Card',
		fontSize: 0.04,
		fontWeight: 400
	}
];

const KIND_BY_NAME = new Map(ELEMENT_KINDS.map((k) => [k.kind, k]));
const KIND_NAMES = ELEMENT_KINDS.map((k) => k.kind) as [ElementKind, ...ElementKind[]];

export function kindSpec(kind: ElementKind): KindSpec {
	return KIND_BY_NAME.get(kind) ?? ELEMENT_KINDS[0];
}

/** The words a placeholder stands in for, so the editor shows a real card. */
export function sampleText(kind: ElementKind): string {
	return kindSpec(kind).sample;
}

/**
 * The data a real card is filled with, keyed by element kind. Anything missing
 * falls back to the sample, so a preview is never an empty box.
 */
export type CardData = Partial<Record<ElementKind, string>>;

/**
 * What a (non-photo) element renders as: authored text (falling back to the sample
 * so a fresh element is never invisible), or the supplied data, or its sample.
 */
export function displayText(el: LayoutElement, data?: CardData): string {
	const spec = kindSpec(el.kind);
	if (spec.authored) return el.text.trim() ? el.text : spec.sample;
	const value = data?.[el.kind];
	return value && value.trim() ? value : spec.sample;
}

export const TEMPLATE_LIMITS = {
	name: { required: true, maxlength: 120 },
	text: { maxlength: 200 }
} as const;

export const ORIENTATIONS: readonly Orientation[] = ['portrait', 'landscape'];
export const SUBJECTS: readonly Subject[] = ['student', 'staff'];
export const ALIGNMENTS: readonly Align[] = ['left', 'center', 'right'];

const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = z.string().regex(HEX, 'Use a six-digit hex colour, like #1f2937.');

/** What the create dialog collects; the API defaults the colours and layout. */
export const createTemplateSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Give the template a name.')
		.max(120, 'Keep the name under 120 characters.'),
	subject: z.enum(['student', 'staff']),
	orientation: z.enum(['portrait', 'landscape'])
});
export type CreateTemplate = z.infer<typeof createTemplateSchema>;

const elementSchema = z.object({
	id: z.string().min(1),
	kind: z.enum(KIND_NAMES),
	x: z.number(),
	y: z.number(),
	w: z.number(),
	fontSize: z.number(),
	fontWeight: z.number(),
	color: hex,
	align: z.enum(['left', 'center', 'right']),
	text: z.string().max(200)
});

/** The whole document a Save writes. Bounds mirror the editor's own clamps. */
export const saveTemplateSchema = z.object({
	name: z.string().trim().min(1, 'Give the template a name.').max(120),
	subject: z.enum(['student', 'staff']),
	orientation: z.enum(['portrait', 'landscape']),
	accent: hex,
	background_color: hex,
	layout: z.array(elementSchema).max(50, 'An ID card holds at most 50 elements.')
});
export type SaveTemplate = z.infer<typeof saveTemplateSchema>;

function clamp(n: number, lo: number, hi: number): number {
	if (!Number.isFinite(n)) return lo;
	return Math.min(hi, Math.max(lo, n));
}

/**
 * The only door untrusted `layout` JSON comes through. Anything malformed is
 * dropped rather than trusted, and every number is clamped into range — a saved
 * template edited by hand cannot push an element off the card or to a zero size.
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
			text: typeof el.text === 'string' ? el.text.slice(0, 200) : spec.sample
		});
	}
	return out;
}

/** A new element, dropped near the top and staggered so it never lands atop the last. */
export function addElement(layout: LayoutElement[], kind: ElementKind): LayoutElement[] {
	const spec = kindSpec(kind);
	const w = spec.photo ? 0.34 : 0.72;
	const y = clamp(0.1 + layout.length * 0.08, 0.04, 0.85);
	const el: LayoutElement = {
		id: crypto.randomUUID(),
		kind,
		x: (1 - w) / 2,
		y,
		w,
		fontSize: spec.fontSize,
		fontWeight: spec.fontWeight,
		color: '#1f2937',
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

/**
 * The card's aspect ratio (width / height). ID cards are the ISO/IEC 7810 ID-1
 * size, 54×86mm — tall in portrait (≈ 0.63), wide in landscape (≈ 1.59).
 */
export function aspectRatio(orientation: Orientation): number {
	return orientation === 'portrait' ? 54 / 86 : 86 / 54;
}
