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
		ActionLink,
		Alert,
		Counter,
		Badge,
		Button,
		Card,
		Donut,
		DonutLegend,
		EmptyState,
		Icon,
		MiniCalendar,
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

	// Every lesson on every course they are on. A count with no denominator is a
	// number nobody can place: 39 is most of a course or a tenth of a syllabus, and
	// muallim-api already sends the total, so there is no excuse for not saying which.
	const lessonsAll = $derived(
		data.enrolments.reduce((total, e) => total + (e.progress?.lessons_total ?? 0), 0)
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
			suffix: '',
			// The number against what it is a number *of*, and a bar of the same fraction:
			// the empty half of the bar is the part of this dashboard that is the point.
			of: lessonsAll > 0 ? `of ${lessonsAll}` : '',
			percent: lessonsAll === 0 ? 0 : Math.round((lessonsDone / lessonsAll) * 100),
			bar: 'active' as const,
			tone: 'accent' as const,
			icon: TaskDone01Icon
		},
		{
			label: 'Average progress',
			value: averagePercent,
			suffix: '%',
			of: data.enrolments.length > 0 ? `across ${data.enrolments.length} courses` : '',
			percent: averagePercent,
			bar: 'lapsed' as const,
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
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
			Welcome back, {firstName}.
		</h1>
		<p class="text-muted text-sm">{today}</p>
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
	<!-- ==================================================== at a glance (section) -->
	<!--
		Its own section, running the width of the page. It was half of a two-up row with
		points beside it, and the two were never the same kind of thing: this is what
		became of the courses you started, and that is a game you are playing. Sharing a
		row made them look like one statement in two halves.
	-->
	<section class="mt-8">
		<h2 class="flex items-center gap-2.5 text-lg font-semibold">
			<span
				class="flex size-8 items-center justify-center rounded-control bg-accent-surface text-accent-text"
			>
				<Icon icon={ChartAverageIcon} class="size-4.5" strokeWidth={2} />
			</span>
			At a glance
		</h2>

		<!--
			Three columns of equal width, divided rather than floated: what became of the
			courses, what has been done in them, and what is owed next. They were a donut
			with two numbers adrift beside it and a calendar pinned to the far edge, which
			read as three things that had been pushed apart rather than three that belong.
		-->
		<Card float class="mt-4 p-5 sm:p-6">
			<!--
				The rules between the thirds are dashed. A solid rule reads as a wall — the
				edge of one card butted against another — and these three are one statement
				in three parts. A dashed one separates without dividing.
			-->
			<div class="grid gap-8 lg:grid-cols-3 lg:gap-0">
				<!--
					What became of every course this learner started — three states of one
					whole, so they are drawn as parts of one rather than as three tiles that
					happen to sit together. Hovering a row lights its slice and hovering a
					slice lights its row: one bound value, so the two cannot disagree.
				-->
				<div class="flex items-center justify-center gap-6 lg:pr-8">
					<Donut segments={courseMix} centreLabel="courses" bind:hovered size={140} />

					{#if data.enrolments.length === 0}
						<p class="text-muted min-w-40 text-sm">
							Nothing yet. Enrol on a course and this fills itself in.
						</p>
					{:else}
						<div class="min-w-40">
							<DonutLegend segments={courseMix} bind:hovered caption="Your courses by status" />
						</div>
					{/if}
				</div>

				<!--
					The figure wears the colour of its own tile. Colour here is not decoration:
					it is the thread tying the number to the mark beside it, and a page where
					every number is the same ink is a page you have to read rather than scan.
				-->
				<dl
					class="grid content-center gap-6 border-dashed border-border max-lg:border-t max-lg:pt-8 sm:grid-cols-2 lg:grid-cols-1 lg:gap-8 lg:border-l lg:border-r lg:px-8"
				>
					{#each STATS as stat (stat.label)}
						<!--
							The figure first and its name under it, small. A stat tile leads with the
							number because the number is what was asked for; the label is what you
							read second, to find out what it was the number of.

							Source order is dt, dd, dd — a term and the two things said about it —
							and `order` puts the figure on top. The reader gets the layout; a screen
							reader still gets the sentence.
						-->
						<div class="flex flex-col">
							<dt class="text-muted order-2 mt-1.5 flex items-center gap-2 text-xs">
								<span
									class={cn('flex size-5 items-center justify-center rounded-md', TILE[stat.tone])}
								>
									<Icon icon={stat.icon} class="size-3" strokeWidth={2} />
								</span>
								{stat.label}
							</dt>

							<dd class="order-1 flex items-baseline gap-2">
								<Counter
									value={stat.value}
									suffix={stat.suffix}
									class={cn('text-4xl font-semibold tracking-tight', INK[stat.tone])}
								/>
								{#if stat.of}
									<span class="text-muted numeral text-sm">{stat.of}</span>
								{/if}
							</dd>

							<dd class="order-3 mt-3">
								<Progress
									value={stat.percent}
									tone={stat.bar}
									class="h-1.5"
									label="{stat.percent}% — {stat.label.toLowerCase()}"
								/>
							</dd>
						</div>
					{/each}
				</dl>

				<!--
					What is owed, and when. A learner's next question after "how am I doing" is
					"what is due", so it sits in the same card, in the third of it.

					Every date on it is real: muallim-api answers /v1/me/deadlines with the
					assignments this learner has not handed in, and decides what is overdue
					against its own clock.
				-->
				<div class="border-dashed border-border max-lg:border-t max-lg:pt-8 lg:pl-8">
					<MiniCalendar deadlines={data.deadlines} />
				</div>
			</div>
		</Card>
	</section>

	<!-- ================================================= progress points (section) -->
	{#if data.gamification}
		{@const g = data.gamification}
		{@const badges = g.badges ?? []}
		{@const earned = badges.filter((badge) => badge.earned).length}
		<section class="mt-10">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="flex items-center gap-2.5 text-lg font-semibold">
					<span
						class="flex size-8 items-center justify-center rounded-control bg-warning-surface text-warning-text"
					>
						<Icon icon={Award01Icon} class="size-4.5" strokeWidth={2} />
					</span>
					Progress points
				</h2>

				<ActionLink href={resolve('/leaderboard')}>See the leaderboard</ActionLink>
			</div>

			<!--
				Three tiles, because these are three separate facts and a paragraph of them
				is a paragraph nobody reads. Points is what you have, rank is where that
				puts you, badges is what is left.
			-->
			<dl class="mt-4 grid gap-4 sm:grid-cols-3">
				<Card float class="p-5">
					<dt class="text-muted text-xs tracking-wide uppercase">Points earned</dt>
					<dd class="mt-2">
						<Counter
							value={g.points}
							class="text-accent-text text-3xl font-semibold tracking-tight"
						/>
					</dd>
					<p class="text-muted mt-1 text-xs">Ten a lesson, a hundred a course.</p>
				</Card>

				<Card float class="p-5">
					<dt class="text-muted text-xs tracking-wide uppercase">Rank</dt>
					<dd class="mt-2 flex items-baseline gap-1.5">
						<Counter value={g.rank} class="text-3xl font-semibold tracking-tight" />
						{#if g.out_of > 0}
							<span class="text-muted numeral text-sm">of {g.out_of}</span>
						{/if}
					</dd>
					<p class="text-muted mt-1 text-xs">Across everybody in this workspace.</p>
				</Card>

				<Card float class="p-5">
					<dt class="text-muted text-xs tracking-wide uppercase">Badges</dt>
					<dd class="mt-2 flex items-baseline gap-1.5">
						<Counter
							value={earned}
							class="text-warning-text text-3xl font-semibold tracking-tight"
						/>
						<span class="text-muted numeral text-sm">of {badges.length}</span>
					</dd>

					<!-- Each badge, earned or not: what is left to earn is the reason for
					     showing the ones already earned. -->
					<ul class="mt-3 flex flex-wrap gap-1.5">
						{#each badges as badge (badge.code)}
							<li
								title="{badge.name} — {badge.description}"
								class={cn(
									'flex items-center gap-1.5 rounded-pill px-2 py-1 text-xs font-medium',
									badge.earned
										? 'bg-warning-surface text-warning-text'
										: 'bg-surface-sunken text-muted/70'
								)}
							>
								<Icon icon={Award01Icon} class="size-3" strokeWidth={2} />
								{badge.name}
							</li>
						{/each}
					</ul>
				</Card>
			</dl>
		</section>
	{/if}

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

											<!-- Glass on the aurora, not white. A white slab punches a hole in the
											     brand's own light and the eye reads the paper rather than the button;
											     the translucent fill lets the gradient through, so the button belongs
											     to the card it stands on. -->
											<Button
												href={resolve(`/courses/${enrolment.course_slug}`)}
												variant={index === 0 ? 'glass' : 'ghost'}
												size="sm"
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
					<ActionLink href={resolve('/certificates')} tone="muted">Your certificates</ActionLink>
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
						<ActionLink href={resolve('/teach')} tone="muted">All courses</ActionLink>
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
									<!-- Float, like every other loose card on this page: a column of six
								     bordered boxes is six boxes, and the shadow says "on the page" where
								     the box only says "here is an edge". -->
									<Card float class="lift px-5 py-3.5">
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

						<!-- The one thing to *do* in this column, so it wears the accent. It was a
					     secondary button, which is the styling for a button beside a primary one —
					     and there is no primary one here. -->
						<Button href={resolve('/teach')} class="mt-5 w-full">
							<Icon icon={PlusSignIcon} class="size-4" />
							New course
						</Button>
					{/if}
				</section>
			{/if}
		</aside>
	</div>
</Page>
