import { z } from 'zod';
import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

/*
	Hifz — the record of what a student has memorised and recited. The kinds, ratings,
	and the surah bound (1–114) are muallim-api's own; a rule invented here that the
	server does not share is a form that accepts what the API will refuse.
*/

export type HifzEntry = components['schemas']['HifzEntryView'];
export type HifzSummary = components['schemas']['HifzSummaryView'];
export type HifzKind = HifzEntry['kind'];
export type HifzRating = HifzEntry['rating'];

export const HIFZ_KINDS = ['sabaq', 'sabqi', 'manzil'] as const;
export const HIFZ_RATINGS = ['excellent', 'good', 'fair', 'weak'] as const;

/** The HTML constraints for the recitation form. Spread them onto the control. */
export const HIFZ_LIMITS = {
	onDate: { required: true, type: 'date' },
	surah: { required: true, type: 'number', min: 1, max: 114, step: 1 },
	ayah: { required: true, type: 'number', min: 1, max: 286, step: 1 },
	note: { maxlength: 500 }
} as const;

const wholeNumber = (min: number, max: number, message: string) =>
	z.coerce.number({ error: message }).int(message).min(min, message).max(max, message);

/*
	Logging a recitation. The date, kind, surah, the ayah range, and a rating are what a
	line in the log needs; the note is the teacher's own remark and may be left blank.
	The ayah range is checked as a pair — a "to" before its "from" is neither field's rule.
*/
export const logHifzSchema = z
	.object({
		on_date: z
			.string()
			.refine((value) => !Number.isNaN(Date.parse(value)), 'Choose the date recited.'),
		kind: z.enum(HIFZ_KINDS, { error: 'Choose a kind.' }),
		surah: wholeNumber(1, 114, 'A surah is a number from 1 to 114.'),
		ayah_from: wholeNumber(1, 286, 'The first ayah is a number from 1 to 286.'),
		ayah_to: wholeNumber(1, 286, 'The last ayah is a number from 1 to 286.'),
		rating: z.enum(HIFZ_RATINGS, { error: 'Choose a rating.' }),
		note: z
			.string()
			.trim()
			.max(500, 'That is longer than 500 characters.')
			.optional()
			.transform((value) => value ?? '')
	})
	.refine((v) => v.ayah_to >= v.ayah_from, {
		path: ['ayah_to'],
		message: 'The last ayah is before the first.'
	});

/** Sabaq is the new lesson, sabqi the recent revision, manzil the old ground kept. */
export function kindLabel(kind: HifzKind): string {
	switch (kind) {
		case 'sabaq':
			return 'Sabaq';
		case 'sabqi':
			return 'Sabqi';
		case 'manzil':
			return 'Manzil';
	}
}

export function kindTone(kind: HifzKind): BadgeTone {
	switch (kind) {
		case 'sabaq':
			return 'accent';
		case 'sabqi':
			return 'neutral';
		case 'manzil':
			return 'neutral';
	}
}

export function ratingLabel(rating: HifzRating): string {
	switch (rating) {
		case 'excellent':
			return 'Excellent';
		case 'good':
			return 'Good';
		case 'fair':
			return 'Fair';
		case 'weak':
			return 'Weak';
	}
}

/** Excellent and good are the recitation holding; fair and weak are the ones to revisit. */
export function ratingTone(rating: HifzRating): BadgeTone {
	switch (rating) {
		case 'excellent':
			return 'success';
		case 'good':
			return 'accent';
		case 'fair':
			return 'warning';
		case 'weak':
			return 'danger';
	}
}

/*
	The 114 surah, transliterated, indexed by number. So a log line reads "Al-Baqarah,
	1–20" and not "surah 2". The name is decoration on a number that is already correct;
	an out-of-range index falls back to the number itself.
*/
const SURAH_NAMES: readonly string[] = [
	'Al-Fatihah',
	'Al-Baqarah',
	'Aal-i-Imran',
	'An-Nisa',
	'Al-Maidah',
	'Al-Anam',
	'Al-Araf',
	'Al-Anfal',
	'At-Tawbah',
	'Yunus',
	'Hud',
	'Yusuf',
	'Ar-Rad',
	'Ibrahim',
	'Al-Hijr',
	'An-Nahl',
	'Al-Isra',
	'Al-Kahf',
	'Maryam',
	'Ta-Ha',
	'Al-Anbiya',
	'Al-Hajj',
	'Al-Muminun',
	'An-Nur',
	'Al-Furqan',
	'Ash-Shuara',
	'An-Naml',
	'Al-Qasas',
	'Al-Ankabut',
	'Ar-Rum',
	'Luqman',
	'As-Sajdah',
	'Al-Ahzab',
	'Saba',
	'Fatir',
	'Ya-Sin',
	'As-Saffat',
	'Sad',
	'Az-Zumar',
	'Ghafir',
	'Fussilat',
	'Ash-Shuraa',
	'Az-Zukhruf',
	'Ad-Dukhan',
	'Al-Jathiyah',
	'Al-Ahqaf',
	'Muhammad',
	'Al-Fath',
	'Al-Hujurat',
	'Qaf',
	'Adh-Dhariyat',
	'At-Tur',
	'An-Najm',
	'Al-Qamar',
	'Ar-Rahman',
	'Al-Waqiah',
	'Al-Hadid',
	'Al-Mujadila',
	'Al-Hashr',
	'Al-Mumtahanah',
	'As-Saff',
	'Al-Jumuah',
	'Al-Munafiqun',
	'At-Taghabun',
	'At-Talaq',
	'At-Tahrim',
	'Al-Mulk',
	'Al-Qalam',
	'Al-Haqqah',
	'Al-Maarij',
	'Nuh',
	'Al-Jinn',
	'Al-Muzzammil',
	'Al-Muddaththir',
	'Al-Qiyamah',
	'Al-Insan',
	'Al-Mursalat',
	'An-Naba',
	'An-Naziat',
	'Abasa',
	'At-Takwir',
	'Al-Infitar',
	'Al-Mutaffifin',
	'Al-Inshiqaq',
	'Al-Buruj',
	'At-Tariq',
	'Al-Ala',
	'Al-Ghashiyah',
	'Al-Fajr',
	'Al-Balad',
	'Ash-Shams',
	'Al-Lail',
	'Ad-Duha',
	'Ash-Sharh',
	'At-Tin',
	'Al-Alaq',
	'Al-Qadr',
	'Al-Bayyinah',
	'Az-Zalzalah',
	'Al-Adiyat',
	'Al-Qariah',
	'At-Takathur',
	'Al-Asr',
	'Al-Humazah',
	'Al-Fil',
	'Quraysh',
	'Al-Maun',
	'Al-Kawthar',
	'Al-Kafirun',
	'An-Nasr',
	'Al-Masad',
	'Al-Ikhlas',
	'Al-Falaq',
	'An-Nas'
];

/** The surah's name, or the number itself when it is out of range. */
export function surahName(surah: number): string {
	return SURAH_NAMES[surah - 1] ?? `Surah ${surah}`;
}

/** "Al-Baqarah · 1–20", the way a log line and a summary both read a passage. */
export function passage(entry: Pick<HifzEntry, 'surah' | 'ayah_from' | 'ayah_to'>): string {
	const range =
		entry.ayah_from === entry.ayah_to
			? `${entry.ayah_from}`
			: `${entry.ayah_from}–${entry.ayah_to}`;
	return `${surahName(entry.surah)} · ${range}`;
}
