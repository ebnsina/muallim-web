<script lang="ts">
	import { resolve } from '$app/paths';
	import { BookOpen01Icon } from '@hugeicons/core-free-icons';
	import { Button, CourseCard, EmptyState, Page, PageHeader } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Courses — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader
		title="Courses"
		description="Everything published in this workspace. Open one to read its syllabus before you enrol."
	/>

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
		<ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.courses as course (course.id)}
				<li class="contents">
					<CourseCard
						title={course.title}
						summary={course.summary}
						difficulty={course.difficulty}
						lessonCount={course.lesson_count}
						href={resolve(`/courses/${course.slug}`)}
					/>
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
</Page>
