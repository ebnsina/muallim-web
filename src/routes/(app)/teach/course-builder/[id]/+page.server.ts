import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import { blueprintSchema, parseStructure, toBlueprint } from '$lib/coursebuild';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, params, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	// A working draft: never a shared cache, and never a stale copy.
	setHeaders({ 'cache-control': 'private, no-store' });

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/course-blueprints/{id}', {
		params: { path: { id: params.id } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Could not load that blueprint.'));
	}

	return { blueprint: toBlueprint(data.blueprint) };
};

export const actions: Actions = {
	// The whole design saved at once: name, description, and the full structure.
	// A partial save would let a dropped field blank the blueprint it was meant to edit.
	save: async ({ request, locals, url, params }) => {
		if (!locals.accessToken) {
			redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
		}

		const form = await request.formData();

		const meta = blueprintSchema.safeParse({
			name: form.get('name'),
			description: form.get('description')
		});
		if (!meta.success) {
			return fail(400, { message: 'Give the blueprint a name before saving.' });
		}

		// The structure arrives as a JSON string built on the client. Re-parse it
		// through the same normaliser the loader uses, so a hand-edited or corrupt
		// payload is coerced to the known shape rather than stored as-is.
		let structure;
		try {
			structure = parseStructure(JSON.parse(String(form.get('structure') ?? '[]')));
		} catch {
			return fail(400, { message: 'The course structure was malformed and was not saved.' });
		}

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/course-blueprints/{id}',
			{
				params: { path: { id: params.id } },
				body: { name: meta.data.name, description: meta.data.description, structure }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not save that blueprint.')
			});
		}

		return { saved: true };
	}
};
