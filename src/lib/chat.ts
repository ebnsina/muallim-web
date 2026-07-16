/**
 * The chat client: the types the screen speaks in, and the one socket it holds.
 *
 * Messages persist over REST and are read back over REST; this file is the *live*
 * half — the WebSocket that carries a message, a typing signal, or a presence
 * change the instant it happens. The socket talks to muallim-api directly rather
 * than through this app, because muallim-api is a different origin and the session
 * cookie is httpOnly: it cannot ride along. So the browser trades a short-lived
 * ticket (minted server-side, where the token lives) for the socket, and fetches a
 * fresh one on every reconnect — a ticket is single-use and expires in a minute.
 */
import type { components } from '$lib/api/schema';

export type Conversation = components['schemas']['ChatConversationView'];
export type Message = components['schemas']['ChatMessageView'];
export type Member = components['schemas']['ChatMemberView'];

/** One event as it arrives over the socket. muallim-api sends exactly these three. */
export type ServerEvent =
	| { type: 'message'; conversation_id: string; message: WireMessage }
	| { type: 'typing'; conversation_id: string; user_id: string }
	| { type: 'presence'; user_id: string; online?: boolean };

/**
 * The shape muallim-api puts on the wire for a live message. It is a `ChatMessageView`
 * minus the fields the socket cannot know for the receiver — `mine` and
 * `conversation_id` live on the envelope, not the message — so the screen fills
 * `mine` itself by comparing `sender_id` to the signed-in user.
 */
export interface WireMessage {
	id: string;
	sender_id: string;
	sender_name: string;
	body: string;
	created_at: string;
}

type Handler = (event: ServerEvent) => void;
type StatusHandler = (status: SocketStatus) => void;

export type SocketStatus = 'connecting' | 'open' | 'closed';

/** How the browser gets a fresh, single-use ticket. The page wires this to its endpoint. */
export type TicketSource = () => Promise<string>;

/** Longest we wait between reconnect attempts. The first retries are quick, then back off. */
const MAX_BACKOFF_MS = 15_000;

/** A typing signal is sent at most this often while the composer has focus and text. */
const TYPING_THROTTLE_MS = 2_000;

/**
 * One socket to muallim-api's chat endpoint, with the reconnection and re-subscription
 * the screen should not have to think about.
 *
 * `subscribe` is remembered, not just sent: a dropped socket comes back with an
 * empty server-side subscription set, so every conversation the screen had open is
 * re-subscribed the moment the new socket opens. The screen calls `subscribe` once
 * per conversation and never again.
 */
export class ChatSocket {
	#url: string;
	#getTicket: TicketSource;
	#ws: WebSocket | null = null;
	#handlers = new Set<Handler>();
	#statusHandlers = new Set<StatusHandler>();
	#subscribed = new Set<string>();
	#backoff = 500;
	#lastTypingAt = new Map<string, number>();
	#closed = false;
	#reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(url: string, getTicket: TicketSource) {
		// A trailing slash on the base would double up against the path. Trim it once.
		this.#url = url.replace(/\/$/, '');
		this.#getTicket = getTicket;
	}

	/** Open the socket. Safe to call once; reconnection is automatic after that. */
	async connect(): Promise<void> {
		this.#closed = false;
		await this.#open();
	}

	async #open(): Promise<void> {
		if (this.#closed) return;
		this.#emitStatus('connecting');
		let ticket: string;
		try {
			ticket = await this.#getTicket();
		} catch {
			// The ticket mint failed — API down, or the session lapsed. Back off and
			// try the whole dance again; a lapsed session resolves at the next reload.
			this.#scheduleReconnect();
			return;
		}
		if (this.#closed) return;

		const ws = new WebSocket(`${this.#url}/v1/chat/ws?ticket=${encodeURIComponent(ticket)}`);
		this.#ws = ws;

		ws.onopen = () => {
			this.#backoff = 500;
			this.#emitStatus('open');
			// A fresh socket knows nothing of what we had open. Re-subscribe everything.
			for (const conv of this.#subscribed)
				this.#sendRaw({ type: 'subscribe', conversation_id: conv });
		};

		ws.onmessage = (e) => {
			let event: ServerEvent;
			try {
				event = JSON.parse(e.data);
			} catch {
				return;
			}
			for (const h of this.#handlers) h(event);
		};

		ws.onclose = () => {
			this.#ws = null;
			this.#emitStatus('closed');
			this.#scheduleReconnect();
		};

		// An error is always followed by a close, which is where reconnect lives.
		ws.onerror = () => ws.close();
	}

	#scheduleReconnect(): void {
		if (this.#closed || this.#reconnectTimer) return;
		const delay = this.#backoff;
		this.#backoff = Math.min(this.#backoff * 2, MAX_BACKOFF_MS);
		this.#reconnectTimer = setTimeout(() => {
			this.#reconnectTimer = null;
			void this.#open();
		}, delay);
	}

	/** Ask muallim-api to route this conversation's events to us, now and after any reconnect. */
	subscribe(conversationId: string): void {
		this.#subscribed.add(conversationId);
		this.#sendRaw({ type: 'subscribe', conversation_id: conversationId });
	}

	/**
	 * Tell the conversation the user is typing — throttled, because a keystroke is
	 * not an event. muallim-api never echoes a typing signal back to its sender.
	 */
	sendTyping(conversationId: string): void {
		const now = Date.now();
		const last = this.#lastTypingAt.get(conversationId) ?? 0;
		if (now - last < TYPING_THROTTLE_MS) return;
		this.#lastTypingAt.set(conversationId, now);
		this.#sendRaw({ type: 'typing', conversation_id: conversationId });
	}

	/** Subscribe to every event. Returns an unsubscribe. */
	on(handler: Handler): () => void {
		this.#handlers.add(handler);
		return () => this.#handlers.delete(handler);
	}

	/** Watch the connection state, for a quiet "reconnecting…" line. Returns an unsubscribe. */
	onStatus(handler: StatusHandler): () => void {
		this.#statusHandlers.add(handler);
		return () => this.#statusHandlers.delete(handler);
	}

	/** Close for good — on component teardown. No reconnect follows this. */
	close(): void {
		this.#closed = true;
		if (this.#reconnectTimer) {
			clearTimeout(this.#reconnectTimer);
			this.#reconnectTimer = null;
		}
		this.#ws?.close();
		this.#ws = null;
	}

	#sendRaw(payload: unknown): void {
		if (this.#ws?.readyState === WebSocket.OPEN) this.#ws.send(JSON.stringify(payload));
	}

	#emitStatus(status: SocketStatus): void {
		for (const h of this.#statusHandlers) h(status);
	}
}

/**
 * What to call a conversation in the list and at the top of the pane.
 *
 * A group and a course channel carry their own title. A direct message does not —
 * "direct" is a kind, not a name — so it is titled by the other person. In the
 * open pane that person is in `members` (the detail endpoint returns them). The
 * list endpoint omits members to stay one query, so there we name the DM by whoever
 * last spoke in it when that was not us — the common case — and fall back to a
 * generic label only for a brand-new DM nobody has answered yet.
 */
export function conversationTitle(conversation: Conversation, meId: string | undefined): string {
	if (conversation.kind === 'direct') {
		const other = conversation.members?.find((m) => m.user_id !== meId);
		if (other) return other.name;
		const last = conversation.last_message;
		if (last && !last.mine && last.sender_name) return last.sender_name;
		return 'Direct message';
	}
	return conversation.title || 'Conversation';
}

/** The other member of a DM, for the presence dot next to its name. Undefined for a group. */
export function directPartner(
	conversation: Conversation,
	meId: string | undefined
): Member | undefined {
	if (conversation.kind !== 'direct') return undefined;
	return conversation.members?.find((m) => m.user_id !== meId);
}

/** Two initials for the avatar. "Aisha Rahman" → "AR", "Bilal" → "B". */
export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	if (parts.length === 1) return parts[0][0]!.toUpperCase();
	return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}

/** A count for a badge. Past 99 it is "99+", because the exact number stopped mattering. */
export function unreadLabel(unread: number): string {
	return unread > 99 ? '99+' : String(unread);
}
