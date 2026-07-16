import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { saveTemplateSchema } from '$lib/idcard';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/** The template being edited. Its bytes never cache — it is the author's private draft. */
export const load: PageServerLoad = async ({ locals, url, params, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const {
		data,
		error: problem,
		response
	} = await authedApi(url.origin, locals.accessToken).GET('/v1/id-card-templates/{id}', {
		params: { path: { id: params.id } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'Could not load that template.'));
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return { template: data.template };
};

/** Refuse guard so an expired session redirects rather than 500s mid-sequence. */
function guard(token: string | null): asserts token is string {
	if (!token) redirect(303, '/login?next=%2Fteach%2Fid-cards');
}

export const actions: Actions = {
	/** Persist the whole document. `layout` arrives as a JSON string — FormData carries no arrays. */
	save: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const raw = String((await request.formData()).get('payload') ?? '');
		let parsedJson: unknown;
		try {
			parsedJson = JSON.parse(raw);
		} catch {
			return fail(422, { message: 'That template could not be read.' });
		}

		const parsed = saveTemplateSchema.safeParse(parsedJson);
		if (!parsed.success) {
			return fail(422, {
				message: parsed.error.issues[0]?.message ?? 'That template is not valid.'
			});
		}

		const { name, subject, orientation, accent, background_color, layout } = parsed.data;

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PUT(
			'/v1/id-card-templates/{id}',
			{
				params: { path: { id: params.id } },
				body: { name, subject, orientation, accent, background_color, layout }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'Could not save that template.')
			});
		}
		return { saved: true };
	},

	/**
	 * Sign a URL for the background image. The browser PUTs to it, then confirms —
	 * the same three-step flow the course thumbnail uses, so the bytes never pass
	 * through this server or the API and the access token stays in its cookie.
	 */
	presignBackground: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const form = await request.formData();
		const contentType = String(form.get('content_type') ?? '');
		const bytes = Number(form.get('bytes'));

		if (!Number.isSafeInteger(bytes) || bytes < 1) {
			return fail(422, { scope: 'background', message: 'That image could not be read.' });
		}

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/id-card-templates/{id}/background/uploads',
			{
				params: { path: { id: params.id } },
				body: { content_type: contentType as 'image/png' | 'image/jpeg' | 'image/webp', bytes }
			}
		);

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				scope: 'background',
				message: problemMessage(problem, 'That image could not be uploaded.')
			});
		}

		return { backgroundUpload: data };
	},

	/** Record a background now in the bucket, then hand back its signed URL for the live canvas. */
	confirmBackground: async ({ request, locals, params, url }) => {
		guard(locals.accessToken);

		const key = String((await request.formData()).get('key') ?? '');
		const client = authedApi(url.origin, locals.accessToken);

		const { error: problem, response } = await client.POST(
			'/v1/id-card-templates/{id}/background',
			{
				params: { path: { id: params.id } },
				body: { key }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				scope: 'background',
				message: problemMessage(problem, 'That image could not be saved.')
			});
		}

		// The confirm is 204; re-read the template so the canvas gets the fresh signed URL.
		const { data } = await client.GET('/v1/id-card-templates/{id}', {
			params: { path: { id: params.id } }
		});

		return { backgroundUrl: data?.template.background_url ?? null };
	}
};
