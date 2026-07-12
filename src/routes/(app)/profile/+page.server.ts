import { redirect } from '@sveltejs/kit';
import { authedApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';

/*
	A profile is what this workspace knows about you, and nothing invented.

	The identity comes from the layout's own /v1/me — asking again here would be a
	second request for an answer already in hand. The rest is what a person has
	*done*: the courses they are on, the points they have, the certificates they
	hold. Every figure has an endpoint behind it.
*/
export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	// The layout's profile is nullable — a session that stopped verifying is cleared
	// there. If it is gone, this page has nobody to be about.
	const { user } = await parent();
	if (!user) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	const api = authedApi(url.origin, locals.accessToken);

	const [enrolments, gamification, certificates] = await Promise.all([
		api.GET('/v1/me/enrolments'),
		api.GET('/v1/me/gamification'),
		api.GET('/v1/me/certificates')
	]);

	return {
		user,
		enrolments: enrolments.data?.enrolments ?? [],
		gamification: gamification.data ?? null,
		certificates: certificates.data?.certificates ?? []
	};
};
