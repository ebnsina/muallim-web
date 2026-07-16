<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		ArrowUpRight01Icon,
		Clock01Icon,
		CircleLock01Icon,
		LiveStreaming02Icon
	} from '@hugeicons/core-free-icons';
	import { Alert, Breadcrumbs, Button, EmptyState, Icon, Page } from '$lib/components';
	import { formatSessionWhen, isUpcoming, type Session } from '$lib/liveclass';
	import { appendPage, canLoadMore, type Paged } from '$lib/paging';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const sessionKey = (session: Session) => session.id;

	let sessions = $derived(data.sessions as Paged<Session>);

	// The API orders soonest first; split so upcoming leads and finished ones sit muted
	// beneath. `isUpcoming` is evaluated once per render against the current clock.
	const upcoming = $derived(sessions.rows.filter((s) => isUpcoming(s)));
	const past = $derived(sessions.rows.filter((s) => !isUpcoming(s)));

	const crumbs = $derived([
		{ label: 'Courses', href: resolve('/courses') },
		{ label: data.course.title, href: resolve(`/courses/${data.course.slug}`) },
		{ label: 'Live sessions' }
	]);

	let loadingMore = $state(false);
</script>

<svelte:head><title>Live sessions — {data.course.title} — Muallim</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<header class="mt-4">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Live sessions</h1>
		<p class="text-muted mt-2 max-w-2xl">
			Meetings on {data.course.title}. Join from the link when it starts.
		</p>
	</header>

	<div class="mt-8">
		{#if data.notEnrolled}
			<EmptyState
				icon={CircleLock01Icon}
				title="Enrol to see live sessions"
				description="Live sessions are for enrolled learners. Enrol on this course and its meetings will show up here."
			>
				{#snippet action()}
					<Button href={resolve(`/courses/${data.course.slug}`)} variant="secondary" size="sm">
						<Icon icon={ArrowUpRight01Icon} class="size-4" />
						Go to the course
					</Button>
				{/snippet}
			</EmptyState>
		{:else if data.sessionsError && sessions.rows.length === 0}
			<Alert tone="warning" role="alert">{data.sessionsError}</Alert>
		{:else if sessions.rows.length === 0}
			<EmptyState
				icon={LiveStreaming02Icon}
				title="No live sessions scheduled."
				description="When your instructor schedules a live meeting, it will appear here."
			/>
		{:else}
			{#if upcoming.length > 0}
				<ul class="grid gap-3">
					{#each upcoming as session (session.id)}
						<li
							class="rounded-card border-border bg-surface-raised flex flex-wrap items-center justify-between gap-4 border p-5"
						>
							<div class="min-w-0">
								<p class="font-medium">{session.title}</p>
								<p class="text-muted mt-1 flex items-center gap-1.5 text-sm">
									<Icon icon={Clock01Icon} class="size-3.5 shrink-0" />
									{formatSessionWhen(session)}
								</p>
								{#if session.description}
									<p class="text-muted mt-1.5 max-w-2xl text-sm">{session.description}</p>
								{/if}
							</div>

							{#if session.join_url}
								<Button href={session.join_url} target="_blank" rel="noopener">
									<Icon icon={ArrowUpRight01Icon} class="size-4" />
									Join
								</Button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			{#if past.length > 0}
				<section class="mt-10">
					<h2 class="text-muted text-sm font-medium">Past sessions</h2>
					<ul class="mt-3 grid gap-2">
						{#each past as session (session.id)}
							<li
								class="rounded-card border-border/70 flex flex-wrap items-center justify-between gap-3 border border-dashed px-4 py-3 opacity-70"
							>
								<div class="min-w-0">
									<p class="text-sm font-medium">{session.title}</p>
									<p class="text-muted mt-0.5 text-xs">{formatSessionWhen(session)}</p>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if canLoadMore(sessions)}
				<form
					method="POST"
					action="?/more"
					class="mt-6 flex justify-center"
					use:enhance={() => {
						loadingMore = true;
						return async ({ result }) => {
							loadingMore = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.more as Paged<Session> | undefined;
							if (next) sessions = appendPage(sessions, next, sessionKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={sessions.cursor} />
					<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</Page>
