<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon, BookOpen01Icon } from '@hugeicons/core-free-icons';
	import { Button, Difficulty, EmptyState, Icon } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Courses — Muallim</title></svelte:head>

<main class="mx-auto max-w-6xl px-6 py-12">
	<header class="max-w-2xl">
		<h1 class="text-3xl font-semibold tracking-tight">Courses</h1>
		<p class="text-muted mt-2 text-pretty">
			Everything published in this workspace. Open one to read its syllabus before you enrol.
		</p>
	</header>

	{#if data.courses.length === 0}
		<!-- Empty is a state, not an oversight. -->
		<div class="mt-10">
			<EmptyState
				icon={BookOpen01Icon}
				title="No courses yet"
				description="When a course is published, it appears here."
			/>
		</div>
	{:else}
		<!--
			Every course here is published. lms-api's listing filters on status in SQL
			and takes no reader into account, so an author does not find their own
			drafts here either — there is no "my courses" endpoint behind this page.
		-->
		<ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.courses as course (course.id)}
				<li class="contents">
					<!--
						The whole card is the link, not the title inside it. A card whose
						clickable area is one line of text is a card people click and miss.
						`group` is what lets the arrow answer a hover anywhere on it.
					-->
					<a
						href={resolve(`/courses/${course.slug}`)}
						class="group flex flex-col rounded-card border border-border bg-surface-raised p-5 transition-colors hover:border-border-strong hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<h2 class="font-medium text-pretty">{course.title}</h2>

						{#if course.summary}
							<!--
								Two lines, then an ellipsis. A summary that decides the card's height
								turns a grid into a row of ragged boxes.
							-->
							<p class="text-muted mt-1.5 line-clamp-2 text-sm text-pretty">{course.summary}</p>
						{/if}

						<div class="mt-5 flex items-center justify-between gap-3 pt-1">
							<Difficulty level={course.difficulty} />

							<span
								class="text-muted flex items-center gap-1 text-xs transition-transform group-hover:translate-x-0.5 group-hover:text-text"
							>
								Open
								<Icon icon={ArrowRight01Icon} class="size-3.5" />
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		{#if data.nextCursor}
			<!--
				A link, not a button: the next page is a URL, so it survives a reload and
				works with JavaScript off.
			-->
			<div class="mt-10 flex justify-center">
				<Button
					variant="secondary"
					href={`${resolve('/courses')}?cursor=${encodeURIComponent(data.nextCursor)}`}
				>
					Load more
				</Button>
			</div>
		{/if}
	{/if}
</main>
