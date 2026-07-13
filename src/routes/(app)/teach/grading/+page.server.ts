import { error, fail } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { scaleNameSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/**
 * The workspace's grading scales.
 *
 * `/teach/+layout.server.ts` has already established that whoever is here holds
 * `course:write` — the same permission the API's scale endpoints require. A
 * student who typed the URL was turned away before this ran.
 */
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) error(401, 'Sign in to manage grading scales.');

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/grading-scales');

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Grading scales could not be loaded.'));
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return { scales: data.scales ?? [] };
};

/** One band as the form submits it. */
interface BandInput {
	label: string;
	min_percent: number;
	is_pass: boolean;
}

/**
 * The bands, out of the flat form fields the browser sends.
 *
 * A repeatable form has no natural array, so each band is three fields sharing an
 * index: `label.0`, `min.0`, `pass.0`. Read until an index has no label.
 */
function bandsFrom(form: FormData): BandInput[] {
	const bands: BandInput[] = [];

	for (let i = 0; form.has(`label.${i}`); i++) {
		bands.push({
			label: String(form.get(`label.${i}`) ?? '').trim(),
			min_percent: Number(form.get(`min.${i}`)),
			is_pass: form.get(`pass.${i}`) === 'on'
		});
	}

	return bands;
}

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to manage grading scales.');

		const form = await request.formData();

		// The name is a field; the bands are rules about each other, and `internal/grade`
		// is the only thing that holds all of them.
		const parsed = parseForm(scaleNameSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const name = parsed.value.name;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/grading-scales',
			{ body: { name, bands: bandsFrom(form) } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That grading scale could not be saved.')
			});
		}

		return { created: name };
	},

	/** Courses grading by it fall back to the default; none is deleted. */
	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to manage grading scales.');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/grading-scales/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That grading scale could not be removed.')
			});
		}

		return { deleted: true };
	}
};
