<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowRight01Icon,
		Award01Icon,
		BookOpen01Icon,
		ChartAverageIcon,
		CheckmarkCircle02Icon,
		PencilEdit02Icon,
		PlusSignIcon,
		TaskDone01Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Card,
		Donut,
		DonutLegend,
		EmptyState,
		Icon,
		Page,
		Progress,
		RadialProgress
	} from '$lib/components';
	import { canAuthor as canAuthorRole } from '$lib/roles';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Hiding the link is a courtesy, not a control: /teach is guarded by muallim-api,
	// which answers 403 to a student who types the address.
	const canAuthor = $derived(canAuthorRole(data.user));

	const firstName = $derived(data.user.name.split(' ')[0]);

	// The reader's own locale names the day. Computed once, on render: a dashboard is
	// not open long enough for midnight to matter, and a clock that ticks is a clock
	// that re-renders the page under somebody reading it.
	const today = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date());

	// Furthest along first: the top of the list is the thing to resume.
	const active = $derived(
		data.enrolments
			.filter((e) => e.status === 'active')
			.sort((a, b) => (b.progress?.percent ?? 0) - (a.progress?.percent ?? 0))
	);
	const finished = $derived(data.enrolments.filter((e) => e.status === 'completed'));

	const averagePercent = $derived(
		data.enrolments.length === 0
			? 0
			: Math.round(
					data.enrolments.reduce((total, e) => total + (e.progress?.percent ?? 0), 0) /
						data.enrolments.length
				)
	);

	const lessonsDone = $derived(
		data.enrolments.reduce((total, e) => total + (e.progress?.lessons_completed ?? 0), 0)
	);

	function lessonsLeft(progress: { lessons_total?: number; lessons_completed?: number } | null) {
		return Math.max(0, (progress?.lessons_total ?? 0) - (progress?.lessons_completed ?? 0));
	}

	/*
		Every number here is one the learner could count for themselves. No streak, no
		hours studied, no "insights": a figure nobody can check is a figure nobody
		should be shown, and that rule is what keeps the invented widgets other
		dashboards carry off this one.

		Points earned (in their own card below) pass the same test: they are a defined
		sum — ten a lesson, a hundred a course — that a learner can check, not a
		fabricated engagement score. That is why they earn a place here and "hours
		studied" does not.
	*/

	// Every course this learner ever started, by what became of it. These three sum to
	// one whole, which is why they are drawn as parts of one and not as three tiles
	// that happen to sit together.
	const lapsed = $derived(
		data.enrolments.filter((e) => e.status !== 'active' && e.status !== 'completed')
	);

	const courseMix = $derived([
		{ key: 'active', label: 'In progress', value: active.length, tone: 'text-chart-1' },
		{ key: 'finished', label: 'Finished', value: finished.length, tone: 'text-chart-2' },
		{ key: 'lapsed', label: 'Lapsed', value: lapsed.length, tone: 'text-chart-3' }
	]);

	let hovered = $state<string | null>(null);

	// The two figures that are *not* parts of that whole. A stat tile is the right
	// form for a lone number, and forcing them into the ring would be a lie about
	// what they are.
	const STATS = $derived([
		{
			label: 'Lessons completed',
			value: lessonsDone,
			tone: 'accent' as const,
			icon: TaskDone01Icon
		},
		{
			label: 'Average progress',
			value: `${averagePercent}%`,
			tone: 'warning' as const,
			icon: ChartAverageIcon
		}
	]);

	// A tinted tile behind each stat's icon — the mark that replaced the coloured
	// dot, because a dot is a legend nobody was given the key to.
	const TILE: Record<string, string> = {
		accent: 'bg-accent-surface text-accent-text',
		success: 'bg-success-surface text-success-text',
		warning: 'bg-warning-surface text-warning-text'
	};

	// And the figure itself, in the tile's own ink. The tile and the number are one
	// statement; two colours would make them two.
	const INK: Record<string, string> = {
		accent: 'text-accent-text',
		success: 'text-success-text',
		warning: 'text-warning-text'
	};
</script>

<svelte:head><title>Dashboard — Muallim</title></svelte:head>

<Page width="full">
	<!--
		No horizon of its own any more: the band above the sheet is the horizon, for
		every page in the app rather than for this one. What is left here is the
		greeting, which is a page heading and reads as one.
	-->
	<!--
		The date, not the address. A person knows their own email; what they do not know,
		arriving, is what day it is against the deadlines they are carrying. And no
		"Browse the catalogue" button: Courses is in the band on every page, and a button
		that repeats a menu item is a button in the way.
	-->
	<div>
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
			Welcome back, {firstName}.
		</h1>
		<p class="text-muted mt-1 text-sm">{today}</p>
	</div>

	{#if form?.resent}
		<Alert class="mt-6" role="status">
			A new confirmation link is on its way. Any earlier link has stopped working.
		</Alert>
	{:else if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{:else if !data.user.email_verified}
		<Alert tone="warning" class="mt-6">
			<div class="flex flex-wrap items-center gap-3">
				<span>Your email address is not confirmed yet.</span>
				<form method="POST" action="?/resendVerification" use:enhance>
					<Button type="submit" variant="secondary" size="sm">Resend the link</Button>
				</form>
			</div>
		</Alert>
	{/if}

	<!--
		The summary first, then the work.
	
		A learner arriving wants to know where they stand before they are asked to
		pick something up — and the numbers are three lines, where the courses are
		the rest of the page. The order was the other way round because the aside
		happened to be an aside, which is a layout deciding an argument it should
		not have been in.
	-->
	<div class="mt-8 grid gap-6 lg:grid-cols-2">
		<!--
			White and floating, like every other card on the page. It was sunken because it
			was an aside; it is not an aside any more, and a grey box at the top of a page
			reads as something switched off.
		-->
		<Card float class="p-5 sm:p-6">
			<h2 class="flex items-center gap-2.5 text-sm font-medium">
				<span
					class="flex size-7 items-center justify-center rounded-control bg-accent-surface text-accent-text"
				>
					<Icon icon={ChartAverageIcon} class="size-4" strokeWidth={2} />
				</span>
				At a glance
			</h2>

			<!--
					What became of every course this learner started — three states of one
					whole, so they are drawn as parts of one rather than as three tiles that
					happen to sit together. Hovering a row lights its slice and hovering a
					slice lights its row: one bound value, so the two cannot disagree.
				-->
			<div class="mt-5 flex items-center gap-5">
				<Donut segments={courseMix} centreLabel="courses" bind:hovered size={132} />

				{#if data.enrolments.length === 0}
					<p class="text-muted min-w-0 flex-1 text-sm">
						Nothing yet. Enrol on a course and this fills itself in.
					</p>
				{:else}
					<div class="min-w-0 flex-1">
						<DonutLegend segments={courseMix} bind:hovered caption="Your courses by status" />
					</div>
				{/if}
			</div>

			<!--
				The figure wears the colour of its own tile. Colour here is not decoration:
				it is the thread tying the number to the mark beside it, and a page where
				every number is the same ink is a page you have to read rather than scan.
			-->
			<dl class="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-5">
				{#each STATS as stat (stat.label)}
					<div>
						<dt class="text-muted flex items-center gap-2 text-xs">
							<span
								class={cn('flex size-6 items-center justify-center rounded-md', TILE[stat.tone])}
							>
								<Icon icon={stat.icon} class="size-3.5" strokeWidth={2} />
							</span>
							{stat.label}
						</dt>
						<dd class={cn('numeral mt-2 text-2xl font-semibold tracking-tight', INK[stat.tone])}>
							{stat.value}
						</dd>
					</div>
				{/each}
			</dl>
		</Card>

		<!-- Points, rank, and badges — a nudge to keep going. -->
		{#if data.gamification}
			{@const g = data.gamification}
			<Card float class="p-5 sm:p-6">
				<div class="flex items-baseline justify-between gap-3">
					<h2 class="flex items-center gap-2.5 text-sm font-medium">
						<span
							class="flex size-7 items-center justify-center rounded-control bg-warning-surface text-warning-text"
						>
							<Icon icon={Award01Icon} class="size-4" strokeWidth={2} />
						</span>
						Progress points
					</h2>
					<a
						class="text-muted text-sm underline-offset-4 hover:text-text hover:underline"
						href={resolve('/leaderboard')}
					>
						Leaderboard
					</a>
				</div>

				<div class="mt-5 flex items-baseline gap-3">
					<span class="text-accent-text numeral text-3xl font-semibold tracking-tight">
						{g.points}
					</span>
					<span class="text-muted text-sm">points</span>
					{#if g.out_of > 0}
						<span class="text-muted ml-auto text-sm">
							Rank <span class="numeral">{g.rank}</span> of
							<span class="numeral">{g.out_of}</span>
						</span>
					{/if}
				</div>

				<ul class="mt-5 space-y-2">
					{#each g.badges as badge (badge.code)}
						<li
							class={cn(
								'flex items-center gap-2.5 text-sm',
								badge.earned ? 'text-text' : 'text-muted/60'
							)}
						>
							<span
								class={cn(
									'flex size-6 shrink-0 items-center justify-center rounded-full',
									badge.earned ? 'bg-accent-surface text-accent-text' : 'bg-surface-sunken'
								)}
							>
								<Icon icon={Award01Icon} class="size-3.5" strokeWidth={2} />
							</span>
							<span class="min-w-0">
								<span class="font-medium">{badge.name}</span>
								<span class="text-muted block text-xs">{badge.description}</span>
							</span>
						</li>
					{/each}
				</ul>
			</Card>
		{/if}
	</div>

	<div class="mt-10 grid gap-8 lg:grid-cols-3">
		<!-- ================================================= learning (main) -->
		<!-- ===================================================== learning (main) -->
		<div class="lg:col-span-2">
			<h2 class="text-lg font-semibold">Continue learning</h2>

			{#if active.length === 0}
				<div class="mt-4">
					<EmptyState
						icon={BookOpen01Icon}
						title="Nothing on the go"
						description="Enrol on a course and it will show up here, with how far through it you are."
					>
						{#snippet action()}
							<Button href={resolve('/courses')} size="sm">Browse the catalogue</Button>
						{/snippet}
					</EmptyState>
				</div>
			{:else}
				<!-- The hero stands apart; the list below it closes up. -->
				<ul class="mt-4 space-y-3">
					{#each active as enrolment, index (enrolment.course_slug)}
						{@const progress = enrolment.progress}
						{@const percent = progress?.percent ?? 0}
						<li>
							<!--
								One hero, and the rest are a list.

								The furthest-along course is the one to resume, so it is the only thing
								on this page set large: a tinted wash, the accent border, the ring, and
								a title at the size of a heading. Everything under it gets quieter and
								denser — smaller type, tighter rows, a thinner bar — because a page
								where five cards all shout is a page with no hero at all. Weight and
								air do the work here, not another colour.
							-->
							<Card
								surface={index === 0 ? 'aurora' : 'raised'}
								float={index !== 0}
								class={cn('lift', index === 0 ? 'p-6 sm:p-7' : 'px-5 py-4')}
							>
								<div class={cn('flex items-start', index === 0 ? 'gap-6' : 'gap-4')}>
									{#if index === 0}
										<div class="hidden shrink-0 sm:block">
											<RadialProgress
												value={percent}
												tone="inverse"
												label="{percent}% complete"
												size={96}
											/>
										</div>
									{/if}

									<div class="min-w-0 flex-1">
										<div class="flex flex-wrap items-start justify-between gap-3">
											<div class="min-w-0">
												{#if index === 0}
													<p class="text-xs font-medium tracking-wide text-on-solid/75 uppercase">
														Pick up where you left off
													</p>
												{/if}
												<a
													class={cn(
														'block text-pretty underline-offset-4 hover:underline',
														index === 0
															? 'mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl'
															: 'text-sm font-medium'
													)}
													href={resolve(`/courses/${enrolment.course_slug}`)}
												>
													{enrolment.course_title}
												</a>
											</div>

											<!-- A white button on the aurora: the primary is the colour it would
											     be sitting on, and a blue button on blue is a button nobody sees. -->
											<Button
												href={resolve(`/courses/${enrolment.course_slug}`)}
												variant={index === 0 ? 'secondary' : 'ghost'}
												size="sm"
												class={index === 0
													? 'border-transparent bg-surface-raised text-accent-text hover:bg-surface-raised/90'
													: undefined}
											>
												Continue
												<Icon icon={ArrowRight01Icon} class="size-4" />
											</Button>
										</div>

										<div
											class={cn(
												'flex items-center justify-between gap-3',
												index === 0 ? 'mt-4 text-sm' : 'mt-2.5 text-xs'
											)}
										>
											<span class="numeral font-medium">{percent}% done</span>
											<span
												class={cn(
													'numeral text-xs',
													index === 0 ? 'text-on-solid/75' : 'text-muted'
												)}
											>
												{lessonsLeft(progress)}
												{lessonsLeft(progress) === 1 ? 'lesson' : 'lessons'} left
											</span>
										</div>
										<div class={index === 0 ? 'mt-2' : 'mt-1.5'}>
											<!--
												In the state's own colour, which is the donut's colour for that
												slice. Every course on this page now says what became of it in the
												same hue whether it is a bar, a ring, or an arc.
											-->
											<Progress
												value={progress?.lessons_completed ?? 0}
												max={progress?.lessons_total ?? 1}
												tone={index === 0 ? 'inverse' : 'active'}
												class={index === 0 ? undefined : 'h-1.5'}
												label="{percent}% of {enrolment.course_title} complete"
											/>
										</div>
									</div>
								</div>
							</Card>
						</li>
					{/each}
				</ul>
			{/if}

			{#if finished.length > 0}
				<div class="mt-10 flex items-baseline justify-between gap-3">
					<h2 class="text-lg font-semibold">Finished</h2>
					<a
						class="text-muted text-sm underline-offset-4 hover:text-text hover:underline"
						href={resolve('/certificates')}
					>
						Your certificates
					</a>
				</div>
				<ul class="mt-4 space-y-2">
					{#each finished as enrolment (enrolment.course_slug)}
						<li>
							<Card float class="flex items-center justify-between gap-4 px-5 py-3.5">
								<div class="flex min-w-0 items-center gap-3">
									<span
										class="flex size-9 shrink-0 items-center justify-center rounded-card bg-success-surface text-success-text"
									>
										<Icon icon={Award01Icon} class="size-5" />
									</span>
									<a
										class="min-w-0 truncate text-sm font-medium underline-offset-4 hover:underline"
										href={resolve(`/courses/${enrolment.course_slug}`)}
									>
										{enrolment.course_title}
									</a>
								</div>
								<Badge tone="success" icon={CheckmarkCircle02Icon}>Complete</Badge>
							</Card>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- =============================================== teaching (aside) -->
		<aside class="space-y-8">
			{#if canAuthor}
				<section>
					<div class="flex items-baseline justify-between gap-3">
						<h2 class="text-lg font-semibold">Recently taught</h2>
						<a
							class="text-muted text-sm underline-offset-4 hover:text-text hover:underline"
							href={resolve('/teach')}
						>
							All courses
						</a>
					</div>

					{#if data.teaching.length === 0}
						<div class="mt-4">
							<EmptyState
								icon={PencilEdit02Icon}
								title="No courses yet"
								description="Write the first one."
							>
								{#snippet action()}
									<Button href={resolve('/teach')} size="sm">
										<Icon icon={PlusSignIcon} class="size-4" />
										Create a course
									</Button>
								{/snippet}
							</EmptyState>
						</div>
					{:else}
						<ul class="mt-4 space-y-2">
							{#each data.teaching as course (course.slug)}
								<li>
									<Card class="lift px-5 py-3.5">
										<div class="flex items-start justify-between gap-3">
											<a
												class="text-sm font-medium underline-offset-4 hover:underline"
												href={resolve(`/teach/${course.slug}`)}
											>
												{course.title}
											</a>
											{#if course.status === 'published'}
												<Badge tone="success" icon={CheckmarkCircle02Icon}>Live</Badge>
											{:else}
												<Badge icon={PencilEdit02Icon}>Draft</Badge>
											{/if}
										</div>
									</Card>
								</li>
							{/each}
						</ul>

						<Button href={resolve('/teach')} variant="secondary" size="sm" class="mt-4 w-full">
							<Icon icon={PlusSignIcon} class="size-4" />
							New course
						</Button>
					{/if}
				</section>
			{/if}
		</aside>
	</div>
</Page>
