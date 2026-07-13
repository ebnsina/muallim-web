import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { authedApi } from '$lib/server/api';
import {
	certificateLookupSchema,
	certificateTemplateSchema,
	revokeCertificateSchema
} from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/**
 * The workspace's certificate templates, and the certificate a serial names.
 *
 * `/teach/+layout.server.ts` has established `course:write`, which is what the
 * API's template endpoints require. The built-in default comes back first, and is
 * not something anybody may edit or delete.
 *
 * muallim-api lists no issued certificates — `GET /v1/certificates/{serial}` answers
 * one number at a time, and nothing enumerates them — so withdrawing one starts
 * with the number, and the page shows what that number actually says before
 * offering to withdraw it.
 */
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) error(401, 'Sign in to manage certificate templates.');

	const api = authedApi(url.origin, locals.accessToken);

	const { data, error: problem, response } = await api.GET('/v1/certificate-templates');

	if (problem || !data) {
		error(
			response?.status ?? 500,
			problemMessage(problem, 'Certificate templates could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	const serial = url.searchParams.get('serial')?.trim();
	if (!serial) return { templates: data.templates ?? [], lookup: null };

	const found = await api.GET('/v1/certificates/{serial}', { params: { path: { serial } } });

	// A number nobody issued is not a broken page: it is an answer. The section says
	// so and the templates above it stay where they were.
	return {
		templates: data.templates ?? [],
		lookup: {
			serial,
			certificate: found.data?.certificate ?? null,
			message: found.error
				? problemMessage(found.error, 'No certificate carries that number.')
				: null
		}
	};
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to manage certificate templates.');

		const parsed = parseForm(certificateTemplateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/certificate-templates',
			{ body: parsed.value }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That template could not be saved.')
			});
		}

		return { created: parsed.value.name };
	},

	/** Courses printing it fall back to the default; certificates already issued
	 *  keep the words they were issued with. */
	delete: async ({ request, locals, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to manage certificate templates.');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/certificate-templates/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That template could not be removed.')
			});
		}

		return { deleted: true };
	},

	/** Look a certificate up by its number. The serial is the only handle there is. */
	find: async ({ request }) => {
		const parsed = parseForm(certificateLookupSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		redirect(303, `/teach/certificates?serial=${encodeURIComponent(parsed.value.serial)}`);
	},

	/*
		Withdraw a certificate. It is not deleted — somebody has the number, and the
		number keeps answering; from now on it answers that the certificate was
		withdrawn, and says why.
	*/
	revoke: async ({ request, locals, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to withdraw a certificate.');

		const parsed = parseForm(revokeCertificateSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/certificates/{serial}/revoke',
			{
				params: { path: { serial: parsed.value.serial } },
				body: { reason: parsed.value.reason }
			}
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That certificate could not be withdrawn.')
			});
		}

		// Back to the number, which now answers that it was withdrawn — the whole point
		// of not deleting it, and the only proof the author has that it worked.
		redirect(303, `/teach/certificates?serial=${encodeURIComponent(parsed.value.serial)}`);
	}
};
