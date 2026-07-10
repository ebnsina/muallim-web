/**
 * The placeholder substitution a certificate template does, for the live preview.
 *
 * A mirror of `certify.Render` on the server: same four names, same rule that an
 * unknown placeholder is left exactly as written rather than blanked. The preview
 * has to agree with what will actually be printed, or it is a preview of a
 * different certificate.
 *
 * The server renders the real thing at issue; this only shows an author what their
 * template will look like against sample values. They cannot disagree, because the
 * rule is the same and it is tested against the same cases.
 */

export interface PreviewFields {
	learner: string;
	course: string;
	date: string;
	serial: string;
}

const ALIASES: Record<string, keyof PreviewFields> = {
	learner: 'learner',
	name: 'learner',
	course: 'course',
	date: 'date',
	serial: 'serial'
};

/**
 * Substitutes {{learner}}, {{course}}, {{date}} and {{serial}}.
 *
 * One pass, over the template — never over its own output, so a sample value that
 * itself contains `{{course}}` is not substituted again. An unknown name is kept
 * verbatim, so a typo shows in the preview instead of vanishing.
 */
export function renderPreview(body: string, fields: PreviewFields): string {
	return body.replace(/\{\{\s*([^}]*?)\s*\}\}/g, (whole, rawName: string) => {
		const key = ALIASES[rawName.trim().toLowerCase()];
		return key ? fields[key] : whole;
	});
}

/** The sample values a preview stands in for a real certificate with. */
export const SAMPLE: PreviewFields = {
	learner: 'Ada Lovelace',
	course: 'An Introduction to the Analytical Engine',
	date: '4 March 2026',
	serial: 'CERT-EXAM-PLE0-0000-0000'
};
