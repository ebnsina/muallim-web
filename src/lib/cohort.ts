import type { BadgeTone } from '$lib/components';
import type { components } from '$lib/api/schema';

export type ImportReport = components['schemas']['ImportOutputBody'];
export type ImportResult = components['schemas']['ImportResultView'];
export type Outcome = ImportResult['outcome'];

/**
 * The addresses a pasted block of text means.
 *
 * A line each is the common case, but a paste out of a spreadsheet arrives comma-
 * or semicolon-separated, so all three separate. Trimmed, lower-cased and
 * de-duplicated — muallim-api does the same, and a person should see the list they
 * are about to submit rather than the one they happened to paste.
 */
export function parseAddresses(text: string): string[] {
	const addresses = new Set<string>();

	for (const part of text.split(/[\s,;]+/)) {
		const address = part.trim().toLowerCase();
		if (address) addresses.add(address);
	}

	return [...addresses];
}

/** The report reads worst-first: a misspelling is the one line that needs a person. */
export const OUTCOMES = ['not_a_member', 'enrolled', 'already_enrolled'] as const;

export function outcomeLabel(outcome: Outcome): string {
	switch (outcome) {
		case 'enrolled':
			return 'Enrolled';
		case 'already_enrolled':
			return 'Already enrolled';
		case 'not_a_member':
			return 'Not a member';
	}
}

/** Already enrolled is not a failure — it is what re-running an import looks like. */
export function outcomeTone(outcome: Outcome): BadgeTone {
	switch (outcome) {
		case 'enrolled':
			return 'success';
		case 'already_enrolled':
			return 'neutral';
		case 'not_a_member':
			return 'warning';
	}
}

/** One sentence on what happened, and — for the addresses that failed — what to do. */
export function outcomeHint(outcome: Outcome): string {
	switch (outcome) {
		case 'enrolled':
			return 'Enrolled by this import. They can start the course now.';
		case 'already_enrolled':
			return 'On the course before this import. Nothing changed for them.';
		case 'not_a_member':
			return 'Nobody in this workspace holds this address, so it was skipped. No account was created and no invitation was sent — check the spelling, or invite them on the People page. A person has to accept an invitation before they can be imported.';
	}
}

/** The results of one outcome, in the order the API reported them. */
export function resultsFor(results: ImportResult[], outcome: Outcome): ImportResult[] {
	return results.filter((result) => result.outcome === outcome);
}
