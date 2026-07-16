import { error, fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import { invitationSchema, memberRoleSchema } from '$lib/schemas';
import { parseForm } from '$lib/validation';
import type { Actions, PageServerLoad } from './$types';

/** One page of either list. muallim-api's ceiling is 100; the rest is behind a cursor. */
const PAGE_SIZE = 50;

/*
	The workspace's people: who is in it, and who has been asked.

	No guard of its own. Listing members needs `user:read` and everything else on
	this page needs `user:manage`, and muallim-api is the one that knows which roles
	hold them — so the page asks, and renders the refusal it gets back. Deciding it
	here would be a second copy of the rule, and copies rot.
*/
export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);

	const api = authedApi(url.origin, locals.accessToken);
	const [members, invitations] = await Promise.all([
		api.GET('/v1/members', { params: { query: { limit: PAGE_SIZE } } }),
		api.GET('/v1/invitations', { params: { query: { limit: PAGE_SIZE } } })
	]);

	// A student is refused the members list; an instructor passes that and is refused
	// the invitations. Either way the API's own sentence is what the reader sees.
	if (members.error || !members.data) {
		error(
			members.response?.status ?? 500,
			problemMessage(members.error, "We couldn't load this workspace's people. Please try again.")
		);
	}
	if (invitations.error || !invitations.data) {
		error(
			invitations.response?.status ?? 500,
			problemMessage(
				invitations.error,
				"We couldn't load this workspace's invitations. Please try again."
			)
		);
	}

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		members: pageOf(members.data.members, members.data.next_cursor, members.data.has_more),
		invitations: pageOf(
			invitations.data.invitations,
			invitations.data.next_cursor,
			invitations.data.has_more
		)
	};
};

export const actions: Actions = {
	/*
		The next page of members. The cursor is opaque and goes back unread; one the API
		did not issue comes back a 422, and the page prints the sentence it came with.
	*/
	moreMembers: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fpeople');

		const cursor = String((await request.formData()).get('cursor') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/members', {
			params: { query: { limit: PAGE_SIZE, cursor } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't load more people. Please try again.")
			});
		}

		return { moreMembers: pageOf(data.members, data.next_cursor, data.has_more) };
	},

	/** The next page of invitations. Same cursor, same refusal. */
	moreInvitations: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fpeople');

		const cursor = String((await request.formData()).get('cursor') ?? '');

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET('/v1/invitations', {
			params: { query: { limit: PAGE_SIZE, cursor } }
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't load more invitations. Please try again.")
			});
		}

		return { moreInvitations: pageOf(data.invitations, data.next_cursor, data.has_more) };
	},

	/*
		Promote or demote. muallim-api revokes the member's sessions, so the new role is
		in force on their next request — and it refuses a self-demotion and the removal
		of the last owner, with a 409 whose detail is shown as it came.
	*/
	role: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fpeople');

		const form = await request.formData();
		const userId = String(form.get('user_id') ?? '');

		const parsed = parseForm(memberRoleSchema, form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).PATCH(
			'/v1/members/{user_id}',
			{ params: { path: { user_id: userId } }, body: { role: parsed.value.role } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't change that role. Please try again.")
			});
		}

		// Named, because the page updates that row where it stands rather than re-reading
		// the list: a reader three pages in must not be thrown back to the first.
		return { role: parsed.value.role, user_id: userId };
	},

	/** The membership goes; the person's account does not. They can be invited back. */
	remove: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fpeople');

		const userId = String((await request.formData()).get('user_id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/members/{user_id}',
			{ params: { path: { user_id: userId } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't remove that person. Please try again.")
			});
		}

		return { removed: userId };
	},

	/*
		Invite. The link is emailed to the address and is returned to nobody — which is
		what lets accepting it stand as proof that the person holds that inbox. Only an
		owner may invite an owner; muallim-api answers 403, and the page says so.
	*/
	invite: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fpeople');

		const parsed = parseForm(invitationSchema, await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/invitations', {
			body: parsed.value
		});

		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't send that invitation. Please try again.")
			});
		}

		// The row itself, so the page can put it at the head of a newest-first list
		// without re-reading — and without the token, which the API returns to nobody.
		return { invited: data.invitation };
	},

	/** Withdraw an outstanding invitation. The row stays and reads `revoked`; the link
	 *  in the inbox stops working. */
	withdraw: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login?next=%2Fpeople');

		const id = String((await request.formData()).get('id') ?? '');

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/invitations/{id}',
			{ params: { path: { id } } }
		);

		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't withdraw that invitation. Please try again.")
			});
		}

		return { withdrawn: id };
	}
};
