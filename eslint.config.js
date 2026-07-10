import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	},
	{
		// `no-navigation-without-resolve` wants every href to go through resolve().
		// A generic Button forwards whatever href it is handed and cannot resolve it
		// a second time. The call sites are ours and are linted; this is the
		// primitive they call.
		//
		// The assignment pages render a signed URL the object store gave us, for a
		// file in a bucket on another origin. There is no route to resolve.
		// `Breadcrumbs` and `Row` are the same shape as `Button`: they render whatever
		// href their caller hands them, already resolved.
		//
		// Globbed rather than named: `[slug]` is a character class to a matcher, not
		// a literal, and a pattern that silently matches nothing turns a rule off by
		// accident somewhere else.
		files: [
			'src/lib/components/Button.svelte',
			'src/lib/components/Breadcrumbs.svelte',
			'src/lib/components/CourseCard.svelte',
			'src/lib/components/TintCard.svelte',
			'src/lib/components/Row.svelte',
			'src/routes/**/assignment/**/+page.svelte'
		],
		rules: {
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
