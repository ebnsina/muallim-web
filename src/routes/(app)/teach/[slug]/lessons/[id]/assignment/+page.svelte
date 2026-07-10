<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Alert,
		Breadcrumbs,
		Button,
		Checkbox,
		Field,
		Input,
		Select,
		Textarea
	} from '$lib/components';
	import { lessonTitle, teachTrail } from '$lib/breadcrumbs';
	import { formatBytes } from '$lib/upload';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const crumbs = $derived(
		teachTrail(
			data.slug,
			data.course.title,
			data.lessonId,
			lessonTitle(data.topics, data.lessonId),
			{
				label: 'Assignment'
			}
		)
	);

	const assignment = $derived(data.assignment);
	const exists = $derived(assignment !== null);

	/*
		Not a free number. A limit is a promise about what the object store will
		accept, and an author picking 37 MB is choosing a number nobody meant.
	*/
	const SIZES = [5, 10, 25, 100, 250].map((mb) => ({
		value: mb * 1024 * 1024,
		label: formatBytes(mb * 1024 * 1024)
	}));

	let confirming = $state(false);
</script>

<svelte:head><title>{exists ? 'Edit assignment' : 'New assignment'} — Muallim</title></svelte:head>

<main class="mx-auto max-w-2xl px-6 py-16">
	<Breadcrumbs {crumbs} />

	<h1 class="mt-2 text-2xl font-semibold">
		{exists ? 'Edit the assignment' : 'Add an assignment'}
	</h1>

	<p class="text-muted mt-1 text-sm">
		Learners upload files and hand them in. You mark what arrives.
	</p>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{:else if form?.saved}
		<Alert tone="success" class="mt-6" role="status">Saved.</Alert>
	{/if}

	<form method="POST" action="?/save" use:enhance class="mt-8 space-y-6">
		<input type="hidden" name="exists" value={String(exists)} />

		<Field id="title" label="Title">
			{#snippet children({ id, invalid })}
				<Input
					{id}
					{invalid}
					name="title"
					required
					maxlength={200}
					value={assignment?.title ?? ''}
					placeholder="Essay: the House of Wisdom"
				/>
			{/snippet}
		</Field>

		<Field
			id="instructions"
			label="Instructions"
			hint="What to do, and what to hand in. Learners see this above the upload box."
		>
			{#snippet children({ id, describedBy, invalid })}
				<Textarea
					{id}
					{invalid}
					name="instructions"
					rows={8}
					maxlength={8000}
					aria-describedby={describedBy}
					value={assignment?.instructions ?? ''}
				/>
			{/snippet}
		</Field>

		<div class="grid gap-6 sm:grid-cols-2">
			<Field id="points" label="Points">
				{#snippet children({ id, invalid })}
					<Input
						{id}
						{invalid}
						name="points"
						type="number"
						min={0}
						max={1000}
						required
						class="numeral"
						value={assignment?.points ?? 100}
					/>
				{/snippet}
			</Field>

			<!--
				The pass mark completes the lesson. A submission marked at or above it
				closes the lesson in the same transaction that recorded the grade.
			-->
			<Field id="passing_points" label="Pass mark" hint="Reaching it completes the lesson.">
				{#snippet children({ id, describedBy, invalid })}
					<Input
						{id}
						{invalid}
						name="passing_points"
						type="number"
						min={0}
						max={1000}
						required
						class="numeral"
						aria-describedby={describedBy}
						value={assignment?.passing_points ?? 50}
					/>
				{/snippet}
			</Field>

			<Field id="max_files" label="Files allowed">
				{#snippet children({ id, invalid })}
					<Input
						{id}
						{invalid}
						name="max_files"
						type="number"
						min={1}
						max={20}
						required
						class="numeral"
						value={assignment?.max_files ?? 3}
					/>
				{/snippet}
			</Field>

			<Field id="max_bytes" label="Largest file">
				{#snippet children({ id, invalid })}
					<Select
						{id}
						{invalid}
						name="max_bytes"
						value={String(assignment?.max_bytes ?? SIZES[2].value)}
					>
						{#each SIZES as size (size.value)}
							<option value={size.value}>{size.label}</option>
						{/each}
					</Select>
				{/snippet}
			</Field>
		</div>

		<!--
			`datetime-local` has no time zone, so it is read and written in the author's
			own. The API stores an instant; whoever looks at it next sees it in theirs.
		-->
		<Field id="due_at" label="Deadline" hint="Leave it empty for no deadline.">
			{#snippet children({ id, describedBy, invalid })}
				<Input
					{id}
					{invalid}
					name="due_at"
					type="datetime-local"
					aria-describedby={describedBy}
					value={data.dueLocal}
				/>
			{/snippet}
		</Field>

		<div class="flex items-start gap-3">
			<Checkbox id="allow_late" name="allow_late" checked={assignment?.allow_late ?? true} />
			<label for="allow_late" class="text-sm">
				Accept late work
				<span class="text-muted mt-0.5 block text-xs">
					Handed in after the deadline, and flagged as late. Unticked, the deadline closes it.
				</span>
			</label>
		</div>

		<div class="flex flex-wrap items-center gap-4 pt-2">
			<Button type="submit">{exists ? 'Save changes' : 'Add assignment'}</Button>

			{#if exists}
				<Button
					variant="ghost"
					href={resolve(`/teach/${data.slug}/lessons/${data.lessonId}/assignment/submissions`)}
				>
					Marking queue
				</Button>
			{/if}
		</div>
	</form>

	{#if exists}
		<!--
			Deleting takes every learner's submission and every file with it. Two clicks,
			the second of them named after what it does — a native `confirm()` blocks the
			page and cannot be styled, read out, or tested.
		-->
		<section class="mt-16 rounded-card border border-danger-border p-6">
			<h2 class="text-sm font-medium">Remove this assignment</h2>
			<p class="text-muted mt-1 text-sm">
				Every submission, grade, and uploaded file goes with it. This cannot be undone.
			</p>

			<div class="mt-4">
				{#if confirming}
					<form method="POST" action="?/delete" use:enhance class="flex items-center gap-3">
						<Button type="submit" variant="danger">Delete it and every submission</Button>
						<Button variant="ghost" onclick={() => (confirming = false)}>Keep it</Button>
					</form>
				{:else}
					<Button variant="secondary" onclick={() => (confirming = true)}>Remove assignment</Button>
				{/if}
			</div>
		</section>
	{/if}
</main>
