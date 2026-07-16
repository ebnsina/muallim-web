import { z } from 'zod';
import type { components } from '$lib/api/schema';

/*
	The notices module's type and the board form's rules. muallim-api decides who a
	notice reaches; this file only shapes what the school types.
*/

export type Notice = components['schemas']['NoticeView'];

/** Who a notice reaches. muallim-api's enum; an unknown one is refused here too. */
export const AUDIENCES = ['all_guardians', 'class_guardians', 'section_guardians'] as const;
export type Audience = (typeof AUDIENCES)[number];

/** How it is delivered. */
export const CHANNELS = ['email', 'sms', 'both'] as const;
export type Channel = (typeof CHANNELS)[number];

export function audienceLabel(audience: Audience): string {
	switch (audience) {
		case 'all_guardians':
			return 'All guardians';
		case 'class_guardians':
			return 'A class’s guardians';
		case 'section_guardians':
			return 'A section’s guardians';
	}
}

export function channelLabel(channel: Channel): string {
	switch (channel) {
		case 'email':
			return 'Email';
		case 'sms':
			return 'SMS';
		case 'both':
			return 'Email & SMS';
	}
}

/** A class or section audience needs a target; "all guardians" does not. */
export function audienceNeedsTarget(audience: Audience): boolean {
	return audience === 'class_guardians' || audience === 'section_guardians';
}

// `.trim()` before `.min(1)`: `required` asks whether a character was typed, and a
// space is a character.
const text = (max: number, missing: string) =>
	z.string().trim().min(1, missing).max(max, `That is longer than ${max} characters.`);

const blankIsAbsent = (value: unknown) => (value === '' ? undefined : value);
const optionalUuid = z.preprocess(blankIsAbsent, z.uuid().optional());

/*
	Posting a notice. The title and body are always required; the target is the class
	or section a class/section audience is aimed at, and is left off for "all
	guardians". muallim-api answers 422 when the audience needs a target and has none,
	or when the chosen audience has nobody to reach — both are shown as they came.
*/
export const postNoticeSchema = z
	.object({
		title: text(200, 'Give the notice a title.'),
		body: text(5000, 'A notice needs something to say.'),
		audience: z.enum(AUDIENCES, { error: 'Choose who this reaches.' }),
		channel: z.enum(CHANNELS, { error: 'Choose how this is sent.' }),
		target_id: optionalUuid
	})
	.refine((v) => !audienceNeedsTarget(v.audience) || v.target_id !== undefined, {
		path: ['target_id'],
		message: 'Choose the class or section this is for.'
	});

/** The HTML constraints for the notice form, as attributes. Spread them onto the control. */
export const NOTICE_LIMITS = {
	title: { required: true, maxlength: 200 },
	body: { required: true, maxlength: 5000 }
} as const;
