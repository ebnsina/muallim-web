<script lang="ts">
	import { Megaphone01Icon } from '@hugeicons/core-free-icons';
	import { Card, Icon } from '$lib/components';
	import type { Announcement } from './types';

	type Props = { announcements: Announcement[] };
	let { announcements }: Props = $props();

	const mediumDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	// One open at a time. They are notices, not a thread.
	let shown = $state<string | null>(null);
</script>

<!--
	A notice is worth a line until somebody wants it. Two of them used to open the
	page with a wall of tinted cards, above the syllabus a reader came for — so each
	is a row now, and the body is behind its own title.
-->
<section class="mt-10">
	<h2 class="flex items-center gap-2 text-sm font-medium">
		<Icon icon={Megaphone01Icon} class="text-accent-text size-4" />
		Announcements
		<span class="text-muted numeral text-xs">{announcements.length}</span>
	</h2>

	<Card class="border-accent-border bg-accent-surface/30 divide-y divide-accent-border mt-3">
		{#each announcements as announcement (announcement.id)}
			{@const isShown = shown === announcement.id}
			<div>
				<button
					type="button"
					class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-surface/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
					aria-expanded={isShown}
					aria-controls="announcement-{announcement.id}"
					onclick={() => (shown = isShown ? null : announcement.id)}
				>
					<Icon icon={Megaphone01Icon} class="text-accent-text size-4 shrink-0" />

					<span class="min-w-0 flex-1 truncate text-sm font-medium">
						{announcement.title}
					</span>

					<time class="text-muted numeral hidden shrink-0 text-xs sm:block">
						{mediumDate.format(new Date(announcement.created_at))}
					</time>

					<span class="text-accent-text shrink-0 text-xs font-medium">
						{isShown ? 'Hide' : 'Read'}
					</span>
				</button>

				{#if isShown}
					<p
						id="announcement-{announcement.id}"
						class="text-muted px-4 pb-4 pl-11 text-sm whitespace-pre-wrap"
					>
						{announcement.body}
					</p>
				{/if}
			</div>
		{/each}
	</Card>
</section>
