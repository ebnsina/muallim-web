<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { BookOpen01Icon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Card,
		EmptyState,
		Field,
		Input,
		Page,
		PageHeader,
		Select,
		TintCard
	} from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);

	const DIFFICULTIES = [
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
		{ value: 'expert', label: 'Expert' }
	];
</script>

<svelte:head><title>Teach — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader title="Your courses" description="Drafts are visible only to you.">
		{#snippet actions()}
			<Button href={resolve('/teach/grading')} variant="secondary" size="sm">Grading scales</Button>
			<Button href={resolve('/teach/certificates')} variant="secondary" size="sm">
				Certificates
			</Button>
		{/snippet}
	</PageHeader>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{/if}

	<section class="mt-8 max-w-2xl">
		<h2 class="sr-only">New course</h2>

		<Card class="p-5">
			<form
				method="POST"
				action="?/create"
				class="space-y-5"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<Field id="title" label="Title">
					{#snippet children({ id, invalid })}
						<Input {id} {invalid} name="title" required value={form?.title ?? ''} />
					{/snippet}
				</Field>

				<Field id="summary" label="Summary">
					{#snippet children({ id, invalid })}
						<Input {id} {invalid} name="summary" value={form?.summary ?? ''} />
					{/snippet}
				</Field>

				<!--
					No `class` on the Select. It styles itself, and handing the control its
					own border, height, and padding back is a second implementation of the
					same control — one that drifts the first time either of them changes.
				-->
				<Field id="difficulty" label="Difficulty">
					{#snippet children({ id, invalid })}
						<Select {id} {invalid} name="difficulty">
							{#each DIFFICULTIES as difficulty (difficulty.value)}
								<option value={difficulty.value}>{difficulty.label}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Button type="submit" loading={submitting}>
					{submitting ? 'Creating…' : 'Create course'}
				</Button>
			</form>
		</Card>
	</section>

	{#if data.courses.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={BookOpen01Icon}
				title="No courses yet"
				description="Create one above. It stays a draft until you publish it."
			/>
		</div>
	{:else}
		<ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.courses as course, index (course.id)}
				<li class="contents">
					<!--
						The same tinted shell as the catalogue, filled with what an author needs
						instead: the draft/live state, and the one action that changes it. Not a
						whole-card link — a publish button cannot live inside an anchor — so the
						title carries the link and the footer carries the button.
					-->
					<TintCard title={course.title} {index}>
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
