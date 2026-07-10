import { describe, expect, it } from 'vitest';
import { renderPreview, type PreviewFields } from './certificate-preview';

const fields: PreviewFields = {
	learner: 'Al-Khwarizmi',
	course: 'Algebra from First Principles',
	date: '4 March 2026',
	serial: 'CERT-ABCD'
};

/*
	These are the cases the Go test asserts on `certify.Render`. The preview has to
	agree with what the server prints, so it is checked against the same table.
*/
describe('renderPreview matches certify.Render', () => {
	it.each([
		[
			'{{learner}} finished {{course}} on {{date}}, {{serial}}.',
			'Al-Khwarizmi finished Algebra from First Principles on 4 March 2026, CERT-ABCD.'
		],
		['Well done.', 'Well done.'],
		['{{name}}', 'Al-Khwarizmi'],
		['{{LEARNER}}', 'Al-Khwarizmi'],
		['{{ learner }}', 'Al-Khwarizmi'],
		['{{learner}} and {{learner}}', 'Al-Khwarizmi and Al-Khwarizmi'],

		// A typo is printed, not swallowed — a certificate that framed a blank where a
		// word should be is worse than one that shows the mistake.
		['{{corse}}', '{{corse}}'],

		['{learner}', '{learner}'],
		['done {', 'done {'],
		['', ''],
		['{{serial}}', 'CERT-ABCD']
	])('renders %j', (body, want) => {
		expect(renderPreview(body, fields)).toBe(want);
	});

	// Substitution is over the template, not its own output: a sample value that
	// contains a placeholder is not re-substituted.
	it('does not substitute its own output', () => {
		const selfReferential: PreviewFields = { ...fields, learner: '{{course}}' };
		expect(renderPreview('{{learner}}', selfReferential)).toBe('{{course}}');
	});
});
