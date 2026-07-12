import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { apiAs, authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/**
 * The assignment, and this learner's own work on it.
 *
 * muallim-api decides who may see this: whoever may read the lesson may read its
 * assignment. A submission comes back only for somebody who has one.
 */
export const load: PageServerLoad = async ({ locals, params, url }) => {
	const {
		data,
		error: problem,
		response
	} = await apiAs(url.origin, locals.accessToken).GET('/v1/lessons/{id}/assignment', {
		params: { path: { id: params.id } }
	});

	if (problem || !data) {
		error(response?.status ?? 500, problemMessage(problem, 'That assignment could not be loaded.'));
	}

	return {
		slug: params.slug,
		lessonId: params.id,
		assignment: data.assignment,
		submission: data.submission ?? null,
		signedIn: Boolean(locals.accessToken)
	};
};

export const actions: Actions = {
	/**
	 * Sign a URL for one file.
	 *
	 * The browser calls this, then PUTs the bytes to the URL it gets back. It has
	 * to come through here rather than from a script talking to muallim-api directly:
	 * the access token lives in an httpOnly cookie so that no script in the page
	 * can read it, and the signature is what the store trusts instead.
	 *
	 * Nothing is written. A learner who abandons the upload leaves no row, and a
	 * URL nobody uses expires in fifteen minutes.
	 */
	presign: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

		const form = await request.formData();
		const filename = String(form.get('filename') ?? '');
		const bytes = Number(form.get('bytes'));

		if (!filename || !Number.isSafeInteger(bytes) || bytes < 1) {
			return fail(422, { message: 'That file could not be read.' });
		}

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/lessons/{id}/assignment/uploads',
			{
				params: { path: { id: params.id } },
				body: { filename, bytes }
			}
		);

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, `${filename} could not be uploaded.`)
			});
		}

		return { upload: data };
	},

	/**
	 * Record a file that is now in the bucket.
	 *
	 * muallim-api asks the store what is really at that key before it writes anything,
	 * so a client that skips the PUT and calls this gets a 409 and no row. There is
	 * no version of this the browser can lie its way through.
	 */
	confirm: async ({ request, locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const key = String(form.get('key') ?? '');
		const filename = String(form.get('filename') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/lessons/{id}/assignment/files',
			{
				params: { path: { id: params.id } },
				body: { key, filename }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, `${filename} could not be attached.`)
			});
		}

		return { attached: filename };
	},

	/** Take a file out of the draft. The object is deleted by a background job. */
	remove: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const fileId = String(form.get('file_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/assignment-files/{id}',
			{
				params: { path: { id: fileId } }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That file could not be removed.')
			});
		}

		return { removed: true };
	},

	/**
	 * Hand the work in. Freezes the files, and records lateness against the
	 * deadline as it stands at this moment — moving it afterwards changes nobody's
	 * standing.
	 */
	submit: async ({ locals, params, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/lessons/{id}/assignment/submit',
			{
				params: { path: { id: params.id } }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That work could not be handed in.')
			});
		}

		return { submitted: true };
	},

	/**
	 * Mint a download URL and hand it to the browser.
	 *
	 * Not a redirect. A 302 to a signed URL leaves the signature in the browser's
	 * history, in the referrer of whatever it loads, and in every proxy log between
	 * here and the bucket.
	 */
	download: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');

		const form = await request.formData();
		const fileId = String(form.get('file_id') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/assignment-files/{id}/download', {
			params: { path: { id: fileId } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That file could not be downloaded.')
			});
		}

		return { url: data.url };
	}
};
