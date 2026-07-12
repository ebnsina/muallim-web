<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Delete02Icon, PinIcon, SquareLock01Icon } from '@hugeicons/core-free-icons';
	import { Alert, Badge, Breadcrumbs, Button, Card, Icon, Page, Textarea } from '$lib/components';
	import { canModerate } from '$lib/roles';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const moderator = $derived(canModerate(data.user));
	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

	// A locked thread takes no replies, except from a moderator.
	const canReply = $derived(!data.thread.locked || moderator);

	const crumbs = $derived([{ label: 'Community', href: resolve('/forum') }, { label: 'Thread' }]);
</script>

<svelte:head><title>{data.thread.title} — Muallim</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<!-- The opening post: title, body, author, and the state badges. -->
	<article class="mt-4">
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
			{data.thread.author_name || 'A member'} ·
			<span class="numeral">{when.format(new Date(data.thread.created_at))}</span>
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
			<ul class="mt-4 space-y-3">
				{#each data.posts as post (post.id)}
					<li>
						<Card float class="p-5">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-pretty whitespace-pre-wrap">{post.body}</p>
									<p class="text-muted mt-2 text-xs">
										{post.author_name || 'A member'} ·
										<span class="numeral">{when.format(new Date(post.created_at))}</span>
									</p>
								</div>
								{#if post.mine || moderator}
									<form method="POST" action="?/deletePost" use:enhance>
										<input type="hidden" name="id" value={post.id} />
										<button
											type="submit"
											class="text-muted hover:text-danger-text shrink-0 rounded-control p-1 transition-colors"
											aria-label="Delete this reply"
										>
											<Icon icon={Delete02Icon} class="size-4" />
										</button>
									</form>
								{/if}
							</div>
						</Card>
					</li>
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
