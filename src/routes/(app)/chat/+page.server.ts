import { fail, redirect } from '@sveltejs/kit';
import { problemMessage } from '$lib/api';
import { pageOf } from '$lib/paging';
import { authedApi } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/** One page of conversations, and one page of messages. muallim-api's ceiling is 100. */
const CONVERSATION_LIMIT = 40;
const MESSAGE_LIMIT = 40;

/** The composer's own limit; muallim-api validates again behind it. */
const MAX_BODY = 4000;

/*
	The chat screen: the conversations down the left, and — when `?c=` names one —
	its members and its messages on the right.

	Selecting a conversation is a navigation to `?c=<id>`, so this load fetches the
	pane. The socket that carries live messages lives in the page component and
	survives the navigation, so switching conversations reloads history without
	tearing down the connection.

	No guard beyond a session. muallim-api decides who may read a conversation, and
	returns 403/404 when they may not; the pane simply stays empty for a `?c=` the
	reader cannot open, rather than this page keeping a second copy of that rule.
*/
export const load: PageServerLoad = async ({ locals, url, parent, setHeaders }) => {
	if (!locals.accessToken) redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	setHeaders({ 'cache-control': 'private, no-store' });

	// Who "I" am, for "mine" bubbles, DM titles, and presence. It comes from the
	// layout, which loaded it already; asking `/v1/me` again here would be a second
	// request for an answer in hand.
	const { user } = await parent();

	const api = authedApi(url.origin, locals.accessToken);
	const selectedId = url.searchParams.get('c');

	// The list, the workspace's people for the "start a DM" picker, and the courses
	// for the "open a channel" picker. A student may be refused the member list — then
	// that picker is simply empty, not an error.
	const [conversations, members, courses] = await Promise.all([
		api.GET('/v1/chat/conversations', { params: { query: { limit: CONVERSATION_LIMIT } } }),
		api.GET('/v1/members', { params: { query: { limit: 100 } } }),
		api.GET('/v1/courses', { params: { query: { limit: 50 } } })
	]);

	const conversationPage = pageOf(
		conversations.data?.conversations,
		conversations.data?.next_cursor,
		Boolean(conversations.data?.next_cursor)
	);

	let selected = null;
	if (selectedId) {
		const [detail, history] = await Promise.all([
			api.GET('/v1/chat/conversations/{id}', { params: { path: { id: selectedId } } }),
			api.GET('/v1/chat/conversations/{id}/messages', {
				params: { path: { id: selectedId }, query: { limit: MESSAGE_LIMIT } }
			})
		]);

		if (detail.data) {
			// The page is DESC (newest first). The screen reads oldest-at-top, so reverse
			// it; the cursor still points further back, at older messages.
			const rows = (history.data?.messages ?? []).slice().reverse();
			selected = {
				conversation: detail.data.conversation,
				messages: rows,
				cursor: history.data?.next_cursor,
				hasMore: Boolean(history.data?.next_cursor)
			};
		}
	}

	return {
		meId: user?.id,
		selectedId,
		conversations: conversationPage,
		people: members.data?.members ?? [],
		courses: (courses.data?.courses ?? []).map((c) => ({ slug: c.slug, title: c.title })),
		selected
	};
};

export const actions: Actions = {
	/*
		Start a DM or open a group. muallim-api returns the conversation — existing DMs
		are folded onto the one that is already there — and we land the reader in it.
	*/
	create: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');
		const form = await request.formData();
		const kind = form.get('kind');

		let body: { kind: 'direct' | 'group'; user_id?: string; title?: string; member_ids?: string[] };
		if (kind === 'direct') {
			const userId = String(form.get('user_id') ?? '').trim();
			if (!userId) return fail(400, { message: 'Pick a person to message.' });
			body = { kind: 'direct', user_id: userId };
		} else if (kind === 'group') {
			const title = String(form.get('title') ?? '').trim();
			const memberIds = form.getAll('member_ids').map(String).filter(Boolean);
			if (!title) return fail(400, { message: 'A group needs a name.' });
			if (memberIds.length === 0) return fail(400, { message: 'Add at least one member.' });
			body = { kind: 'group', title, member_ids: memberIds };
		} else {
			return fail(400, { message: "We couldn't start that conversation. Please try again." });
		}

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/chat/conversations', { body });
		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't start that conversation. Please try again.")
			});
		}
		redirect(303, `/chat?c=${data.conversation.id}`);
	},

	/*
		Send a message. muallim-api persists it and broadcasts it back over the socket to
		every member — the sender included — so the reply arrives the same way a
		received one does. The created message is returned here too, and the screen
		dedupes the two by id.
	*/
	send: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');
		const form = await request.formData();
		const id = String(form.get('conversation_id') ?? '');
		const body = String(form.get('body') ?? '').trim();
		if (!id) return fail(400, { message: 'Open a conversation first.' });
		if (!body) return fail(400, { sendError: 'Type a message first.' });
		if (body.length > MAX_BODY)
			return fail(400, { sendError: 'That message is too long. Please shorten it and try again.' });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/chat/conversations/{id}/messages',
			{ params: { path: { id } }, body: { body } }
		);
		if (problem || !data) {
			return fail(response?.status ?? 500, {
				sendError: problemMessage(problem, "We couldn't send that message. Please try again.")
			});
		}
		return { sent: data.message };
	},

	/*
		Open (or join) a course's channel and land in it. Every enrolled member shares
		the one channel, so muallim-api folds a repeat join onto the conversation already
		there rather than making a second.
	*/
	channel: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');
		const form = await request.formData();
		const slug = String(form.get('slug') ?? '').trim();
		if (!slug) return fail(400, { message: 'Pick a course.' });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).POST('/v1/courses/{slug}/chat/channel', {
			params: { path: { slug } }
		});
		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't open that course channel. Please try again.")
			});
		}
		redirect(303, `/chat?c=${data.conversation.id}`);
	},

	/* Mark a conversation read up to now. Fired when it is opened; the badge clears. */
	read: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');
		const form = await request.formData();
		const id = String(form.get('conversation_id') ?? '');
		if (!id) return fail(400, { message: 'Open a conversation first.' });

		await authedApi(url.origin, locals.accessToken).POST('/v1/chat/conversations/{id}/read', {
			params: { path: { id } }
		});
		return { read: id };
	},

	/*
		Add somebody to a group. Group admins only — muallim-api is the judge; the
		screen only offers the control to somebody it believes holds it.
	*/
	addMember: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');
		const form = await request.formData();
		const id = String(form.get('conversation_id') ?? '');
		const userId = String(form.get('user_id') ?? '');
		if (!id || !userId) return fail(400, { message: 'Choose who to add.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).POST(
			'/v1/chat/conversations/{id}/members',
			{ params: { path: { id } }, body: { user_id: userId } }
		);
		// 204: there is no body to check, so the absence of a problem is the success.
		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't add them to this group. Please try again.")
			});
		}
		return { memberAdded: userId };
	},

	/* Remove somebody from a group. Also admins only, and also a 204. */
	removeMember: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');
		const form = await request.formData();
		const id = String(form.get('conversation_id') ?? '');
		const userId = String(form.get('user_id') ?? '');
		if (!id || !userId) return fail(400, { message: 'Choose who to remove.' });

		const { error: problem, response } = await authedApi(url.origin, locals.accessToken).DELETE(
			'/v1/chat/conversations/{id}/members/{user_id}',
			{ params: { path: { id, user_id: userId } } }
		);
		if (problem) {
			return fail(response?.status ?? 500, {
				message: problemMessage(
					problem,
					"We couldn't remove them from this group. Please try again."
				)
			});
		}
		return { memberRemoved: userId };
	},

	/* An older page of messages, for scrolling back. The screen prepends them. */
	more: async ({ request, locals, url }) => {
		if (!locals.accessToken) redirect(303, '/login');
		const form = await request.formData();
		const id = String(form.get('conversation_id') ?? '');
		const cursor = String(form.get('cursor') ?? '');
		if (!id || !cursor) return fail(400, { message: 'Nothing more to load.' });

		const {
			data,
			error: problem,
			response
		} = await authedApi(url.origin, locals.accessToken).GET(
			'/v1/chat/conversations/{id}/messages',
			{ params: { path: { id }, query: { limit: MESSAGE_LIMIT, cursor } } }
		);
		if (problem || !data) {
			return fail(response?.status ?? 500, {
				message: problemMessage(problem, "We couldn't load older messages. Please try again.")
			});
		}
		// DESC again; reverse so the older page reads oldest-at-top when prepended.
		return {
			older: (data.messages ?? []).slice().reverse(),
			cursor: data.next_cursor,
			hasMore: Boolean(data.next_cursor)
		};
	}
};
