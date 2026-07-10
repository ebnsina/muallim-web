<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowRight01Icon,
		Award01Icon,
		Book02Icon,
		BookOpen01Icon,
		ChartLineData01Icon,
		CheckmarkCircle02Icon,
		PencilEdit02Icon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Card,
		EmptyState,
		Icon,
		Numeral,
		Page,
		PageHeader,
		Progress
	} from '$lib/components';
	import { canAuthor as canAuthorRole } from '$lib/roles';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Hiding the link is a courtesy, not a control: /teach is guarded by lms-api,
	// which answers 403 to a student who types the address.
	const canAuthor = $derived(canAuthorRole(data.user));

	const firstName = $derived(data.user.name.split(' ')[0]);

	const active = $derived(data.enrolments.filter((e) => e.status === 'active'));
	const finished = $derived(data.enrolments.filter((e) => e.status === 'completed'));

	/*
		The mean of the per-course percentages, and the card says "average" so it
		cannot be mistaken for the other one.

		A learner three lessons into a thirty-lesson course and one lesson into a
		two-lesson course is 30% done on average and 12% done by lessons. Neither is
		wrong. This is the one people mean when they ask.
	*/
	const averagePercent = $derived(
		data.enrolments.length === 0
			? 0
			: Math.round(
					data.enrolments.reduce((total, e) => total + (e.progress?.percent ?? 0), 0) /
						data.enrolments.length
				)
	);

	/** What to open next: furthest along, and not yet finished. */
	const continueWith = $derived(
		[...active].sort((a, b) => (b.progress?.percent ?? 0) - (a.progress?.percent ?? 0)).slice(0, 3)
	);

	/** Lessons finished across every course. A number the learner could count. */
	const lessonsDone = $derived(
		data.enrolments.reduce((total, e) => total + (e.progress?.lessons_completed ?? 0), 0)
	);

	/*
		No "courses you teach" figure here, and the omission is deliberate.

		`/v1/me/courses` is a page, not a count — asking it for six courses and then
		reporting `6` would report the page size to anyone with more than six, and
		report it confidently. The list below says "recent" and links to the rest.
		A number nobody can check is a number nobody should be shown.
	*/
	const STATS = $derived([
		{
			icon: BookOpen01Icon,
			label: 'Courses in progress',
			value: active.length,
			suffix: '',
			tone: 'accent'
		},
		{
			icon: CheckmarkCircle02Icon,
			label: 'Courses finished',
			value: finished.length,
			suffix: '',
			tone: 'success'
		},
		{
			icon: ChartLineData01Icon,
			label: 'Average progress',
			value: averagePercent,
			suffix: '%',
			tone: 'warning'
		},
		{ icon: Book02Icon, label: 'Lessons completed', value: lessonsDone, suffix: '', tone: 'accent' }
	] as const);

	// The icon chip's colour, per stat. Written out rather than composed, because
	// Tailwind reads class strings statically and cannot see `bg-${tone}-surface`.
	const CHIP: Record<string, string> = {
		accent: 'bg-accent-surface text-accent-text',
		success: 'bg-success-surface text-success-text',
		warning: 'bg-warning-surface text-warning-text'
	};
</script>

<svelte:head><title>Dashboard — Muallim</title></svelte:head>

<Page width="full">
	<div>
		<PageHeader title="Welcome back, {firstName}." description={data.user.email} />
	</div>

	{#if form?.resent}
		<Alert class="mt-8" role="status">
			A new confirmation link is on its way. Any earlier link has stopped working.
		</Alert>
	{:else if form?.message}
		<Alert tone="danger" class="mt-8" role="alert">{form.message}</Alert>
	{:else if !data.user.email_verified}
		<Alert tone="warning" class="mt-8">
			<div class="flex flex-wrap items-center gap-3">
				<span>Your email address is not confirmed yet.</span>
				<form method="POST" action="?/resendVerification" use:enhance>
					<Button type="submit" variant="secondary" size="sm">Resend the link</Button>
				</form>
			</div>
		</Alert>
	{/if}

	<!--
		Four numbers, and each is one the learner could count for themselves. No
		streak, no engagement score, no badge: a figure nobody can check is a figure
		nobody should be shown.
	-->
	<section aria-label="Your progress" class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each STATS as stat (stat.label)}
			<Card class="flex items-center gap-4 p-5">
				<!--
					The colour lives in the chip, not the card. A wall of four fully-tinted
					cards is louder than the numbers on them; a small badge of colour tells
					the eye which is which without shouting.
				-->
				<span
					class={[
						'flex size-11 shrink-0 items-center justify-center rounded-card',
						CHIP[stat.tone]
					]}
				>
					<Icon icon={stat.icon} class="size-5" />
				</span>
				<div class="min-w-0">
					<p class="truncate text-sm text-muted">{stat.label}</p>
					<p class="flex items-baseline text-2xl font-semibold tracking-tight">
						<Numeral value={stat.value} />{stat.suffix}
					</p>
				</div>
			</Card>
		{/each}
	</section>

	<div class="mt-12 grid gap-10 lg:grid-cols-3">
		<!-- --------------------------------------------------------- keep going -->
		<!-- A student has no teaching column, so this takes the whole width rather
		     than leaving a third of the page empty beside it. -->
		<section class={canAuthor ? 'lg:col-span-2' : 'lg:col-span-3'}>
			<div class="flex items-baseline justify-between gap-3">
				<h2 class="text-lg font-semibold">Keep going</h2>
				<a
					class="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
					href={resolve('/courses')}
				>
					Browse the catalogue
				</a>
			</div>

			{#if continueWith.length === 0}
				<div class="mt-5">
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
				<ul class="mt-5 space-y-3">
					{#each continueWith as enrolment (enrolment.course_slug)}
						{@const progress = enrolment.progress}
						<li>
							<Card class="lift p-5">
								<div class="flex items-start justify-between gap-4">
									<div class="flex min-w-0 items-start gap-3">
										<span
											class="flex size-10 shrink-0 items-center justify-center rounded-card bg-accent-surface text-accent-text"
										>
											<Icon icon={BookOpen01Icon} class="size-5" />
										</span>
										<div class="min-w-0">
											<a
												class="font-medium underline-offset-4 hover:underline"
												href={resolve(`/courses/${enrolment.course_slug}`)}
											>
												{enrolment.course_title}
											</a>
											<p class="numeral mt-0.5 text-xs text-muted">
												{progress?.lessons_completed ?? 0} of {progress?.lessons_total ?? 0} lessons
											</p>
										</div>
									</div>

									<Button
										href={resolve(`/courses/${enrolment.course_slug}`)}
										variant="secondary"
										size="sm"
									>
										Resume
										<Icon icon={ArrowRight01Icon} class="size-4" />
									</Button>
								</div>

								<div class="mt-4 flex items-center gap-3">
									<Progress
										value={progress?.lessons_completed ?? 0}
										max={progress?.lessons_total ?? 1}
										label="{progress?.percent ?? 0}% of {enrolment.course_title} complete"
									/>
									<span class="numeral shrink-0 text-xs text-muted">{progress?.percent ?? 0}%</span>
								</div>
							</Card>
						</li>
					{/each}
				</ul>
			{/if}

			{#if finished.length > 0}
				<div class="mt-12 flex items-baseline justify-between gap-3">
					<h2 class="text-lg font-semibold">Finished</h2>
					<!-- Finishing a course issues a certificate; this is where they collect. -->
					<a
						class="text-muted text-sm underline-offset-4 hover:text-text hover:underline"
						href={resolve('/certificates')}
					>
						Your certificates
					</a>
				</div>
				<ul class="mt-5 space-y-2">
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
		</section>

		<!-- ---------------------------------------------------------- you teach -->
		{#if canAuthor}
			<section>
				<div class="flex items-baseline justify-between gap-3">
					<h2 class="text-lg font-semibold">Recently taught</h2>
					<a
						class="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
						href={resolve('/teach')}
					>
						All courses
					</a>
				</div>

				{#if data.teaching.length === 0}
					<div class="mt-5">
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
					<ul class="mt-5 space-y-2">
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

										<!-- Draft and live differ by icon and word, never by colour alone. -->
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

					<Button href={resolve('/teach')} variant="secondary" size="sm" class="mt-5 w-full">
						<Icon icon={PlusSignIcon} class="size-4" />
						New course
					</Button>
				{/if}
			</section>
		{/if}
	</div>
</Page>
