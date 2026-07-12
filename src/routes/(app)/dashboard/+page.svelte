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
</script>

<svelte:head><title>Dashboard — Muallim</title></svelte:head>

<Page width="full">
	<!--
		A horizon. The page used to open on a heading floating in grey, which gives the
		eye nothing to start from; a band with a wash of the accent says where the page
		begins. Built from tokens, so it themes — a hardcoded gradient reads as premium
		light on white and as grime on a dark surface.
	-->
	<div
		class="rounded-card bg-gradient-to-br from-accent-surface via-surface-sunken to-surface-sunken p-6 sm:p-8"
	>
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
					Welcome back, {firstName}.
				</h1>
				<p class="text-muted mt-1 text-sm">{data.user.email}</p>
			</div>
			<Button href={resolve('/courses')} variant="secondary" size="sm">Browse the catalogue</Button>
		</div>
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

	<div class="mt-8 grid gap-8 lg:grid-cols-3">
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
				<ul class="mt-4 space-y-4">
					{#each active as enrolment, index (enrolment.course_slug)}
						{@const progress = enrolment.progress}
						{@const percent = progress?.percent ?? 0}
						<li>
							<!--
								The furthest-along course is the one to resume, so it wears a colour
								the others do not — a tinted wash and its border in the accent — and
								carries the ring. The rest are plain cards. One highlight, not five.
							-->
							<Card
								class={cn(
									'lift p-5 sm:p-6',
									index === 0 &&
										'border-accent-border bg-gradient-to-br from-accent-surface to-surface-raised'
								)}
							>
								<div class="flex items-start gap-5">
									{#if index === 0}
										<div class="hidden shrink-0 sm:block">
											<RadialProgress value={percent} label="{percent}% complete" size={84} />
										</div>
									{/if}

									<div class="min-w-0 flex-1">
										<div class="flex flex-wrap items-start justify-between gap-3">
											<div class="min-w-0">
												{#if index === 0}
													<p class="text-accent-text text-xs font-medium tracking-wide uppercase">
														Pick up where you left off
													</p>
												{/if}
												<a
													class="mt-1 block font-semibold text-pretty underline-offset-4 hover:underline"
													href={resolve(`/courses/${enrolment.course_slug}`)}
												>
													{enrolment.course_title}
												</a>
											</div>

											<Button
												href={resolve(`/courses/${enrolment.course_slug}`)}
												variant={index === 0 ? 'primary' : 'secondary'}
												size="sm"
											>
												Continue
												<Icon icon={ArrowRight01Icon} class="size-4" />
											</Button>
										</div>

										<div class="mt-4 flex items-center justify-between gap-3 text-sm">
											<span class="numeral font-medium">{percent}% done</span>
											<span class="text-muted numeral text-xs">
												{lessonsLeft(progress)}
												{lessonsLeft(progress) === 1 ? 'lesson' : 'lessons'} left
											</span>
										</div>
										<div class="mt-2">
											<Progress
												value={progress?.lessons_completed ?? 0}
												max={progress?.lessons_total ?? 1}
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
							<Card class="flex items-center justify-between gap-4 px-5 py-3.5">
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

		<!-- =================================================== summary (aside) -->
		<aside class="space-y-8">
			<!-- On the side, where a summary belongs: it is read, not worked in. -->
			<Card surface="sunken" class="p-5">
				<h2 class="text-sm font-medium tracking-wide uppercase">At a glance</h2>

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
							<dd class="numeral mt-2 text-2xl font-semibold tracking-tight">{stat.value}</dd>
						</div>
					{/each}
				</dl>
			</Card>

			<!-- Points, rank, and badges — a nudge to keep going. -->
			{#if data.gamification}
				{@const g = data.gamification}
				<Card surface="sunken" class="p-5">
					<div class="flex items-baseline justify-between gap-3">
						<h2 class="text-sm font-medium tracking-wide uppercase">Progress points</h2>
						<a
							class="text-muted text-sm underline-offset-4 hover:text-text hover:underline"
							href={resolve('/leaderboard')}
						>
							Leaderboard
						</a>
					</div>

					<div class="mt-4 flex items-baseline gap-3">
						<span class="numeral text-3xl font-semibold tracking-tight">{g.points}</span>
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
