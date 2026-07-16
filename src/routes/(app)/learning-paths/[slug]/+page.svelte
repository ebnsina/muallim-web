<script lang="ts">
	import { resolve } from '$app/paths';
	import { Route02Icon } from '@hugeicons/core-free-icons';
	import { Breadcrumbs, Card, EmptyState, Page, PageHeader, Progress } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const crumbs = $derived([
		{ label: 'Learning paths', href: resolve('/learning-paths') },
		{ label: data.path.title }
	]);
</script>

<svelte:head><title>{data.path.title} — Muallim</title></svelte:head>

<Page>
	<Breadcrumbs {crumbs} class="mb-6" />

	<PageHeader title={data.path.title} description={data.path.description} />

	{#if data.courses.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Route02Icon}
				title="No courses on this path yet"
				description="When courses are added to this path, they appear here in the order to take them."
			/>
		</div>
	{:else}
		<Card surface="sunken" class="mt-8 flex flex-col gap-3">
			<div class="flex items-baseline justify-between gap-4">
				<p class="font-medium">Your progress</p>
				<p class="text-muted text-sm">{data.overallPercent}% through the whole path</p>
			</div>
			<Progress
				value={data.overallPercent}
				label="Your progress through this learning path"
				tone="active"
			/>
		</Card>

		<ol class="mt-8 flex flex-col gap-4">
			{#each data.courses as course, index (course.id)}
				<li class="contents">
					<Card float class="flex flex-col gap-3">
						<div class="flex items-baseline gap-3">
							<span class="text-muted text-sm tabular-nums">{index + 1}</span>

							<h2 class="min-w-0 flex-1 font-medium text-pretty">
								{#if course.slug}
									<a
										href={resolve(`/courses/${course.slug}`)}
										class="rounded-control underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
									>
										{course.title}
									</a>
								{:else}
									<!-- A course this reader cannot open still holds its place: dropping the
									     row would renumber every course after it. -->
									<span class="text-muted">This course is not available to you</span>
								{/if}
							</h2>

							<span class="text-muted shrink-0 text-sm tabular-nums">{course.percent}%</span>
						</div>

						<Progress
							value={course.percent}
							label={course.title ? `Your progress in ${course.title}` : 'Your progress'}
							tone="active"
						/>

						<p class="text-muted text-sm">
							{course.lessonsCompleted} of {course.lessonsTotal}
							{course.lessonsTotal === 1 ? 'lesson' : 'lessons'} finished
						</p>
					</Card>
				</li>
			{/each}
		</ol>
	{/if}
</Page>
