<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Button, Input, Label, Select } from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Teach — Muallim</title></svelte:head>

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-2xl font-semibold">Your courses</h1>
	<p class="text-muted mt-2 text-sm">Drafts are visible only to you.</p>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{/if}

	<section class="mt-8">
		<h2 class="sr-only">New course</h2>

		<form
			method="POST"
			action="?/create"
			class="space-y-4 rounded-card border p-4"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<div class="space-y-2">
				<Label for="title">Title</Label>
				<Input id="title" name="title" required value={form?.title ?? ''} />
			</div>

			<div class="space-y-2">
				<Label for="summary">Summary</Label>
				<Input id="summary" name="summary" value={form?.summary ?? ''} />
			</div>

			<div class="space-y-2">
				<Label for="difficulty">Difficulty</Label>
				<Select
					id="difficulty"
					name="difficulty"
					class="border-border-control bg-surface-raised h-9 w-full rounded-control border px-3 text-sm"
				>
					<option value="beginner">Beginner</option>
					<option value="intermediate">Intermediate</option>
					<option value="advanced">Advanced</option>
					<option value="expert">Expert</option>
				</Select>
			</div>

			<Button type="submit" disabled={submitting}>
				{submitting ? 'Creating…' : 'Create course'}
			</Button>
		</form>
	</section>

	{#if data.courses.length === 0}
		<p class="text-muted mt-10 text-sm">You have not created any courses yet.</p>
	{:else}
		<ul class="mt-10 space-y-3">
			{#each data.courses as course (course.id)}
				<li class="flex flex-wrap items-center justify-between gap-3 rounded-card border p-4">
					<div>
						<a
							class="font-medium underline-offset-4 hover:underline"
							href={resolve(`/teach/${course.slug}`)}
						>
							{course.title}
						</a>
						<p class="text-muted mt-1 text-xs uppercase">{course.status}</p>
					</div>

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
				</li>
			{/each}
		</ul>

		{#if data.nextCursor}
			<div class="mt-8">
				<Button
					variant="secondary"
					href={`${resolve('/teach')}?cursor=${encodeURIComponent(data.nextCursor)}`}
				>
					Load more
				</Button>
			</div>
		{/if}
	{/if}
</main>
