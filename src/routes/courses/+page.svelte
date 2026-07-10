<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Courses — LMS</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-2xl px-6 py-16">
	<h1 class="text-2xl font-semibold">Courses</h1>

	{#if data.courses.length === 0}
		<!-- Empty is a state, not an oversight. -->
		<p class="text-muted mt-6 text-sm">No courses have been published yet.</p>
	{:else}
		<ul class="mt-8 space-y-4">
			{#each data.courses as course (course.id)}
				<li class="rounded-card border p-4">
					<!--
						Every course here is published. lms-api's listing filters on status in
						SQL and takes no reader into account, so an author does not find their
						own drafts here either — there is no "my courses" endpoint yet.
					-->
					<h2 class="font-medium">
						<a class="underline-offset-4 hover:underline" href={resolve(`/courses/${course.slug}`)}>
							{course.title}
						</a>
					</h2>

					{#if course.summary}
						<p class="text-muted mt-1 text-sm">{course.summary}</p>
					{/if}
					<p class="text-muted mt-2 text-xs">{course.difficulty}</p>
				</li>
			{/each}
		</ul>

		{#if data.nextCursor}
			<!--
				A link, not a button: the next page is a URL, so it survives a reload and
				works with JavaScript off.
			-->
			<div class="mt-8">
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
