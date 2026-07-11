import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { aiEnabled } from '$lib/server/ai';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// lms-api enforces course:write and answers 403 otherwise; this redirect is for
	// the unauthenticated case, where the useful instruction is "sign in".
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	return { aiEnabled: aiEnabled() };
};

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Narrows the submitted difficulty rather than asserting it. A form field is
 * user input, and `as Difficulty` would tell the compiler a lie that lms-api
 * would then reject with a 422 the page has no branch for.
 */
function toDifficulty(value: string): Difficulty {
	return (DIFFICULTIES as readonly string[]).includes(value) ? (value as Difficulty) : 'beginner';
}

/** Turns a title into a slug candidate, so the author does not have to. */
function slugify(title: string): string {
	return title
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 100);
}

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fteach%2Fnew');

		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const summary = String(form.get('summary') ?? '').trim();
		const difficulty = toDifficulty(String(form.get('difficulty') ?? ''));

		// The author may override the slug, but never has to supply one. It is part
		// of the course's public URL, so it is derived once and then frozen.
		const slug = String(form.get('slug') ?? '').trim() || slugify(title);

		if (!title) return fail(400, { title, summary, message: 'Give the course a title.' });
		if (!slug) {
			return fail(400, {
				title,
				summary,
				message: 'That title produces no usable web address. Set one explicitly.'
			});
		}

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/courses',
			{
				body: { title, slug, summary, difficulty }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				title,
				summary,
				message: problemMessage(problem, 'Could not create that course.')
			});
		}

		// Back to the list, where the new draft now appears. A redirect after a
		// successful POST, so a reload does not resubmit it.
		redirect(303, '/teach');
	}
};
