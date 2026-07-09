<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const enrolled = $derived(data.progress !== null);

	function minutes(seconds: number): string {
		if (!seconds) return '';
		return `${Math.round(seconds / 60)} min`;
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
		return when.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
	}
</script>

<svelte:head><title>{data.course.title} — LMS</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-2xl px-6 py-16">
	<p class="text-muted-foreground text-sm">
		<a class="underline" href={resolve('/courses')}>Courses</a>
	</p>

	<h1 class="mt-2 text-2xl font-semibold">{data.course.title}</h1>

	{#if data.course.status !== 'published'}
		<p class="text-muted-foreground mt-1 text-xs uppercase">{data.course.status}</p>
	{/if}

	{#if data.course.summary}
		<p class="text-muted-foreground mt-3 text-pretty">{data.course.summary}</p>
	{/if}

	<p class="text-muted-foreground mt-3 text-sm">
		{data.lessonCount}
		{data.lessonCount === 1 ? 'lesson' : 'lessons'}
		{#if data.durationSeconds}· {minutes(data.durationSeconds)}{/if}
		· {data.course.difficulty}
	</p>

	{#if form?.message}
		<Alert variant="destructive" class="mt-6" role="alert">
			<AlertDescription>{form.message}</AlertDescription>
		</Alert>
	{/if}

	{#if data.prerequisites.length > 0}
		<section class="mt-6">
			<h2 class="text-sm font-medium">Before you enrol</h2>
			<ul class="mt-2 space-y-1 text-sm">
				{#each data.prerequisites as prerequisite (prerequisite.slug)}
					<li class="text-muted-foreground">
						<a
							class="underline-offset-4 hover:underline"
							href={resolve(`/courses/${prerequisite.slug}`)}
						>
							{prerequisite.title}
						</a>
						· {prerequisite.done ? 'finished' : 'not finished yet'}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.course.drip_mode !== 'none' && dripNotice[data.course.drip_mode]}
		<p class="text-muted-foreground mt-4 text-sm">{dripNotice[data.course.drip_mode]}</p>
	{/if}

	<div class="mt-6 flex items-center gap-4">
		{#if !data.signedIn}
			<Button href={`${resolve('/login')}?next=${encodeURIComponent(data.next)}`}>
				Sign in to enrol
			</Button>
		{:else if enrolled}
			<p class="text-sm">
				{data.progress?.lessons_completed} of {data.progress?.lessons_total} lessons ·
				{data.progress?.percent}%
			</p>
			<form method="POST" action="?/cancel" use:enhance>
				<Button type="submit" variant="outline" size="sm">Cancel enrolment</Button>
			</form>
		{:else if openPrerequisites.length > 0}
			<!--
				Disabled because lms-api will refuse. It refuses either way — a disabled
				button is a courtesy, not the control — and the refusal names the courses.
			-->
			<Button disabled>Enrol</Button>
			<p class="text-muted-foreground text-sm">
				Finish {openPrerequisites.map((p) => p.title).join(', ')} first.
			</p>
		{:else}
			<form method="POST" action="?/enrol" use:enhance>
				<Button type="submit">Enrol</Button>
			</form>
		{/if}
	</div>

	{#if data.topics.length === 0}
		<p class="text-muted-foreground mt-10 text-sm">This course has no lessons yet.</p>
	{:else}
		<ol class="mt-10 space-y-8">
			{#each data.topics as topic (topic.id)}
				<li>
					<h2 class="font-medium">{topic.title}</h2>

					<ul class="mt-2 space-y-1">
						{#each topic.lessons ?? [] as lesson (lesson.id)}
							<li class="flex items-baseline justify-between gap-3 text-sm">
								<!--
									Every lesson is linked. Whether its body is readable is decided by
									lms-api from the reader's entitlement, and a lesson the reader may
									not open answers 404 — so hiding the link here would only make the
									course look emptier than it is.
								-->
								<a
									class="underline-offset-4 hover:underline"
									href={resolve(`/courses/${data.course.slug}/lessons/${lesson.id}`)}
								>
									{lesson.title}
								</a>

								<span class="text-muted-foreground shrink-0 text-xs">
									{#if lesson.is_preview && !enrolled}Preview ·
									{/if}
									{#if opensOn(lesson)}Opens {opensOn(lesson)} ·
									{/if}
									{lesson.content_type}
									{#if lesson.duration_seconds}· {minutes(lesson.duration_seconds)}{/if}
								</span>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	{/if}
</main>
