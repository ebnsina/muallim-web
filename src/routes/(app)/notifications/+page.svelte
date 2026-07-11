<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Award01Icon,
		Megaphone01Icon,
		Message01Icon,
		Notification03Icon
	} from '@hugeicons/core-free-icons';
	import { Button, EmptyState, Icon, Page, PageHeader } from '$lib/components';
	import type { IconSvgElement } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const KIND_ICON: Record<string, IconSvgElement> = {
		answer: Message01Icon,
		announcement: Megaphone01Icon,
		grade: Award01Icon,
		reply: Message01Icon
	};

	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

	const hasUnread = $derived(data.notifications.some((n) => !n.read));
</script>

<svelte:head><title>Notifications — Muallim</title></svelte:head>

<Page width="wide">
	<PageHeader title="Notifications" description="Answers, announcements, and grades on your work.">
		{#snippet actions()}
			{#if hasUnread}
				<form method="POST" action="?/readAll" use:enhance>
					<Button type="submit" variant="secondary" size="sm">Mark all read</Button>
				</form>
			{/if}
		{/snippet}
	</PageHeader>

	{#if data.notifications.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Notification03Icon}
				title="Nothing yet"
				description="When someone answers your question or an instructor posts a notice, it shows up here."
			/>
		</div>
	{:else}
		<ul class="mt-6 divide-y divide-border overflow-hidden rounded-card border border-border">
			{#each data.notifications as notification (notification.id)}
				<li>
					<!--
						The whole row is a form button: opening a notification marks it read
						and follows its link in one submit. No JavaScript needed.
					-->
					<form method="POST" action="?/open" use:enhance>
						<input type="hidden" name="id" value={notification.id} />
						<input type="hidden" name="link" value={notification.link} />
						<button
							type="submit"
							class="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
							class:bg-accent-surface={!notification.read}
						>
							<span class="text-muted mt-0.5 shrink-0">
								<Icon icon={KIND_ICON[notification.kind] ?? Notification03Icon} class="size-5" />
							</span>

							<span class="min-w-0 flex-1">
								<span class="flex items-center gap-2">
									<span class="font-medium">{notification.title}</span>
									{#if !notification.read}
										<span class="size-2 shrink-0 rounded-full bg-accent" aria-label="unread"></span>
									{/if}
								</span>
								{#if notification.body}
									<span class="text-muted mt-0.5 line-clamp-2 block text-sm">
										{notification.body}
									</span>
								{/if}
								<span class="text-muted numeral mt-1 block text-xs">
									{when.format(new Date(notification.created_at))}
								</span>
							</span>
						</button>
					</form>
				</li>
			{/each}
		</ul>

		{#if data.nextCursor}
			<div class="mt-6 flex justify-center">
				<Button
					href={`${resolve('/notifications')}?cursor=${encodeURIComponent(data.nextCursor)}`}
					variant="secondary"
					size="sm"
				>
					Load older
				</Button>
			</div>
		{/if}
	{/if}
</Page>
