<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Award01Icon,
		BookOpen01Icon,
		ChampionIcon,
		Mail01Icon,
		Settings02Icon
	} from '@hugeicons/core-free-icons';
	import { ActionLink, Badge, Button, Card, Icon, Numeral, Page } from '$lib/components';
	import { auroraFor, cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const initials = $derived(
		data.user.name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase() ?? '')
			.join('')
	);

	const active = $derived(data.enrolments.filter((e) => e.status === 'active').length);
	const finished = $derived(data.enrolments.filter((e) => e.status === 'completed').length);

	// Everything here has an endpoint behind it. There is no "member since" because
	// muallim-api does not send one, and a date invented for a profile is a lie with
	// a calendar icon next to it.
	const STATS = $derived([
		{
			label: 'Studying',
			value: active,
			icon: BookOpen01Icon,
			tile: 'bg-accent-surface text-accent-text',
			ink: 'text-accent-text'
		},
		{
			label: 'Finished',
			value: finished,
			icon: Award01Icon,
			tile: 'bg-success-surface text-success-text',
			ink: 'text-success-text'
		},
		{
			label: 'Certificates',
			value: data.certificates.length,
			icon: Award01Icon,
			tile: 'bg-warning-surface text-warning-text',
			ink: 'text-warning-text'
		},
		{
			label: 'Points',
			value: data.gamification?.points ?? 0,
			icon: ChampionIcon,
			tile: 'bg-surface-sunken text-muted',
			ink: 'text-text'
		}
	]);
</script>

<svelte:head><title>{data.user.name} — Muallim</title></svelte:head>

<Page width="wide">
	<!-- The person, on their own light. A profile is the one page that is about
	     somebody rather than about work, and it should not look like a table row. -->
	<Card surface="aurora" class={cn('p-6 sm:p-8', auroraFor(data.user.email))}>
		<div class="flex flex-wrap items-center gap-5">
			<span
				class="flex size-16 shrink-0 items-center justify-center rounded-full bg-on-solid/15 text-xl font-semibold"
			>
				{initials}
			</span>

			<div class="min-w-0">
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{data.user.name}</h1>

				<p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-solid/85">
					<span class="flex items-center gap-1.5">
						<Icon icon={Mail01Icon} class="size-4" />
						{data.user.email}
					</span>
					<span class="capitalize">{data.user.role}</span>
				</p>
			</div>

			<div class="ml-auto">
				<Button href={resolve('/settings')} variant="glass" size="sm">
					<Icon icon={Settings02Icon} class="size-4" />
					Settings
				</Button>
			</div>
		</div>
	</Card>

	<!-- --------------------------------------------------------------- figures -->
	<dl class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each STATS as stat (stat.label)}
			<Card float class="p-5">
				<dt class="text-muted flex items-center gap-2 text-xs">
					<span class={cn('flex size-6 items-center justify-center rounded-md', stat.tile)}>
						<Icon icon={stat.icon} class="size-3.5" strokeWidth={2} />
					</span>
					{stat.label}
				</dt>
				<dd class="mt-2">
					<Numeral
						countUp
						value={stat.value}
						class={cn('text-3xl font-semibold tracking-tight', stat.ink)}
					/>
				</dd>
			</Card>
		{/each}
	</dl>

	<!-- ---------------------------------------------------------------- badges -->
	{#if data.gamification?.badges?.length}
		<section class="mt-10">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="text-lg font-semibold">Badges</h2>
				<ActionLink href={resolve('/leaderboard')} tone="muted">The leaderboard</ActionLink>
			</div>

			<!-- Earned and not, because what is left to earn is the reason for showing the
			     ones already earned. -->
			<ul class="mt-4 flex flex-wrap gap-2">
				{#each data.gamification.badges as badge (badge.code)}
					<li>
						<span title={badge.description}>
							<Badge tone={badge.earned ? 'warning' : 'neutral'} icon={Award01Icon}>
								{badge.name}
							</Badge>
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- ------------------------------------------------------------ what is on -->
	{#if data.enrolments.length > 0}
		<section class="mt-10">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="text-lg font-semibold">Courses</h2>
				<ActionLink href={resolve('/dashboard')} tone="muted">Your dashboard</ActionLink>
			</div>

			<ul class="mt-4 space-y-2">
				{#each data.enrolments as enrolment (enrolment.course_slug)}
					<li>
						<Card float class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
							<a
								class="underline-grow min-w-0 truncate text-sm font-medium"
								href={resolve(`/courses/${enrolment.course_slug}`)}
							>
								{enrolment.course_title}
							</a>

							<span class="text-muted numeral shrink-0 text-sm">
								{enrolment.progress?.percent ?? 0}% · {enrolment.status}
							</span>
						</Card>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</Page>
