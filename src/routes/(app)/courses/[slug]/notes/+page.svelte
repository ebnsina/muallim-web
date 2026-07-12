<script lang="ts">
	import { resolve } from '$app/paths';
	import { PencilEdit02Icon } from '@hugeicons/core-free-icons';
	import {
		ActionLink,
		Breadcrumbs,
		Button,
		Card,
		EmptyState,
		Page,
		PageHeader
	} from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const crumbs = $derived([
		{ label: 'Courses', href: resolve('/courses') },
		{ label: data.course.title, href: resolve(`/courses/${data.course.slug}`) },
		{ label: 'Your notes' }
	]);

	// Notes and marks keyed by lesson, so each lesson gathers its own.
	const noteByLesson = $derived(new Map(data.notes.map((note) => [note.lesson_id, note.body])));
	const highlightsByLesson = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a lookup built inside this derived, never reactive state
		const map = new Map<string, typeof data.highlights>();
		for (const highlight of data.highlights) {
			const list = map.get(highlight.lesson_id);
			if (list) list.push(highlight);
			else map.set(highlight.lesson_id, [highlight]);
		}
		return map;
	});

	// Every lesson that has anything kept against it, in curriculum order — the
	// order a learner would revise in, not the order they happened to mark things.
	const lessons = $derived(
		data.topics
			.flatMap((topic) => topic.lessons ?? [])
			.map((lesson) => ({
				...lesson,
				note: noteByLesson.get(lesson.id) ?? '',
				highlights: highlightsByLesson.get(lesson.id) ?? []
			}))
			.filter((lesson) => lesson.note || lesson.highlights.length > 0)
	);

	const total = $derived(data.notes.length + data.highlights.length);
</script>

<svelte:head><title>Your notes — {data.course.title}</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<PageHeader
		class="mt-4"
		title="Your notes"
		description="Everything you have kept in {data.course
			.title}, gathered for revision. Private to you."
	>
		{#snippet meta()}
			{#if total > 0}
				<span class="text-muted">
					<span class="numeral">{data.notes.length}</span>
					{data.notes.length === 1 ? 'note' : 'notes'} ·
					<span class="numeral">{data.highlights.length}</span>
					{data.highlights.length === 1 ? 'highlight' : 'highlights'}
				</span>
			{/if}
		{/snippet}
	</PageHeader>

	{#if lessons.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={PencilEdit02Icon}
				title="Nothing kept yet"
				description="Open a lesson, jot a note or highlight a passage, and it gathers here."
			>
				{#snippet action()}
					<Button href={resolve(`/courses/${data.course.slug}`)} size="sm"
						>Back to the course</Button
					>
				{/snippet}
			</EmptyState>
		</div>
	{:else}
		<div class="mt-8 space-y-6">
			{#each lessons as lesson (lesson.id)}
				<Card float class="p-5 sm:p-6">
					<!-- The lesson this was kept against, and the way back into it. -->
					<ActionLink
						href={resolve(`/courses/${data.course.slug}/lessons/${lesson.id}`)}
						class="font-semibold"
					>
						{lesson.title}
					</ActionLink>

					{#if lesson.note}
						<p class="mt-4 text-sm whitespace-pre-wrap">{lesson.note}</p>
					{/if}

					{#if lesson.highlights.length > 0}
						<ul class="mt-4 space-y-3">
							{#each lesson.highlights as highlight (highlight.id)}
								<li class="border-l-2 border-warning-border pl-3">
									<blockquote class="text-sm text-pretty text-muted italic">
										{highlight.quote}
									</blockquote>
									{#if highlight.note}
										<p class="mt-1 text-sm">{highlight.note}</p>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}
</Page>
