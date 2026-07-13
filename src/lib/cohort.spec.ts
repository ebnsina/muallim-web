import { describe, expect, it } from 'vitest';
import {
	OUTCOMES,
	outcomeHint,
	outcomeLabel,
	outcomeTone,
	parseAddresses,
	resultsFor,
	type ImportResult
} from './cohort';
import { cohortSchema } from './schemas';

describe('parseAddresses', () => {
	it('takes one address per line', () => {
		expect(parseAddresses('ada@example.com\ngrace@example.com')).toEqual([
			'ada@example.com',
			'grace@example.com'
		]);
	});

	it('takes commas and semicolons, because people paste from spreadsheets', () => {
		expect(parseAddresses('ada@example.com, grace@example.com; alan@example.com')).toEqual([
			'ada@example.com',
			'grace@example.com',
			'alan@example.com'
		]);
	});

	it('takes the separators mixed, and Windows line endings with them', () => {
		expect(parseAddresses('ada@example.com,\r\ngrace@example.com;alan@example.com')).toEqual([
			'ada@example.com',
			'grace@example.com',
			'alan@example.com'
		]);
	});

	it('drops blank lines and trailing separators', () => {
		expect(parseAddresses('\n\nada@example.com,\n\n\ngrace@example.com,\n')).toEqual([
			'ada@example.com',
			'grace@example.com'
		]);
	});

	it('trims the whitespace around an address', () => {
		expect(parseAddresses('   ada@example.com   \n\t grace@example.com \t')).toEqual([
			'ada@example.com',
			'grace@example.com'
		]);
	});

	it('lower-cases, so a spreadsheet full of capitals is one cohort and not two', () => {
		expect(parseAddresses('Ada@Example.com\nADA@EXAMPLE.COM')).toEqual(['ada@example.com']);
	});

	it('de-duplicates, keeping the first occurrence', () => {
		expect(parseAddresses('ada@example.com\ngrace@example.com\nada@example.com')).toEqual([
			'ada@example.com',
			'grace@example.com'
		]);
	});

	it('finds nothing in whitespace', () => {
		expect(parseAddresses('')).toEqual([]);
		expect(parseAddresses('  \n \t \n ')).toEqual([]);
	});
});

describe('cohortSchema', () => {
	it('reads the pasted block as the list it means', () => {
		const parsed = cohortSchema.safeParse({ emails: 'ada@example.com; ADA@example.com\nbob@x.io' });
		expect(parsed.success && parsed.data.emails).toEqual(['ada@example.com', 'bob@x.io']);
	});

	it('refuses an empty paste', () => {
		expect(cohortSchema.safeParse({ emails: '   \n  ' }).success).toBe(false);
	});

	it('refuses more than 500 addresses — the API does too', () => {
		const many = Array.from({ length: 501 }, (_, i) => `learner-${i}@example.com`).join('\n');
		expect(cohortSchema.safeParse({ emails: many }).success).toBe(false);

		const most = Array.from({ length: 500 }, (_, i) => `learner-${i}@example.com`).join('\n');
		expect(cohortSchema.safeParse({ emails: most }).success).toBe(true);
	});

	it('names the address that is not an address', () => {
		const parsed = cohortSchema.safeParse({ emails: 'ada@example.com\nnot-an-address' });
		expect(parsed.success).toBe(false);
		expect(parsed.error?.issues[0]?.message).toContain('not-an-address');
	});
});

describe('outcomes', () => {
	it('names, tones and explains every outcome the API can send', () => {
		for (const outcome of OUTCOMES) {
			expect(outcomeLabel(outcome).length).toBeGreaterThan(0);
			expect(outcomeHint(outcome).length).toBeGreaterThan(0);
			expect(outcomeTone(outcome)).toBeTruthy();
		}
	});

	// The one group a person has to act on leads the report.
	it('reads worst-first', () => {
		expect(OUTCOMES[0]).toBe('not_a_member');
	});

	it('never says an account was created, because none was', () => {
		expect(outcomeHint('not_a_member')).toContain('No account was created');
	});
});

describe('resultsFor', () => {
	const results: ImportResult[] = [
		{ email: 'ada@example.com', outcome: 'enrolled', user_id: 'u1' },
		{ email: 'nobody@example.test', outcome: 'not_a_member' },
		{ email: 'grace@example.com', outcome: 'already_enrolled', user_id: 'u2' }
	];

	it('groups by outcome, in the order the API reported them', () => {
		expect(resultsFor(results, 'not_a_member').map((r) => r.email)).toEqual([
			'nobody@example.test'
		]);
		expect(resultsFor(results, 'enrolled').map((r) => r.email)).toEqual(['ada@example.com']);
		expect(resultsFor(results, 'already_enrolled').map((r) => r.email)).toEqual([
			'grace@example.com'
		]);
	});
});
