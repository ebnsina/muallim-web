<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		ArrowRight01Icon,
		Award01Icon,
		BookOpen01Icon,
		Cancel01Icon,
		Notification02Icon,
		Search01Icon,
		UserGroupIcon
	} from '@hugeicons/core-free-icons';
	import { Badge, Button, Card, Icon, Input, Page, Progress } from '$lib/components';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const postedOn = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	/*
		The board's three columns are not invented states: they are what the API already
		says about an enrolment. Active with nothing done is a course sitting on the
		shelf; active with something done is a course underway; completed is done. A
		column for a state the server does not have would be a column that never fills.
	*/
	type Column = { key: string; title: string; tone: string; bar: 'active' | 'completed' };

	const COLUMNS: Column[] = [
		{ key: 'todo', title: 'Not started', tone: 'text-muted', bar: 'active' },
		{ key: 'doing', title: 'In progress', tone: 'text-chart-1', bar: 'active' },
		{ key: 'done', title: 'Finished', tone: 'text-chart-2', bar: 'completed' }
	];

	// The one filter the board offers, and it is a filter over what is on screen — no
	// request, because every enrolment this learner has is already here.
	let query = $state('');

	const matching = $derived(
		data.enrolments.filter((e) => e.course_title.toLowerCase().includes(query.trim().toLowerCase()))
	);

	function column(key: string) {
		return matching.filter((e) => {
			const percent = e.progress?.percent ?? 0;
			if (e.status === 'completed') return key === 'done';
			if (e.status !== 'active') return false;
			return percent === 0 ? key === 'todo' : key === 'doing';
		});
	}

	function lessonsLeft(progress: { lessons_total?: number; lessons_completed?: number } | null) {
		return Math.max(0, (progress?.lessons_total ?? 0) - (progress?.lessons_completed ?? 0));
	}

	const unread = $derived(data.notifications.filter((n) => !n.read).length);

	// The rail. Every destination is a route that exists — an icon that goes nowhere is
	// a promise the product does not keep.
	const RAIL = [
		{ icon: BookOpen01Icon, label: 'Board', href: resolve('/dash'), current: true },
		{ icon: UserGroupIcon, label: 'Forum', href: resolve('/forum'), current: false },
		{ icon: Award01Icon, label: 'Certificates', href: resolve('/certificates'), current: false },
		{
			icon: Notification02Icon,
			label: 'Notifications',
			href: resolve('/notifications'),
			current: false
		}
	];
</script>

<svelte:head><title>Board — Muallim</title></svelte:head>

<Page width="full">
	<div class="flex gap-6">
		<!--
			The rail. Icons only, and every one of them carries its name for a screen
			reader and a tooltip for everyone else: an icon alone is a rebus, and a rail
			of them is a rebus nobody asked to solve.
		-->
		<nav aria-label="Sections" class="hidden shrink-0 lg:block">
			<ul class="sticky top-24 flex flex-col gap-2">
				{#each RAIL as item (item.href)}
					<li>
						<a
							href={item.href}
							title={item.label}
							aria-label={item.label}
							aria-current={item.current ? 'page' : undefined}
							class={cn(
								'flex size-11 items-center justify-center rounded-card transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
								item.current
									? 'bg-accent-surface text-accent-text'
									: 'text-muted hover:bg-surface-sunken hover:text-text'
							)}
						>
							<Icon icon={item.icon} class="size-5" />
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="min-w-0 flex-1">
			<!-- The horizon, as on every other page in the product. -->
			<div
				class="rounded-card bg-gradient-to-br from-accent-surface via-surface-sunken to-surface-sunken p-6 sm:p-8"
			>
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div>
						<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">My learning</h1>
						<p class="text-muted mt-1 text-sm">
							<span class="numeral">{data.enrolments.length}</span>
							{data.enrolments.length === 1 ? 'course' : 'courses'}, by where you have got to.
						</p>
					</div>

					<div class="flex items-center gap-2">
						<div class="relative">
							<Icon
								icon={Search01Icon}
								class="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
							/>
							<Input
								bind:value={query}
								placeholder="Filter courses…"
								aria-label="Filter courses by title"
								class="w-56 pl-9"
							/>
							{#if query}
								<button
									type="button"
									class="text-muted absolute top-1/2 right-2 -translate-y-1/2 rounded-control p-1 hover:text-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
									aria-label="Clear the filter"
									onclick={() => (query = '')}
								>
									<Icon icon={Cancel01Icon} class="size-4" />
								</button>
							{/if}
						</div>

						<Button href={resolve('/courses')} variant="secondary" size="sm">Browse</Button>
					</div>
				</div>
			</div>

			<div class="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
				<!-- ==================================================== the board -->
				<div class="grid gap-4 md:grid-cols-3">
					{#each COLUMNS as col (col.key)}
						{@const items = column(col.key)}
						<section class="rounded-card bg-surface-sunken p-3">
							<h2 class="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
								<span class={cn('size-2 rounded-full bg-current', col.tone)}></span>
								{col.title}
								<span class="text-muted numeral ml-auto text-xs">{items.length}</span>
							</h2>

							{#if items.length === 0}
								<p class="text-muted px-2 py-6 text-center text-xs">
									{query ? 'Nothing matches.' : 'Nothing here.'}
								</p>
							{:else}
								<ul class="mt-1 space-y-2">
									{#each items as enrolment (enrolment.course_slug)}
										{@const progress = enrolment.progress}
										{@const percent = progress?.percent ?? 0}
										<li>
											<!--
												A card is the whole target. There is no "Open" button on it,
												because a button that repeats what clicking the card already does
												is a button in the way.
											-->
											<a
												href={resolve(`/courses/${enrolment.course_slug}`)}
												class="lift group block rounded-card border border-border bg-surface-raised p-4 transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
											>
												<p class="text-sm font-medium text-pretty">{enrolment.course_title}</p>

												<div class="mt-3 flex items-center justify-between gap-2">
													<span class="numeral text-xs font-medium">{percent}%</span>
													<span class="text-muted numeral text-xs">
														{lessonsLeft(progress)} left
													</span>
												</div>

												<div class="mt-1.5">
													<Progress
														value={progress?.lessons_completed ?? 0}
														max={progress?.lessons_total ?? 1}
														tone={col.bar}
														class="h-1.5"
														label="{percent}% of {enrolment.course_title} complete"
													/>
												</div>

												{#if col.key === 'done'}
													<div class="mt-3">
														<Badge tone="success" icon={Award01Icon}>Complete</Badge>
													</div>
												{:else}
													<p
														class="text-muted mt-3 flex items-center gap-1 text-xs font-medium group-hover:text-accent-text"
													>
														{percent === 0 ? 'Start' : 'Continue'}
														<Icon icon={ArrowRight01Icon} class="size-3.5" />
													</p>
												{/if}
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</section>
					{/each}
				</div>

				<!-- ================================================== the side rail -->
				<aside class="space-y-4">
					<Card surface="sunken" class="p-5">
						<h2 class="flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
							Notifications
							{#if unread > 0}
								<span
									class="numeral rounded-pill bg-accent px-1.5 text-xs font-semibold text-on-solid"
								>
									{unread}
								</span>
							{/if}
						</h2>

						{#if data.notifications.length === 0}
							<p class="text-muted mt-4 text-sm">Nothing to read.</p>
						{:else}
							<ul class="mt-4 space-y-3">
								{#each data.notifications.slice(0, 5) as notification (notification.id)}
									<li>
										<a
											href={notification.link || resolve('/notifications')}
											class="block rounded-control underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
										>
											<p
												class={cn(
													'truncate text-sm',
													notification.read ? 'text-muted' : 'font-medium'
												)}
											>
												{notification.title}
											</p>
											<p class="text-muted numeral mt-0.5 text-xs">
												{postedOn.format(new Date(notification.created_at))}
											</p>
										</a>
									</li>
								{/each}
							</ul>

							<a
								href={resolve('/notifications')}
								class="text-accent-text mt-4 inline-block text-sm underline-offset-4 hover:underline"
							>
								All notifications
							</a>
						{/if}
					</Card>

					{#if data.gamification}
						{@const g = data.gamification}
						<Card surface="sunken" class="p-5">
							<h2 class="text-sm font-medium tracking-wide uppercase">Progress points</h2>
							<p class="mt-3 flex items-baseline gap-2">
								<span class="numeral text-3xl font-semibold tracking-tight">{g.points}</span>
								<span class="text-muted text-sm">points</span>
							</p>
							<p class="text-muted mt-1 text-xs">
								Rank <span class="numeral">{g.rank}</span> of
								<span class="numeral">{g.out_of}</span>
							</p>
						</Card>
					{/if}
				</aside>
			</div>
		</div>
	</div>
</Page>
