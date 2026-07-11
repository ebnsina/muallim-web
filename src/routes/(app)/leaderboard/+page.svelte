<script lang="ts">
	import { ChampionIcon } from '@hugeicons/core-free-icons';
	import { Card, EmptyState, Page, PageHeader } from '$lib/components';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The medal tint for the top three; nothing for the rest.
	const MEDAL: Record<number, string> = {
		1: 'bg-warning-surface text-warning-text',
		2: 'bg-surface-sunken text-muted',
		3: 'bg-accent-surface text-accent-text'
	};
</script>

<svelte:head><title>Leaderboard — Muallim</title></svelte:head>

<Page width="wide">
	<PageHeader
		title="Leaderboard"
		description="Points earned for finishing lessons and courses across the workspace."
	/>

	{#if data.me && data.me.out_of > 0}
		<Card class="mt-6 flex items-center justify-between gap-4 p-5">
			<span class="text-sm font-medium">You</span>
			<span class="text-muted text-sm">
				Rank <span class="numeral text-text">{data.me.rank}</span> of
				<span class="numeral">{data.me.out_of}</span>
			</span>
			<span class="numeral text-lg font-semibold">{data.me.points}</span>
		</Card>
	{/if}

	{#if data.entries.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={ChampionIcon}
				title="No points yet"
				description="Finish a lesson to get on the board."
			/>
		</div>
	{:else}
		<ol class="mt-6 divide-y divide-border overflow-hidden rounded-card border border-border">
			{#each data.entries as entry (entry.rank)}
				<li class="flex items-center gap-4 px-5 py-3.5">
					<span
						class={cn(
							'numeral flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
							MEDAL[entry.rank] ?? 'text-muted'
						)}
					>
						{entry.rank}
					</span>
					<span class="min-w-0 flex-1 truncate font-medium">{entry.name || 'A learner'}</span>
					<span class="numeral shrink-0 font-semibold">{entry.points}</span>
					<span class="text-muted shrink-0 text-xs">pts</span>
				</li>
			{/each}
		</ol>
	{/if}
</Page>
