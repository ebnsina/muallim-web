<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Alert02Icon,
		Clock01Icon,
		SquareLock01Icon,
		Tick02Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		Difficulty,
		Icon,
		LessonIcon,
		Page,
		PageHeader,
		Progress
	} from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const enrolled = $derived(data.progress !== null);

	const crumbs = $derived([
		{ label: 'Courses', href: resolve('/courses') },
		{ label: data.course.title }
	]);

	/*
		Minutes, as a number. The unit is rendered beside it, not inside it.

		`.numeral` swaps in Geist Mono, and it belongs on digits: a whole phrase in it
		sets "17 min" and "5 lessons" in a monospace face, which is a typographic
		choice nobody made on purpose.
	*/
	function minutes(seconds: number): number {
		return Math.round(seconds / 60);
	}

	const openPrerequisites = $derived(data.prerequisites.filter((p) => !p.done));

	const dripNotice: Record<string, string> = {
		scheduled: 'Lessons in this course open on their own dates.',
		after_enrolment: 'Lessons open a few days apart, counted from the day you enrol.',
		sequential: 'Lessons open one at a time, as you finish the one before.'
	};

	/**
	 * When a lesson opens, for this reader, or an empty string when it is already
	 * open — or when nobody can say.
	 *
	 * Sequential drip is deliberately absent: only lms-api knows which lesson comes
	 * next, and guessing here would put a padlock on a lesson the server will hand
	 * over. A preview is never dripped.
	 */
	function opensOn(lesson: {
		is_preview: boolean;
		available_at?: string;
		available_after_days?: number;
	}): string {
		if (!enrolled || lesson.is_preview) return '';

		let when: Date | null = null;
		if (data.course.drip_mode === 'scheduled' && lesson.available_at) {
			when = new Date(lesson.available_at);
		} else if (
			data.course.drip_mode === 'after_enrolment' &&
			lesson.available_after_days != null &&
			data.enrolledAt
		) {
			// Constructed, not mutated, and by calendar day rather than by adding
			// milliseconds: lms-api uses AddDate, and a span crossing a daylight-saving
			// boundary is 23 or 25 hours long, not 24.
			const from = new Date(data.enrolledAt);
			when = new Date(
				from.getFullYear(),
				from.getMonth(),
				from.getDate() + lesson.available_after_days,
				from.getHours(),
				from.getMinutes(),
				from.getSeconds()
			);
		}

		if (!when || when.getTime() <= Date.now()) return '';
		return when.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head><title>{data.course.title} — Muallim</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<!--
		The syllabus reads first and widest; the panel that asks you to enrol sits
		beside it and follows you down. On one column the panel comes first, because
		on a phone the fold lands above the first section heading.
	-->
	<div class="mt-6 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-14">
		<div class="order-2 lg:order-1">
			{#if data.course.status !== 'published'}
				<Badge tone="warning" class="mb-3">{data.course.status}</Badge>
			{/if}

			<PageHeader title={data.course.title} description={data.course.summary}>
				{#snippet meta()}
					<span class="text-muted flex items-center gap-1.5">
						<span class="numeral">{data.lessonCount}</span>
						{data.lessonCount === 1 ? 'lesson' : 'lessons'}
					</span>

					{#if data.durationSeconds}
						<span class="text-muted flex items-center gap-1.5">
							<Icon icon={Clock01Icon} class="size-3.5" />
							<span class="numeral">{minutes(data.durationSeconds)}</span> min
						</span>
					{/if}

					<Difficulty level={data.course.difficulty} />
				{/snippet}
			</PageHeader>

			{#if form?.message}
				<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
			{/if}

			{#if data.course.drip_mode !== 'none' && dripNotice[data.course.drip_mode]}
				<p class="text-muted mt-6 flex items-start gap-2 text-sm">
					<Icon icon={Alert02Icon} class="mt-0.5 size-3.5 shrink-0" />
					{dripNotice[data.course.drip_mode]}
				</p>
			{/if}

			<!-- ------------------------------------------------------- curriculum -->
			<section class="mt-12">
				<h2 class="text-sm font-medium tracking-wide uppercase">Syllabus</h2>

				{#if data.topics.length === 0}
					<p class="text-muted mt-4 text-sm">This course has no lessons yet.</p>
				{:else}
					<ol class="mt-4 space-y-4">
						{#each data.topics as topic, section (topic.id)}
							<li class="overflow-hidden rounded-card border border-border">
								<div
									class="flex items-baseline gap-3 border-b border-border bg-surface-sunken px-5 py-3.5"
								>
									<span class="text-muted numeral text-xs">
										{String(section + 1).padStart(2, '0')}
									</span>
									<h3 class="font-medium">{topic.title}</h3>
									<span class="text-muted ml-auto shrink-0 text-xs">
										<span class="numeral">{(topic.lessons ?? []).length}</span>
										{(topic.lessons ?? []).length === 1 ? 'lesson' : 'lessons'}
									</span>
								</div>

								<ul class="divide-y divide-border">
									{#each topic.lessons ?? [] as lesson (lesson.id)}
										{@const locked = opensOn(lesson)}
										<li>
											<!--
												Every lesson is linked. Whether its body is readable is decided
												by lms-api from the reader's entitlement, and a lesson they may
												not open answers 404 — so hiding the link would only make the
												course look emptier than it is.
											-->
											<a
												href={resolve(`/courses/${data.course.slug}/lessons/${lesson.id}`)}
												class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
											>
												<span class="text-muted shrink-0">
													{#if locked}
														<Icon icon={SquareLock01Icon} class="size-4" />
													{:else}
														<LessonIcon contentType={lesson.content_type} />
													{/if}
												</span>

												<span class="min-w-0 flex-1 truncate text-sm">{lesson.title}</span>

												<span class="flex shrink-0 items-center gap-2">
													{#if lesson.is_preview && !enrolled}
														<Badge tone="accent">Preview</Badge>
													{/if}

													{#if locked}
														<span class="text-muted text-xs">Opens {locked}</span>
													{:else if lesson.duration_seconds}
														<span class="text-muted text-xs">
															<span class="numeral">{minutes(lesson.duration_seconds)}</span> min
														</span>
													{/if}
												</span>
											</a>
										</li>
									{/each}
								</ul>
							</li>
						{/each}
					</ol>
				{/if}
			</section>
		</div>

		<!-- ------------------------------------------------------------- panel -->
		<div class="order-1 lg:order-2">
			<div class="lg:sticky lg:top-24">
				<Card elevation="raised" class="p-6">
					{#if enrolled}
						<!-- A bar is a picture of a number. The number goes next to it. -->
						<div class="flex items-baseline justify-between">
							<p class="text-sm font-medium">Your progress</p>
							<p class="text-sm font-medium">
								<span class="numeral">{data.progress?.percent ?? 0}</span>%
							</p>
						</div>

						<div class="mt-3">
							<Progress value={data.progress?.percent ?? 0} label="Course progress" />
						</div>

						<!--
							Plain digits, not `Numeral`. It renders a column of spans plus an
							sr-only copy, so the sentence stops being one run of text — a reader
							copying it gets "00 of 11 lessons", and nothing can assert on it. The
							rolling animation is for a number that changes; this one is loaded once.
						-->
						<p class="text-muted mt-2 text-sm">
							<span class="numeral">{data.progress?.lessons_completed ?? 0}</span>
							of
							<span class="numeral">{data.progress?.lessons_total ?? 0}</span> lessons
						</p>

						{#if data.progress?.percent === 100}
							<p class="mt-4 flex items-center gap-2 text-sm text-success-text">
								<Icon icon={Tick02Icon} class="size-4" />
								You have finished this course.
							</p>

							<!--
								Finishing a course issues a certificate. The link goes to the
								learner's list rather than guessing the serial, which is the API's
								to mint.
							-->
							<Button href={resolve('/certificates')} class="mt-5 w-full">
								View your certificate
							</Button>
						{/if}

						<Button
							href={resolve(`/courses/${data.course.slug}/grades`)}
							variant="secondary"
							size="sm"
							class="mt-3 w-full"
						>
							See your grades
						</Button>

						<form method="POST" action="?/cancel" use:enhance class="mt-3">
							<Button type="submit" variant="ghost" size="sm" class="w-full">
								Cancel enrolment
							</Button>
						</form>
					{:else if !data.signedIn}
						<p class="font-medium">Ready to start?</p>
						<p class="text-muted mt-1 text-sm">
							Sign in to enrol and keep track of what you have finished.
						</p>

						<Button
							href={`${resolve('/login')}?next=${encodeURIComponent(data.next)}`}
							class="mt-5 w-full"
						>
							Sign in to enrol
						</Button>
					{:else if openPrerequisites.length > 0}
						<h2 class="font-medium">Before you enrol</h2>

						<!--
							Every prerequisite, with its state — not only the unfinished ones. A
							learner halfway through a chain wants to see the half they have done.
						-->
						<ul class="mt-3 space-y-2">
							{#each data.prerequisites as prerequisite (prerequisite.slug)}
								<li class="text-sm">
									<a
										class="underline underline-offset-4"
										href={resolve(`/courses/${prerequisite.slug}`)}
									>
										{prerequisite.title}
									</a>
									<span class="text-muted block text-xs">
										{prerequisite.done ? 'finished' : 'not finished yet'}
									</span>
								</li>
							{/each}
						</ul>

						<!--
							Disabled because lms-api will refuse. It refuses either way — a
							disabled button is a courtesy, not the control — and the list above
							names what to do about it.
						-->
						<Button disabled class="mt-5 w-full">Enrol</Button>
					{:else}
						<p class="font-medium">Ready to start?</p>
						<p class="text-muted mt-1 text-sm">
							Enrol to open every lesson and track what you have finished.
						</p>

						<form method="POST" action="?/enrol" use:enhance class="mt-5">
							<Button type="submit" class="w-full">Enrol</Button>
						</form>
					{/if}

					{#if data.prerequisites.length > 0 && openPrerequisites.length === 0}
						<div class="mt-6 border-t border-border pt-5">
							<p class="text-muted text-xs">Prerequisites, all finished:</p>
							<ul class="mt-2 space-y-1">
								{#each data.prerequisites as prerequisite (prerequisite.slug)}
									<li class="flex items-center gap-1.5 text-xs text-success-text">
										<Icon icon={Tick02Icon} class="size-3.5" />
										{prerequisite.title}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</Card>
			</div>
		</div>
	</div>
</Page>
