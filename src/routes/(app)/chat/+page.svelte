<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { enhance, deserialize } from '$app/forms';
	import { env } from '$env/dynamic/public';
	import {
		Message01Icon,
		SentIcon,
		PlusSignIcon,
		UserGroupIcon,
		UserIcon,
		BookOpen01Icon,
		Search01Icon,
		ArrowLeft01Icon
	} from '@hugeicons/core-free-icons';
	import { Button, Icon, EmptyState } from '$lib/components';
	import Sheet from '$lib/components/Sheet.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { relativeTime, exactTime } from '$lib/features/forum';
	import {
		ChatSocket,
		conversationTitle,
		directPartner,
		initials,
		unreadLabel,
		type Conversation,
		type Message,
		type ServerEvent,
		type SocketStatus
	} from '$lib/chat';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const meId = $derived(data.meId);
	const WS_URL = env.PUBLIC_CHAT_WS_URL || 'ws://localhost:8080';

	// The list. Seeded from the server on every navigation (its unread counts are the
	// authoritative ones); mutated between navigations by live events.
	let conversations = $state<Conversation[]>([]);
	$effect(() => {
		conversations = data.conversations.rows.map((c) => ({ ...c }));
	});

	const selected = $derived(data.selected);
	const selectedId = $derived(data.selectedId ?? undefined);

	// Members of the open conversation, by id — so a group message whose live payload
	// carries no sender_name can still be attributed to the right person.
	const memberNames = $derived(
		new Map((selected?.conversation.members ?? []).map((m) => [m.user_id, m.name]))
	);
	function senderLabel(m: Message): string {
		return m.sender_name || memberNames.get(m.sender_id ?? '') || 'Member';
	}

	// The DM partner's name, learned and kept for the session. The list endpoint omits
	// members and muallim-api's live payload omits sender_name, so a DM whose last word
	// was ours has nothing left to name it by. We learn it the moment the DM is opened
	// (its members load), and the list stays named.
	let dmNames = $state<Record<string, string>>({});
	function learnName(id: string, name: string) {
		if (name && dmNames[id] !== name) dmNames = { ...dmNames, [id]: name };
	}
	$effect(() => {
		const c = selected?.conversation;
		if (c?.kind === 'direct') {
			const partner = directPartner(c, meId);
			if (partner) learnName(c.id, partner.name);
		}
	});

	function listTitle(c: Conversation): string {
		if (c.kind === 'direct' && dmNames[c.id]) return dmNames[c.id];
		return conversationTitle(c, meId);
	}

	// The list, filtered by the search box.
	let query = $state('');
	const filtered = $derived(
		query.trim()
			? conversations.filter((c) => listTitle(c).toLowerCase().includes(query.trim().toLowerCase()))
			: conversations
	);

	// The open conversation's messages, oldest at top. Reseeded when the selection
	// changes; appended to live. `olderCursor` walks further back on demand.
	let messages = $state<Message[]>([]);
	let olderCursor = $state<string | undefined>(undefined);
	let hasOlder = $state(false);
	let loadingOlder = $state(false);
	$effect(() => {
		selected?.conversation.id; // reseed on selection change, not on live append
		messages = selected ? selected.messages.slice() : [];
		olderCursor = selected?.cursor;
		hasOlder = selected?.hasMore ?? false;
	});

	// Consecutive messages from one sender within a few minutes read as one turn: the
	// avatar, name, and time show once, the rest tuck in tight (Slack/Claude style).
	const GROUP_GAP_MS = 5 * 60 * 1000;
	const items = $derived(
		messages.map((m, i) => {
			const prev = messages[i - 1];
			const next = messages[i + 1];
			const near = (a?: Message, b?: Message) =>
				a &&
				b &&
				a.sender_id === b.sender_id &&
				Math.abs(Date.parse(a.created_at) - Date.parse(b.created_at)) < GROUP_GAP_MS;
			return { m, first: !near(prev, m), last: !near(m, next) };
		})
	);

	// Who is typing in the open conversation, and who is online workspace-wide. Both
	// are built from socket events — muallim-api sends no snapshot, so presence is known
	// only once a peer (re)connects or drops.
	let typing = $state<Set<string>>(new Set());
	const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
	let online = $state<Set<string>>(new Set());
	let status = $state<SocketStatus>('connecting');

	let socket: ChatSocket | undefined;
	let paneEl = $state<HTMLDivElement | null>(null);
	let composerEl = $state<HTMLTextAreaElement | null>(null);
	let draft = $state('');
	let sendError = $state<string | undefined>();

	async function getTicket(): Promise<string> {
		const res = await fetch('/chat/ticket', { method: 'POST' });
		if (!res.ok) throw new Error('ticket');
		const { ticket } = await res.json();
		return ticket as string;
	}

	function handleEvent(event: ServerEvent) {
		if (event.type === 'message') {
			const m = event.message;
			const mine = m.sender_id === meId;
			const conv = conversations.find((c) => c.id === event.conversation_id);
			if (conv) {
				// The live payload omits sender_name; the DM list title reads it, so carry
				// the partner's known name forward rather than blank it.
				const senderName =
					m.sender_name ||
					(conv.last_message && !conv.last_message.mine ? conv.last_message.sender_name : '');
				conv.last_message = {
					id: m.id,
					conversation_id: event.conversation_id,
					sender_id: m.sender_id,
					sender_name: senderName,
					body: m.body,
					created_at: m.created_at,
					mine
				};
				conv.last_message_at = m.created_at;
				if (event.conversation_id !== selectedId) conv.unread += 1;
				conversations.sort((a, b) => Date.parse(b.last_message_at) - Date.parse(a.last_message_at));
			}
			if (event.conversation_id === selectedId && !messages.some((x) => x.id === m.id)) {
				messages.push({
					id: m.id,
					conversation_id: event.conversation_id,
					sender_id: m.sender_id,
					sender_name: m.sender_name,
					body: m.body,
					created_at: m.created_at,
					mine
				});
				scrollToBottom();
			}
		} else if (event.type === 'typing') {
			if (event.conversation_id !== selectedId || event.user_id === meId) return;
			typing.add(event.user_id);
			typing = new Set(typing);
			clearTimeout(typingTimers.get(event.user_id));
			typingTimers.set(
				event.user_id,
				setTimeout(() => {
					typing.delete(event.user_id);
					typing = new Set(typing);
				}, 4000)
			);
		} else if (event.type === 'presence') {
			if (event.online) online.add(event.user_id);
			else online.delete(event.user_id);
			online = new Set(online);
		}
	}

	onMount(() => {
		socket = new ChatSocket(WS_URL, getTicket);
		const off = socket.on(handleEvent);
		const offStatus = socket.onStatus((s) => (status = s));
		void socket.connect();
		return () => {
			off();
			offStatus();
			socket?.close();
			for (const t of typingTimers.values()) clearTimeout(t);
		};
	});

	// Subscribe to every conversation in the list, so a message in one that is not open
	// still bumps its unread. The socket remembers these across reconnects.
	$effect(() => {
		if (!socket) return;
		for (const c of conversations) socket.subscribe(c.id);
	});

	// On opening a conversation: scroll to the foot, clear the last one's typing, and
	// mark it read so its badge clears here and on every other device.
	$effect(() => {
		const id = selectedId;
		if (!id) return;
		typing = new Set();
		scrollToBottom();
		void markRead(id);
	});

	async function markRead(id: string) {
		const fd = new FormData();
		fd.set('conversation_id', id);
		await fetch('/chat?/read', { method: 'POST', body: fd });
		const conv = conversations.find((c) => c.id === id);
		if (conv) conv.unread = 0;
	}

	async function scrollToBottom() {
		await tick();
		if (paneEl) paneEl.scrollTop = paneEl.scrollHeight;
	}

	function grow() {
		const el = composerEl;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
	}

	async function loadOlder() {
		if (!selected || !olderCursor || loadingOlder) return;
		loadingOlder = true;
		const before = paneEl?.scrollHeight ?? 0;
		const fd = new FormData();
		fd.set('conversation_id', selected.conversation.id);
		fd.set('cursor', olderCursor);
		const res = await fetch('/chat?/more', { method: 'POST', body: fd });
		const result = deserialize(await res.text());
		if (result.type === 'success' && result.data) {
			const older = (result.data.older ?? []) as Message[];
			const seen = new Set(messages.map((m) => m.id));
			messages = [...older.filter((m) => !seen.has(m.id)), ...messages];
			olderCursor = result.data.cursor as string | undefined;
			hasOlder = Boolean(result.data.hasMore);
			await tick();
			if (paneEl) paneEl.scrollTop = paneEl.scrollHeight - before; // hold the reader's place
		}
		loadingOlder = false;
	}

	function onComposerInput() {
		grow();
		if (selectedId && socket) socket.sendTyping(selectedId);
	}

	function onComposerKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (draft.trim()) (e.currentTarget as HTMLTextAreaElement).form?.requestSubmit();
		}
	}

	function select(id: string) {
		if (id === selectedId) return;
		void goto(`/chat?c=${id}`, { keepFocus: true, noScroll: true });
	}

	// The composer submits over REST; the reply arrives back over the socket, so the
	// jobs here are clearing the box and folding in the server's copy (deduped against
	// the socket's) the moment it returns.
	const sendEnhance: SubmitFunction = () => {
		const body = draft;
		draft = '';
		sendError = undefined;
		tick().then(grow);
		return async ({ result }) => {
			if (result.type === 'success' && result.data?.sent) {
				const m = result.data.sent as Message;
				if (!messages.some((x) => x.id === m.id)) {
					messages.push({ ...m, mine: true });
					scrollToBottom();
				}
			} else if (result.type === 'failure') {
				sendError = (result.data?.sendError as string) ?? 'Message not sent.';
				draft = body; // give the text back so nothing is lost
				tick().then(grow);
			}
		};
	};

	// ── New conversation ────────────────────────────────────────────────────────
	type NewKind = 'direct' | 'group' | 'channel' | null;
	let sheet = $state<NewKind>(null);
	let newMenu = $state(false);
	let pickerQuery = $state('');
	let createError = $state<string | undefined>();
	let groupTitle = $state('');
	let groupMembers = $state<Set<string>>(new Set());

	const people = $derived(data.people.filter((p) => p.user_id !== meId));
	const filteredPeople = $derived(
		pickerQuery.trim()
			? people.filter((p) => p.name.toLowerCase().includes(pickerQuery.trim().toLowerCase()))
			: people
	);
	const filteredCourses = $derived(
		pickerQuery.trim()
			? data.courses.filter((c) => c.title.toLowerCase().includes(pickerQuery.trim().toLowerCase()))
			: data.courses
	);

	function openSheet(kind: NewKind) {
		sheet = kind;
		newMenu = false;
		pickerQuery = '';
		createError = undefined;
		groupTitle = '';
		groupMembers = new Set();
	}

	function toggleMember(id: string) {
		if (groupMembers.has(id)) groupMembers.delete(id);
		else groupMembers.add(id);
		groupMembers = new Set(groupMembers);
	}

	const createEnhance: SubmitFunction = () => {
		createError = undefined;
		return async ({ result }) => {
			if (result.type === 'redirect') {
				sheet = null;
				await goto(result.location, { invalidateAll: true, noScroll: true });
			} else if (result.type === 'failure') {
				createError = (result.data?.message as string) ?? 'Could not start that conversation.';
			}
		};
	};

	function partnerOnline(c: Conversation) {
		const p = directPartner(c, meId);
		return p ? online.has(p.user_id) : false;
	}

	const selectedTitle = $derived(selected ? conversationTitle(selected.conversation, meId) : '');
	const selectedPartner = $derived(
		selected ? directPartner(selected.conversation, meId) : undefined
	);
	const typingNames = $derived(
		selected ? [...typing].map((id) => memberNames.get(id) ?? 'Someone') : []
	);
</script>

<svelte:head><title>Chat — Muallim</title></svelte:head>

<div class="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
	<div
		class="grid h-[calc(100dvh-7.5rem)] grid-cols-1 overflow-hidden rounded-card border border-border bg-surface-raised shadow-sm md:grid-cols-[20rem_1fr]"
	>
		<!-- ── Sidebar ───────────────────────────────────────────────────────── -->
		<aside
			class="flex min-h-0 flex-col border-b border-border md:border-r md:border-b-0 {selectedId
				? 'hidden md:flex'
				: 'flex'}"
		>
			<div class="relative space-y-3 border-b border-border p-3">
				<div class="flex items-center justify-between">
					<h1 class="px-1 text-sm font-semibold">Messages</h1>
					<div class="relative">
						<Button size="sm" onclick={() => (newMenu = !newMenu)}>
							<Icon icon={PlusSignIcon} class="size-4" />
							New
						</Button>
						{#if newMenu}
							<button
								type="button"
								class="fixed inset-0 z-10 cursor-default"
								aria-label="Close menu"
								onclick={() => (newMenu = false)}
							></button>
							<div
								class="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-card border border-border bg-surface-raised py-1 shadow-lg"
							>
								<button
									type="button"
									class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-hover"
									onclick={() => openSheet('direct')}
								>
									<Icon icon={UserIcon} class="size-4 text-muted" /> Direct message
								</button>
								<button
									type="button"
									class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-hover"
									onclick={() => openSheet('group')}
								>
									<Icon icon={UserGroupIcon} class="size-4 text-muted" /> New group
								</button>
								<button
									type="button"
									class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-hover"
									onclick={() => openSheet('channel')}
								>
									<Icon icon={BookOpen01Icon} class="size-4 text-muted" /> Course channel
								</button>
							</div>
						{/if}
					</div>
				</div>

				<div class="relative">
					<Icon
						icon={Search01Icon}
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
					/>
					<input
						bind:value={query}
						placeholder="Search conversations"
						class="h-9 w-full rounded-control border border-border bg-surface-sunken pr-3 pl-9 text-sm text-text placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					/>
				</div>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto p-2">
				{#if filtered.length === 0}
					<div class="p-6">
						<EmptyState
							icon={Message01Icon}
							title={query ? 'No matches' : 'No conversations yet'}
							description={query
								? 'Nothing here by that name.'
								: 'Start a direct message, a group, or a course channel.'}
						/>
					</div>
				{:else}
					<ul class="space-y-0.5">
						{#each filtered as c (c.id)}
							<li>
								<button
									type="button"
									onclick={() => select(c.id)}
									class="flex w-full items-center gap-3 rounded-control px-2.5 py-2.5 text-left transition-colors {c.id ===
									selectedId
										? 'bg-surface-active'
										: 'hover:bg-surface-hover'}"
								>
									<span class="relative shrink-0">
										<span
											class="flex size-10 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold text-muted"
										>
											{#if c.kind === 'group'}
												<Icon icon={UserGroupIcon} class="size-5" />
											{:else if c.kind === 'course'}
												<Icon icon={BookOpen01Icon} class="size-5" />
											{:else}
												{initials(listTitle(c))}
											{/if}
										</span>
										{#if c.kind === 'direct' && partnerOnline(c)}
											<span
												class="absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface-raised bg-success"
												title="Online"
											></span>
										{/if}
									</span>

									<span class="min-w-0 flex-1">
										<span class="flex items-baseline justify-between gap-2">
											<span class="truncate text-sm font-medium">{listTitle(c)}</span>
											{#if c.last_message}
												<span class="shrink-0 text-[0.7rem] text-muted"
													>{relativeTime(c.last_message_at)}</span
												>
											{/if}
										</span>
										<span class="mt-0.5 flex items-center justify-between gap-2">
											<span class="truncate text-xs text-muted">
												{#if c.last_message}
													{c.last_message.mine ? 'You: ' : ''}{c.last_message.body}
												{:else}
													No messages yet
												{/if}
											</span>
											{#if c.unread > 0}
												<span
													class="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[0.7rem] font-semibold text-on-solid"
												>
													{unreadLabel(c.unread)}
												</span>
											{/if}
										</span>
									</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</aside>

		<!-- ── Thread ────────────────────────────────────────────────────────── -->
		<section class="flex min-h-0 flex-col bg-surface {selectedId ? 'flex' : 'hidden md:flex'}">
			{#if !selected}
				<div class="flex flex-1 items-center justify-center p-6">
					<EmptyState
						icon={Message01Icon}
						title="Your messages"
						description="Pick a conversation, or start a new one."
					/>
				</div>
			{:else}
				{@const kind = selected.conversation.kind}
				<header
					class="flex items-center gap-3 border-b border-border bg-surface-raised/60 px-4 py-3"
				>
					<button
						type="button"
						class="rounded-control p-1 text-muted hover:bg-surface-hover md:hidden"
						onclick={() => goto('/chat', { keepFocus: true, noScroll: true })}
						aria-label="Back"
					>
						<Icon icon={ArrowLeft01Icon} class="size-5" />
					</button>
					<span
						class="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold text-muted"
					>
						{#if kind === 'group'}
							<Icon icon={UserGroupIcon} class="size-5" />
						{:else if kind === 'course'}
							<Icon icon={BookOpen01Icon} class="size-5" />
						{:else}
							{initials(selectedTitle)}
						{/if}
					</span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold">{selectedTitle}</p>
						<p class="truncate text-xs text-muted">
							{#if kind === 'direct'}
								{selectedPartner && online.has(selectedPartner.user_id) ? 'Online' : 'Offline'}
							{:else}
								{selected.conversation.members?.length ?? 0} members
							{/if}
						</p>
					</div>
					{#if status !== 'open'}
						<span class="text-xs text-muted"
							>{status === 'connecting' ? 'Connecting…' : 'Reconnecting…'}</span
						>
					{/if}
				</header>

				<div bind:this={paneEl} class="min-h-0 flex-1 overflow-y-auto">
					<div class="mx-auto max-w-3xl px-4 py-6">
						{#if hasOlder}
							<div class="flex justify-center pb-4">
								<Button size="sm" variant="secondary" loading={loadingOlder} onclick={loadOlder}>
									Load earlier messages
								</Button>
							</div>
						{/if}

						{#if messages.length === 0}
							<p class="py-16 text-center text-sm text-muted">No messages yet — say hello.</p>
						{/if}

						{#if kind === 'direct'}
							<!-- 1:1 — chat bubbles, mine right, theirs left. -->
							{#each items as { m, first, last } (m.id)}
								<div
									class="flex {m.mine ? 'justify-end' : 'justify-start'} {first
										? 'mt-3'
										: 'mt-0.5'}"
								>
									<div class="max-w-[80%] sm:max-w-[68%]">
										<div
											class="px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap {m.mine
												? 'rounded-2xl rounded-br-md bg-accent text-on-solid'
												: 'rounded-2xl rounded-bl-md bg-surface-sunken text-text'}"
										>
											{m.body}
										</div>
										{#if last}
											<p
												class="mt-1 px-1 text-[0.65rem] text-muted {m.mine ? 'text-right' : ''}"
												title={exactTime(m.created_at)}
											>
												{relativeTime(m.created_at)}
											</p>
										{/if}
									</div>
								</div>
							{/each}
						{:else}
							<!-- Group / course — left-aligned, sender-labeled, tightly grouped. -->
							{#each items as { m, first } (m.id)}
								<div class="flex gap-3 {first ? 'mt-5' : 'mt-0.5'}">
									<div class="w-9 shrink-0">
										{#if first}
											<span
												class="flex size-9 items-center justify-center rounded-full bg-surface-sunken text-[0.7rem] font-semibold text-muted"
												>{initials(senderLabel(m))}</span
											>
										{/if}
									</div>
									<div class="min-w-0 flex-1">
										{#if first}
											<div class="flex items-baseline gap-2">
												<span class="text-sm font-semibold {m.mine ? 'text-accent-text' : ''}"
													>{senderLabel(m)}</span
												>
												<span class="text-[0.65rem] text-muted" title={exactTime(m.created_at)}
													>{relativeTime(m.created_at)}</span
												>
											</div>
										{/if}
										<div class="text-sm leading-relaxed break-words whitespace-pre-wrap text-text">
											{m.body}
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Composer -->
				<div class="border-t border-border bg-surface-raised/60 px-4 py-3">
					<div class="mx-auto max-w-3xl">
						{#if typingNames.length > 0}
							<div class="mb-2 flex items-center gap-2 px-1 text-xs text-muted">
								<span class="flex items-end gap-0.5">
									<span
										class="typing-dot size-1.5 rounded-full bg-muted"
										style="animation-delay:0ms"
									></span>
									<span
										class="typing-dot size-1.5 rounded-full bg-muted"
										style="animation-delay:150ms"
									></span>
									<span
										class="typing-dot size-1.5 rounded-full bg-muted"
										style="animation-delay:300ms"
									></span>
								</span>
								<span
									>{typingNames.length === 1
										? `${typingNames[0]} is typing`
										: `${typingNames.length} people are typing`}</span
								>
							</div>
						{/if}

						<form method="POST" action="?/send" use:enhance={sendEnhance}>
							<input type="hidden" name="conversation_id" value={selected.conversation.id} />
							<div
								class="flex items-end gap-2 rounded-3xl border border-border bg-surface px-3 py-2 focus-within:ring-2 focus-within:ring-ring"
							>
								<textarea
									bind:this={composerEl}
									bind:value={draft}
									name="body"
									rows="1"
									oninput={onComposerInput}
									onkeydown={onComposerKey}
									placeholder="Message… (Enter to send, Shift+Enter for a new line)"
									aria-label="Write a message"
									class="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-text placeholder:text-muted focus:outline-none"
								></textarea>
								<button
									type="submit"
									disabled={!draft.trim()}
									aria-label="Send"
									class="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-solid transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
								>
									<Icon icon={SentIcon} class="size-4" />
								</button>
							</div>
						</form>
						{#if sendError}
							<p class="mt-1.5 px-2 text-xs font-medium text-danger-text" role="alert">
								{sendError}
							</p>
						{/if}
					</div>
				</div>
			{/if}
		</section>
	</div>
</div>

<!-- ── New DM ─────────────────────────────────────────────────────────────── -->
{#if sheet === 'direct'}
	<Sheet open onClose={() => (sheet = null)}>
		{#snippet header()}
			<h2 class="text-base font-semibold">New message</h2>
			<p class="mt-0.5 text-sm text-muted">Pick a person to start a direct message.</p>
		{/snippet}

		<div class="mb-3">
			<input
				bind:value={pickerQuery}
				placeholder="Search people…"
				class="h-10 w-full rounded-control border border-border bg-surface-sunken px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			/>
		</div>
		{#if filteredPeople.length === 0}
			<p class="py-6 text-center text-sm text-muted">No people to message.</p>
		{:else}
			<ul class="divide-y divide-border">
				{#each filteredPeople as p (p.user_id)}
					<li>
						<form method="POST" action="?/create" use:enhance={createEnhance}>
							<input type="hidden" name="kind" value="direct" />
							<input type="hidden" name="user_id" value={p.user_id} />
							<button
								type="submit"
								class="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
							>
								<span
									class="flex size-9 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold text-muted"
									>{initials(p.name)}</span
								>
								<span class="min-w-0">
									<span class="block truncate text-sm font-medium">{p.name}</span>
									<span class="block truncate text-xs text-muted capitalize">{p.role}</span>
								</span>
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
		{#if createError}
			<p class="mt-3 text-xs font-medium text-danger-text" role="alert">{createError}</p>
		{/if}

		{#snippet footer()}
			<Button type="button" variant="secondary" onclick={() => (sheet = null)}>Cancel</Button>
		{/snippet}
	</Sheet>
{/if}

<!-- ── New group ──────────────────────────────────────────────────────────── -->
{#if sheet === 'group'}
	<form method="POST" action="?/create" use:enhance={createEnhance}>
		<input type="hidden" name="kind" value="group" />
		<Sheet open onClose={() => (sheet = null)}>
			{#snippet header()}
				<h2 class="text-base font-semibold">New group</h2>
				<p class="mt-0.5 text-sm text-muted">Name the group and choose who is in it.</p>
			{/snippet}

			<div class="space-y-4">
				<div>
					<label for="group-title" class="mb-1.5 block text-sm font-medium">Group name</label>
					<input
						id="group-title"
						name="title"
						bind:value={groupTitle}
						placeholder="e.g. Study circle"
						class="h-10 w-full rounded-control border border-border bg-surface-sunken px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					/>
				</div>
				<div>
					<p class="mb-1.5 text-sm font-medium">Members</p>
					{#if people.length === 0}
						<p class="text-sm text-muted">No one else in this workspace to add.</p>
					{:else}
						<ul class="max-h-64 space-y-1 overflow-y-auto rounded-control border border-border p-1">
							{#each people as p (p.user_id)}
								<li>
									<label
										class="flex cursor-pointer items-center gap-3 rounded-control px-2 py-1.5 hover:bg-surface-hover"
									>
										<Checkbox
											name="member_ids"
											value={p.user_id}
											checked={groupMembers.has(p.user_id)}
											onchange={() => toggleMember(p.user_id)}
										/>
										<span class="flex-1 truncate text-sm">{p.name}</span>
										<span class="text-xs text-muted capitalize">{p.role}</span>
									</label>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				{#if createError}
					<p class="text-xs font-medium text-danger-text" role="alert">{createError}</p>
				{/if}
			</div>

			{#snippet footer()}
				<Button type="button" variant="secondary" onclick={() => (sheet = null)}>Cancel</Button>
				<Button type="submit" disabled={!groupTitle.trim() || groupMembers.size === 0}>
					Create group
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ── Course channel ─────────────────────────────────────────────────────── -->
{#if sheet === 'channel'}
	<Sheet open onClose={() => (sheet = null)}>
		{#snippet header()}
			<h2 class="text-base font-semibold">Open a channel</h2>
			<p class="mt-0.5 text-sm text-muted">Open the chat channel for one of your courses.</p>
		{/snippet}

		<div class="mb-3">
			<input
				bind:value={pickerQuery}
				placeholder="Search courses…"
				class="h-10 w-full rounded-control border border-border bg-surface-sunken px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			/>
		</div>
		{#if filteredCourses.length === 0}
			<p class="py-6 text-center text-sm text-muted">No courses to open a channel for.</p>
		{:else}
			<ul class="divide-y divide-border">
				{#each filteredCourses as c (c.slug)}
					<li>
						<form method="POST" action="?/channel" use:enhance={createEnhance}>
							<input type="hidden" name="slug" value={c.slug} />
							<button
								type="submit"
								class="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
							>
								<span
									class="flex size-9 items-center justify-center rounded-full bg-surface-sunken text-muted"
								>
									<Icon icon={BookOpen01Icon} class="size-4" />
								</span>
								<span class="min-w-0 truncate text-sm font-medium">{c.title}</span>
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
		{#if createError}
			<p class="mt-3 text-xs font-medium text-danger-text" role="alert">{createError}</p>
		{/if}

		{#snippet footer()}
			<Button type="button" variant="secondary" onclick={() => (sheet = null)}>Cancel</Button>
		{/snippet}
	</Sheet>
{/if}

<style>
	@keyframes typing {
		0%,
		60%,
		100% {
			transform: translateY(0);
			opacity: 0.35;
		}
		30% {
			transform: translateY(-3px);
			opacity: 1;
		}
	}
	.typing-dot {
		animation: typing 1.2s infinite ease-in-out;
	}
</style>
