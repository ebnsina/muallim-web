<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		ArrowRight01Icon,
		Award01Icon,
		BookOpen01Icon,
		Cancel01Icon,
		DashboardSquare01Icon,
		Message01Icon,
		Notification02Icon,
		PlayCircleIcon,
		Search01Icon
	} from '@hugeicons/core-free-icons';
	import { Badge, Icon, Input, Progress } from '$lib/components';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const postedOn = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	/*
		The board's three columns are not invented states: they are what the API already
		says about an enrolment. Active with nothing done is a course on the shelf,
		active with something done is a course underway, completed is done. A column for
		a state the server does not have would be a column that never fills.
	*/
	const COLUMNS = [
		{
			key: 'todo',
			title: 'Not started',
			dot: 'text-warning-text',
			tile: 'bg-warning-surface text-warning-text',
			icon: BookOpen01Icon,
			bar: 'active' as const
		},
		{
			key: 'doing',
			title: 'In progress',
			dot: 'text-accent-text',
			tile: 'bg-accent-surface text-accent-text',
			icon: PlayCircleIcon,
			bar: 'active' as const
		},
		{
			key: 'done',
			title: 'Finished',
			dot: 'text-success-text',
			tile: 'bg-success-surface text-success-text',
			icon: Award01Icon,
			bar: 'completed' as const
		}
	];

	// A filter over what is already on screen — no request, because every enrolment
	// this learner has is here.
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

	// The band's own nav: where you are in the product. The rail below is everywhere
	// else you can go, and every destination in both is a route that exists.
	const TOP = [
		{ label: 'Dashboard', href: resolve('/dashboard') },
		{ label: 'Courses', href: resolve('/courses') },
		{ label: 'Community', href: resolve('/forum') }
	];

	const RAIL = [
		{ icon: BookOpen01Icon, label: 'Board', href: resolve('/dash'), current: true },
		{
			icon: DashboardSquare01Icon,
			label: 'Dashboard',
			href: resolve('/dashboard'),
			current: false
		},
		{ icon: Message01Icon, label: 'Forum', href: resolve('/forum'), current: false },
		{
			icon: Notification02Icon,
			label: 'Notifications',
			href: resolve('/notifications'),
			current: false
		},
		{ icon: Award01Icon, label: 'Certificates', href: resolve('/certificates'), current: false }
	];

	const firstName = $derived(data.user.name.split(' ')[0]);
</script>

<svelte:head><title>Board — Muallim</title></svelte:head>

<!--
	A column, so the sheet takes whatever height the band leaves and the band's color
	cannot show below it. `100vh minus a guessed header height` was the wrong shape of
	answer: it left a sliver of blue at the bottom the moment the guess was off by a
	pixel, and it would be off on every screen where the nav wraps.
-->
<div class="flex min-h-screen flex-col bg-accent">
	<!-- ============================================================== the band -->
	<header class="shrink-0 text-on-solid">
		<div class="flex items-center gap-8 px-6 py-4 sm:px-8">
			<a href={resolve('/dashboard')} class="flex items-center gap-2 font-semibold">
				<Icon icon={BookOpen01Icon} class="size-5" />
				Muallim
			</a>

			<nav aria-label="Primary" class="hidden sm:block">
				<ul class="flex items-center gap-1">
					{#each TOP as item (item.href)}
						<li>
							<a
								href={item.href}
								class="rounded-pill px-3 py-1.5 text-sm font-medium text-on-solid/80 transition-colors hover:bg-on-solid/10 hover:text-on-solid focus-visible:ring-2 focus-visible:ring-on-solid focus-visible:outline-none"
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<div class="ml-auto flex items-center gap-3">
				<a
					href={resolve('/notifications')}
					class="relative rounded-control p-2 text-on-solid/80 transition-colors hover:bg-on-solid/10 hover:text-on-solid focus-visible:ring-2 focus-visible:ring-on-solid focus-visible:outline-none"
					aria-label={data.unread > 0 ? `Notifications, ${data.unread} unread` : 'Notifications'}
				>
					<Icon icon={Notification02Icon} class="size-5" />
					{#if data.unread > 0}
						<span
							class="numeral absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-surface-raised px-1 text-[0.65rem] leading-4 font-semibold text-accent-text"
						>
							{data.unread > 9 ? '9+' : data.unread}
						</span>
					{/if}
				</a>

				<span
					class="flex size-8 items-center justify-center rounded-full bg-on-solid/15 text-sm font-semibold"
					aria-hidden="true"
				>
					{firstName.slice(0, 1)}
				</span>
			</div>
		</div>
	</header>

	<!--
		============================================================== the sheet

		Edge to edge: no gutter, no centring, no maximum width. The only thing between
		the sheet and the window is the band it lies on, and the rounded top corners are
		what shows it.
	-->
	<div class="flex-1 rounded-t-2xl bg-surface p-5 sm:p-6 lg:p-8">
		<div class="flex gap-4 sm:gap-6">
			<!--
					Icons only, with the name behind a tooltip — and the name is also the
					`aria-label`, so the rail is not a rebus to anyone who cannot hover it:
					a screen reader and a keyboard both get the word, not the picture.
				-->
			<nav aria-label="Sections" class="hidden shrink-0 sm:block">
				<ul class="sticky top-6 flex flex-col gap-1.5">
					{#each RAIL as item (item.href)}
						<li class="group relative">
							<a
								href={item.href}
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

							<!--
									Shown on hover and on keyboard focus alike. A tooltip that only
									answers a mouse is a tooltip half the readers never see.
								-->
							<span
								role="tooltip"
								class="pointer-events-none absolute top-1/2 left-full z-10 ml-2 -translate-y-1/2 rounded-control bg-text px-2 py-1 text-xs whitespace-nowrap text-surface opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
							>
								{item.label}
							</span>
						</li>
					{/each}
				</ul>
			</nav>

			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div>
						<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">My learning</h1>
						<p class="text-muted mt-1 text-sm">
							<span class="numeral">{data.enrolments.length}</span>
							{data.enrolments.length === 1 ? 'course' : 'courses'}, by where you have got to.
						</p>
					</div>

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
				</div>

				<div class="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
					<!-- ================================================ the board -->
					<div class="grid gap-5 md:grid-cols-3">
						{#each COLUMNS as col (col.key)}
							{@const items = column(col.key)}
							<section>
								<h2 class="flex items-center gap-2 px-1 pb-3 text-sm font-medium">
									<span class={cn('size-2 rounded-full bg-current', col.dot)}></span>
									{col.title}
									<span
										class="text-muted numeral ml-auto rounded-pill bg-surface-sunken px-2 py-0.5 text-xs"
									>
										{items.length}
									</span>
								</h2>

								{#if items.length === 0}
									<p
										class="text-muted rounded-card border border-dashed border-border px-2 py-8 text-center text-xs"
									>
										{query ? 'Nothing matches.' : 'Nothing here.'}
									</p>
								{:else}
									<ul class="space-y-3">
										{#each items as enrolment (enrolment.course_slug)}
											{@const progress = enrolment.progress}
											{@const percent = progress?.percent ?? 0}
											<li>
												<!--
													A card lifted by a shadow rather than outlined by a border. This
													is the one page in the product that does it: the system's rule is
													that a border separates and nothing else does, and a shadow was
													refused for good reasons — it does not theme, and forty of them
													down a queue is a queue nobody can read. On a board of a dozen
													cards the trade reads differently, which is what this route is
													for. It is a proposal, and that rule is the thing it proposes.

													The card is the whole target. An "Open" button would only repeat
													what clicking it already does.
												-->
												<a
													href={resolve(`/courses/${enrolment.course_slug}`)}
													class="block rounded-2xl bg-surface-raised p-4 shadow-card transition-shadow duration-(--duration-base) hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
												>
													<div class="flex items-start gap-3">
														<!-- The tinted tile, in the state's own color. -->
														<span
															class={cn(
																'flex size-9 shrink-0 items-center justify-center rounded-control',
																col.tile
															)}
														>
															<Icon icon={col.icon} class="size-4.5" />
														</span>

														<div class="min-w-0 flex-1">
															<p class={cn('text-xs font-medium', col.dot)}>{col.title}</p>
															<p class="mt-0.5 text-sm font-medium text-pretty">
																{enrolment.course_title}
															</p>
														</div>
													</div>

													<div class="mt-4 flex items-center justify-between gap-2">
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
															class={cn(
																'mt-3 flex items-center gap-1 text-xs font-medium',
																col.dot
															)}
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

					<!-- ============================================== the side rail -->
					<aside class="space-y-4">
						<section class="rounded-2xl bg-surface-raised p-5 shadow-card">
							<h2 class="flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
								Notifications
								{#if data.unread > 0}
									<span
										class="numeral rounded-pill bg-accent px-1.5 text-xs font-semibold text-on-solid"
									>
										{data.unread}
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
						</section>

						{#if data.gamification}
							{@const g = data.gamification}
							<section class="rounded-2xl bg-surface-raised p-5 shadow-card">
								<h2 class="text-sm font-medium tracking-wide uppercase">Progress points</h2>
								<p class="mt-3 flex items-baseline gap-2">
									<span class="numeral text-3xl font-semibold tracking-tight">{g.points}</span>
									<span class="text-muted text-sm">points</span>
								</p>
								<p class="text-muted mt-1 text-xs">
									Rank <span class="numeral">{g.rank}</span> of
									<span class="numeral">{g.out_of}</span>
								</p>
							</section>
						{/if}
					</aside>
				</div>
			</div>
		</div>
	</div>
</div>
