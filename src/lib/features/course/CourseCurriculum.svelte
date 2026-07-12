<script lang="ts">
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import { SquareLock01Icon } from '@hugeicons/core-free-icons';
	import { Badge, Icon, LessonIcon } from '$lib/components';
	import { DURATION, easeOut } from '$lib/motion';
	import { minutes, span } from './duration';
	import type { CourseDetail, LessonView, TopicView } from './types';

	type Props = {
		course: CourseDetail;
		topics: TopicView[];
		lessonCount: number;
		durationSeconds: number;
		enrolled: boolean;
		/** When this reader enrolled, for a course that drips from that day. */
		enrolledAt: string | null;
	};

	let { course, topics, lessonCount, durationSeconds, enrolled, enrolledAt }: Props = $props();

	/*
		Every section starts closed. The first used to start open, which sounds like a
		courtesy and made "Expand all" a liar: the reader's eye is on section one, they
		press the button, and the one thing they are looking at does not move — because
		it was already open. The press worked; it just could not be seen to.

		A syllabus is a list of sections. Opening one is the reader's decision, and the
		button that opens all of them now always does something.
	*/
	let open = $state<Record<string, boolean>>({});
	const allOpen = $derived(topics.length > 0 && topics.every((t) => open[t.id] ?? false));

	function toggleAll() {
		const next = !allOpen;
		open = Object.fromEntries(topics.map((t) => [t.id, next]));
	}

	function isOpen(topicId: string): boolean {
		return open[topicId] ?? false;
	}

	/**
	 * When a lesson opens, for this reader, or an empty string when it is already
	 * open — or when nobody can say.
	 *
	 * Sequential drip is deliberately absent: only muallim-api knows which lesson comes
	 * next, and guessing here would put a padlock on a lesson the server will hand
	 * over. A preview is never dripped.
	 */
	function opensOn(lesson: LessonView): string {
		if (!enrolled || lesson.is_preview) return '';

		let when: Date | null = null;
		if (course.drip_mode === 'scheduled' && lesson.available_at) {
			when = new Date(lesson.available_at);
		} else if (
			course.drip_mode === 'after_enrolment' &&
			lesson.available_after_days != null &&
			enrolledAt
		) {
			// Constructed, not mutated, and by calendar day rather than by adding
			// milliseconds: muallim-api uses AddDate, and a span crossing a daylight-saving
			// boundary is 23 or 25 hours long, not 24.
			const from = new Date(enrolledAt);
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

<section class="mt-12">
	<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
		<h2 class="text-xl font-semibold">Course content</h2>

		{#if topics.length > 0}
			<button
				type="button"
				class="underline-grow text-sm font-medium text-accent-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				onclick={toggleAll}
			>
				{allOpen ? 'Collapse all sections' : 'Expand all sections'}
			</button>
		{/if}
	</div>

	{#if topics.length === 0}
		<p class="text-muted mt-4 text-sm">This course has no lessons yet.</p>
	{:else}
		<p class="text-muted mt-2 text-sm">
			<span class="numeral">{topics.length}</span>
			{topics.length === 1 ? 'section' : 'sections'} •
			<span class="numeral">{lessonCount}</span>
			{lessonCount === 1 ? 'lesson' : 'lessons'}
			{#if durationSeconds}
				• <span class="numeral">{span(durationSeconds)}</span> total length
			{/if}
		</p>

		<ol class="mt-4 space-y-3">
			{#each topics as topic (topic.id)}
				{@const lessons = topic.lessons ?? []}
				{@const seconds = lessons.reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0)}
				<li class="overflow-hidden rounded-card border border-border">
					<!--
						A section is a disclosure, not a link. `<details>` would do it without
						script, but "expand all" has to drive them, and a details element driven
						from outside is a details element fighting you.
					-->
					<h3>
						<button
							type="button"
							class="flex w-full items-center gap-3 bg-surface-raised px-5 py-4 text-left transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
							aria-expanded={isOpen(topic.id)}
							aria-controls="section-{topic.id}"
							onclick={() => (open[topic.id] = !isOpen(topic.id))}
						>
							<svg
								class="text-muted size-4 shrink-0 transition-transform duration-150"
								class:rotate-180={isOpen(topic.id)}
								viewBox="0 0 20 20"
								fill="none"
								stroke="currentColor"
								stroke-width="1.75"
								aria-hidden="true"
							>
								<path d="M5 7.5 10 12.5 15 7.5" stroke-linecap="round" stroke-linejoin="round" />
							</svg>

							<span class="min-w-0 flex-1 font-medium text-pretty">{topic.title}</span>

							<span class="text-muted shrink-0 text-xs">
								<span class="numeral">{lessons.length}</span>
								{lessons.length === 1 ? 'lecture' : 'lectures'}
								{#if seconds > 0}
									• <span class="numeral">{span(seconds)}</span>
								{/if}
							</span>
						</button>
					</h3>

					{#if isOpen(topic.id)}
						<!-- It slides. A section that appears in one frame throws every section
						     under it down the page, and the reader loses the one they were on. -->
						<ul
							id="section-{topic.id}"
							class="divide-y divide-border border-t border-border"
							transition:slide={{ duration: DURATION.base, easing: easeOut }}
						>
							{#each lessons as lesson (lesson.id)}
								{@const locked = opensOn(lesson)}
								<li>
									<!--
										Every lesson is linked. Whether its body is readable is decided by
										muallim-api from the reader's entitlement, and a lesson they may not
										open answers 404 — so hiding the link would only make the course
										look emptier than it is.
									-->
									<a
										href={resolve(`/courses/${course.slug}/lessons/${lesson.id}`)}
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

										<span class="flex shrink-0 items-center gap-3">
											{#if lesson.is_preview && !enrolled}
												<Badge tone="accent">Preview</Badge>
											{/if}

											{#if locked}
												<span class="text-muted text-xs">Opens {locked}</span>
											{:else if lesson.duration_seconds}
												<span class="text-muted numeral text-xs">
													{minutes(lesson.duration_seconds)}:00
												</span>
											{/if}
										</span>
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
</section>
