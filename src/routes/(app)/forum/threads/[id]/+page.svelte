<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { PinIcon, SquareLock01Icon } from '@hugeicons/core-free-icons';
	import { Alert, Badge, Breadcrumbs, Button, Card, Icon, Page, Textarea } from '$lib/components';
	import { exactTime, relativeTime, ReplyRow } from '$lib/features/forum';
	import { canModerate } from '$lib/roles';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const moderator = $derived(canModerate(data.user));

	// A locked thread takes no replies, except from a moderator.
	const canReply = $derived(!data.thread.locked || moderator);

	// The thread endpoint does not return its board's title, so the crumb cannot name it.
	// The board is named, now that muallim-api sends it: a thread four levels in used
	// to say "Community / Thread", which tells a reader nothing about where they are.
	const crumbs = $derived([
		{ label: 'Community', href: resolve('/forum') },
		...(data.thread.space_title
			? [
					{
						label: data.thread.space_title,
						href: resolve(`/forum/spaces/${data.thread.space_id}`)
					}
				]
			: []),
		{ label: data.thread.title }
	]);
</script>

<svelte:head><title>{data.thread.title} — Muallim</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<!-- The opening post floats above the replies: it is the thing the page is about, and
	     the replies below it are one list, not a scatter of cards. -->
	<Card float class="mt-4 p-5 sm:p-6">
		<article>
			<div class="flex flex-wrap items-center gap-2">
				{#if data.thread.pinned}
					<Badge tone="accent" icon={PinIcon}>Pinned</Badge>
				{/if}
				{#if data.thread.locked}
					<Badge tone="neutral" icon={SquareLock01Icon}>Locked</Badge>
				{/if}
			</div>

			<h1 class="mt-2 text-2xl font-semibold text-pretty">{data.thread.title}</h1>
			<p class="text-muted mt-1 text-sm">
				<span class="text-text font-medium">{data.thread.author_name || 'A member'}</span>
				·
				<span title={exactTime(data.thread.created_at)}>
					{relativeTime(data.thread.created_at)}
				</span>
			</p>

			<div class="mt-5 text-pretty whitespace-pre-wrap">{data.thread.body}</div>

			{#if moderator || data.thread.mine}
				<div class="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
					{#if moderator}
						<form method="POST" action="?/moderate" use:enhance>
							<input type="hidden" name="pinned" value={(!data.thread.pinned).toString()} />
							<Button type="submit" variant="ghost" size="sm">
								{data.thread.pinned ? 'Unpin' : 'Pin'}
							</Button>
						</form>
						<form method="POST" action="?/moderate" use:enhance>
							<input type="hidden" name="locked" value={(!data.thread.locked).toString()} />
							<Button type="submit" variant="ghost" size="sm">
								{data.thread.locked ? 'Unlock' : 'Lock'}
							</Button>
						</form>
					{/if}
					<form method="POST" action="?/deleteThread" use:enhance>
						<input type="hidden" name="space_id" value={data.thread.space_id} />
						<Button type="submit" variant="ghost" size="sm">Delete thread</Button>
					</form>
				</div>
			{/if}
		</article>
	</Card>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<!-- Replies, oldest first. -->
	<section class="mt-8">
		<h2 class="text-sm font-medium tracking-wide uppercase">
			<span class="numeral">{data.thread.reply_count}</span>
			{data.thread.reply_count === 1 ? 'reply' : 'replies'}
		</h2>

		{#if data.posts.length > 0}
			<ul
				class="mt-4 divide-y divide-border overflow-hidden rounded-card bg-surface-raised shadow-card"
			>
				{#each data.posts as post (post.id)}
					<li><ReplyRow {post} deletable={post.mine || moderator} /></li>
				{/each}
			</ul>

			{#if data.nextCursor}
				<div class="mt-6 flex justify-center">
					<Button
						href={`${resolve(`/forum/threads/${data.thread.id}`)}?cursor=${encodeURIComponent(data.nextCursor)}`}
						variant="secondary"
						size="sm"
					>
						Load more
					</Button>
				</div>
			{/if}
		{/if}

		<!-- Reply box, or a note that the thread is closed. -->
		{#if canReply}
			<form method="POST" action="?/reply" class="mt-6" use:enhance>
				<Textarea
					name="body"
					rows={3}
					maxlength={20000}
					aria-label="Write a reply"
					placeholder="Write a reply…"
				/>
				<div class="mt-2">
					<Button type="submit" size="sm">Reply</Button>
				</div>
			</form>
		{:else}
			<p class="text-muted mt-6 flex items-center gap-2 text-sm">
				<Icon icon={SquareLock01Icon} class="size-4" />
				This thread is locked. No new replies.
			</p>
		{/if}
	</section>
</Page>
