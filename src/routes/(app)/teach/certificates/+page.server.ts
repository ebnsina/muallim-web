import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import {
	certificateLookupSchema,
	certificateTemplateSchema,
	revokeCertificateSchema
} from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of issued certificates. muallim-api's ceiling is 100. */
const PAGE_SIZE = 50;

/**
 * What this workspace has issued, and the words a certificate carries.
 *
 * `/teach/+layout.server.ts` has established `course:write`, which is what both the
 * list and the template endpoints require. A serial narrows the list to one
 * certificate — for a registrar holding the number, which is faster than paging to it.
 */
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) error(401, 'Sign in to manage certificates.');

	const api = authedApi(url.origin, locals.accessToken);
	const serial = url.searchParams.get('serial')?.trim();

	const [templates, issued] = await Promise.all([
		api.GET('/v1/certificate-templates'),
		serial
			? api.GET('/v1/certificates/{serial}', { params: { path: { serial } } })
			: api.GET('/v1/certificates', { params: { query: { limit: PAGE_SIZE } } })
	]);

	if (templates.error || !templates.data) {
		error(
			templates.response?.status ?? 500,
			problemMessage(templates.error, 'Certificate templates could not be loaded.')
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	// A number nobody issued is not a broken page: it is an answer. The list says so
	// and offers the way back to all of them.
	if (serial) {
		const found = issued.data && 'certificate' in issued.data ? issued.data.certificate : null;

		return {
			templates: templates.data.templates ?? [],
			serial,
			notFound: found ? null : problemMessage(issued.error, 'No certificate carries that number.'),
			certificates: pageOf(found ? [found] : [], undefined, false)
		};
	}

	if (issued.error || !issued.data || !('certificates' in issued.data)) {
		error(
			issued.response?.status ?? 500,
			problemMessage(issued.error, 'This workspace’s certificates could not be loaded.')
		);
	}

	return {
		templates: templates.data.templates ?? [],
		serial: null,
		notFound: null,
		certificates: pageOf(issued.data.certificates, issued.data.next_cursor, issued.data.has_more)
	};
};

export const actions: Actions = {
	/*
		The next page of certificates. The cursor is opaque and goes back unread; one the
		API did not issue comes back a 422, and the page prints the sentence it came with.
	*/
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) error(401, 'Sign in to manage certificates.');

		const cursor = String((await request.formData()).get('cursor') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/certificates', {
			params: { query: { limit: PAGE_SIZE, cursor } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'The next page of certificates could not be loaded.')
			});
		}

		return { more: pageOf(data.certificates, data.next_cursor, data.has_more) };
	},

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

	/** Narrow the list to one number — the handle a registrar already holds. */
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

		const api = authedApi(url.origin, locals.accessToken);
		const { error: problem, response } = await api.POST('/v1/certificates/{serial}/revoke', {
			params: { path: { serial: parsed.value.serial } },
			body: { reason: parsed.value.reason }
		});

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, 'That certificate could not be withdrawn.')
			});
		}

		// The row as it now reads, so it can be replaced where it stands — the reader
		// stays on the page they were paging, and sees the number say it was withdrawn.
		const after = await api.GET('/v1/certificates/{serial}', {
			params: { path: { serial: parsed.value.serial } }
		});

		return { revoked: after.data?.certificate ?? null };
	}
};
