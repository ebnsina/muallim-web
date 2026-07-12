<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		BookOpen01Icon,
		CheckmarkCircle02Icon,
		PencilEdit02Icon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import {
		ActionLink,
		Alert,
		Button,
		CourseCard,
		EmptyState,
		Icon,
		Page,
		PageHeader
	} from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Teach — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader title="Your courses" description="Drafts are visible only to you.">
		{#snippet actions()}
			<Button href={resolve('/teach/grading')} variant="secondary" size="sm">Grading scales</Button>
			<Button href={resolve('/teach/certificates')} variant="secondary" size="sm">
				Certificates
			</Button>
			<Button href={resolve('/teach/new')} size="sm">
				<Icon icon={PlusSignIcon} class="size-4" />
				New course
			</Button>
		{/snippet}
	</PageHeader>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{/if}

	{#if data.courses.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={BookOpen01Icon}
				title="No courses yet"
				description="Create your first course. It stays a draft until you publish it."
			>
				{#snippet action()}
					<Button href={resolve('/teach/new')} size="sm">
						<Icon icon={PlusSignIcon} class="size-4" />
						New course
					</Button>
				{/snippet}
			</EmptyState>
		</div>
	{:else}
		<ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.courses as course (course.id)}
				<li class="contents">
					<!--
						The catalogue's card, and the same one on purpose: an author looking at their
						own shelf should see what a learner sees, plus the two things a learner has no
						business with — whether it is live, and the button that changes that. It was a
						different card with a different shape, which made the same course look like
						two things depending on which page you were on.
					-->
					<CourseCard
						title={course.title}
						summary={course.summary}
						difficulty={course.difficulty}
						lessonCount={course.lesson_count}
						ratingAverage={course.rating_average}
						ratingCount={course.rating_count}
						learnerCount={course.learner_count}
						status={course.status}
						seed={course.slug}
						href={resolve(`/teach/${course.slug}`)}
					>
						{#snippet actions()}
							<ActionLink href={resolve(`/teach/${course.slug}`)} tone="muted">Edit</ActionLink>

							<form
								method="POST"
								action={course.status === 'published' ? '?/unpublish' : '?/publish'}
								use:enhance
							>
								<input type="hidden" name="slug" value={course.slug} />
								<Button type="submit" variant="secondary" size="sm">
									<Icon
										icon={course.status === 'published' ? PencilEdit02Icon : CheckmarkCircle02Icon}
										class="size-4"
									/>
									{course.status === 'published' ? 'Unpublish' : 'Publish'}
								</Button>
							</form>
						{/snippet}
					</CourseCard>
				</li>
			{/each}
		</ul>

		{#if data.nextCursor}
			<div class="mt-8 flex justify-center">
				<Button
					variant="secondary"
					href={`${resolve('/teach')}?cursor=${encodeURIComponent(data.nextCursor)}`}
				>
					Load more
				</Button>
			</div>
		{/if}
	{/if}
</Page>
