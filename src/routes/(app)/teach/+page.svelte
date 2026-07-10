<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { BookOpen01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		EmptyState,
		Icon,
		Page,
		PageHeader,
		TintCard
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
		<ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.courses as course (course.id)}
				<li class="contents">
					<!--
						The same tinted shell as the catalogue, tinted by the same difficulty,
						filled with what an author needs instead: the draft/live state, and the
						one action that changes it. Not a whole-card link — a publish button
						cannot live inside an anchor — so the title carries the link and the
						footer carries the button.
					-->
					<TintCard>
						<!--
							A badge, not `text-xs uppercase`. `draft` and `published` are the same
							word in two states, and the tone is what says which.
						-->
						<Badge tone={course.status === 'published' ? 'success' : 'neutral'}>
							{course.status}
						</Badge>

						<h2 class="mt-4 text-lg font-semibold text-pretty">
							<a class="underline-offset-4 hover:underline" href={resolve(`/teach/${course.slug}`)}>
								{course.title}
							</a>
						</h2>

						<p class="text-muted mt-1.5 text-sm">
							<span class="numeral">{course.lesson_count}</span>
							{course.lesson_count === 1 ? 'lesson' : 'lessons'}
						</p>

						{#snippet footer()}
							<a
								class="text-muted text-sm underline-offset-4 hover:text-text hover:underline"
								href={resolve(`/teach/${course.slug}`)}
							>
								Edit
							</a>

							<form
								method="POST"
								action={course.status === 'published' ? '?/unpublish' : '?/publish'}
								use:enhance
							>
								<input type="hidden" name="slug" value={course.slug} />
								<Button type="submit" variant="secondary" size="sm">
									{course.status === 'published' ? 'Unpublish' : 'Publish'}
								</Button>
							</form>
						{/snippet}
					</TintCard>
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
