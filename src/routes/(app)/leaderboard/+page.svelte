<script lang="ts">
	import { Award01Icon, ChampionIcon } from '@hugeicons/core-free-icons';
	import { Card, EmptyState, Icon, Page, Progress } from '$lib/components';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/*
		Everything here is the board's own three fields — a name, a rank, a points total
		— or arithmetic over them. No streaks, no "momentum", no badge nobody earned: a
		leaderboard that invents a number is a leaderboard nobody believes, and the
		numbers it already has are the ones people came to see.
	*/
	const leader = $derived(data.entries[0]?.points ?? 0);

	// How far along the leader's total somebody is. It is the one thing a column of
	// numbers does not say: whether second place is a stride behind or a mile.
	function share(points: number): number {
		return leader === 0 ? 0 : Math.round((points / leader) * 100);
	}

	const podium = $derived(data.entries.slice(0, 3));
	const rest = $derived(data.entries.slice(3));

	/*
		Gold, silver, bronze — and the card *is* the medal.

		A white card with a coloured ring says "here is a card, and by the way it is
		first". A tinted one says "this is first" before a word is read, which is the
		whole job of a podium. The tints are the ramps' step 3, which is what that step
		is for: a fill a page's own ink still reads on.
	*/
	const MEDAL: Record<
		number,
		{ card: string; tile: string; label: string; bar: 'active' | 'completed' | 'lapsed' }
	> = {
		1: {
			card: 'border-warning-border bg-warning-surface',
			tile: 'bg-warning text-on-solid',
			label: 'First',
			bar: 'lapsed'
		},
		2: {
			card: 'border-border-strong bg-surface-sunken',
			tile: 'bg-border-strong text-text',
			label: 'Second',
			bar: 'active'
		},
		3: {
			card: 'border-accent-border bg-accent-surface',
			tile: 'bg-accent text-on-solid',
			label: 'Third',
			bar: 'active'
		}
	};

	// The board does not say which row is you. Your own rank does.
	const myRank = $derived(data.me?.rank ?? -1);

	const initials = (name: string) =>
		(name || 'A learner')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase() ?? '')
			.join('');
</script>

<svelte:head><title>Leaderboard — Muallim</title></svelte:head>

<Page width="wide">
	<!--
		Your own standing, on the aurora. This is a page about doing well, and the card
		that says how *you* are doing is the one it is about — the rest is other people.
	-->
	{#if data.me && data.me.out_of > 0}
		{@const me = data.me}
		<Card surface="aurora" class="p-6 sm:p-8">
			<div class="flex flex-wrap items-center gap-6">
				<span class="flex size-16 shrink-0 items-center justify-center rounded-full bg-on-solid/15">
					<Icon icon={ChampionIcon} class="size-8" />
				</span>

				<div class="min-w-0">
					<p class="text-xs font-medium tracking-wide text-on-solid/75 uppercase">Your standing</p>
					<p class="mt-1.5 flex items-baseline gap-2">
						<span class="numeral text-3xl font-semibold tracking-tight">{me.points}</span>
						<span class="text-sm text-on-solid/80">points</span>
					</p>
					<p class="mt-1 text-sm text-on-solid/80">
						Rank <span class="numeral font-medium text-on-solid">{me.rank}</span>
						of <span class="numeral">{me.out_of}</span>
					</p>
				</div>

				<!-- The badges, earned and not: what is left to earn is the reason for
				     showing the ones already earned. -->
				{#if me.badges && me.badges.length > 0}
					<ul class="ml-auto flex flex-wrap gap-2">
						{#each me.badges as badge (badge.code)}
							<li
								class={cn(
									'flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-medium',
									badge.earned ? 'bg-on-solid/20 text-on-solid' : 'bg-on-solid/5 text-on-solid/45'
								)}
								title={badge.description}
							>
								<Icon icon={Award01Icon} class="size-3.5" />
								{badge.name}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
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
		<!-- ================================================================= podium -->
		<h2 class="mt-10 text-lg font-semibold">Top of the board</h2>

		<ol class="mt-4 grid gap-4 sm:grid-cols-3">
			{#each podium as entry (entry.rank)}
				{@const medal = MEDAL[entry.rank]}
				<li>
					<Card class={cn('h-full p-5', medal.card, entry.rank === myRank && 'ring-2 ring-accent')}>
						<div class="flex items-center gap-3">
							<span
								class={cn(
									'numeral flex size-9 items-center justify-center rounded-full text-sm font-semibold',
									medal.tile
								)}
							>
								{entry.rank}
							</span>
							<span class="text-muted text-xs font-medium tracking-wide uppercase">
								{medal.label}
							</span>
							{#if entry.rank === myRank}
								<span class="text-accent-text ml-auto text-xs font-medium">You</span>
							{/if}
						</div>

						<p class="mt-4 truncate font-semibold">{entry.name || 'A learner'}</p>

						<p class="mt-1 flex items-baseline gap-1.5">
							<span class="numeral text-2xl font-semibold tracking-tight">{entry.points}</span>
							<span class="text-muted text-sm">points</span>
						</p>

						<div class="mt-3">
							<Progress
								value={share(entry.points)}
								tone={medal.bar}
								class="h-1.5"
								label="{share(entry.points)}% of the leader's points"
							/>
						</div>
					</Card>
				</li>
			{/each}
		</ol>

		<!-- =================================================================== rest -->
		{#if rest.length > 0}
			<h2 class="mt-10 text-lg font-semibold">Everyone else</h2>

			<ol class="mt-4 space-y-2">
				{#each rest as entry (entry.rank)}
					{@const mine = entry.rank === myRank}
					<li>
						<Card
							float
							class={cn('flex items-center gap-4 px-5 py-3.5', mine && 'ring-2 ring-accent')}
						>
							<span class="text-muted numeral w-6 shrink-0 text-sm font-medium">{entry.rank}</span>

							<!-- A monogram, not a silhouette: a face nobody uploaded is a grey blob,
							     and two letters are a person. -->
							<span
								class="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold"
							>
								{initials(entry.name)}
							</span>

							<div class="min-w-0 flex-1">
								<p class="flex items-center gap-2 truncate text-sm font-medium">
									{entry.name || 'A learner'}
									{#if mine}
										<span class="text-accent-text text-xs">You</span>
									{/if}
								</p>

								<div class="mt-1.5 max-w-xs">
									<Progress
										value={share(entry.points)}
										tone="active"
										class="h-1"
										label="{share(entry.points)}% of the leader's points"
									/>
								</div>
							</div>

							<span class="shrink-0 text-right">
								<span class="numeral font-semibold">{entry.points}</span>
								<span class="text-muted ml-1 text-xs">pts</span>
							</span>
						</Card>
					</li>
				{/each}
			</ol>
		{/if}
	{/if}
</Page>
