<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Cancel01Icon, Delete02Icon, FloppyDiskIcon } from '@hugeicons/core-free-icons';
	import {
		ActionLink,
		Alert,
		Breadcrumbs,
		Button,
		Checkbox,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Select,
		Textarea
	} from '$lib/components';
	import { lessonTitle, teachTrail } from '$lib/breadcrumbs';
	import { formatBytes } from '$lib/upload';
	import { LIMITS, assignmentSchema } from '$lib/schemas';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

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

<Page>
	<Breadcrumbs {crumbs} />

	<PageHeader
		class="mt-4"
		title={exists ? 'Edit the assignment' : 'Add an assignment'}
		description="Learners upload files and hand them in. You mark what arrives."
	/>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{:else if form?.saved}
		<Alert tone="success" class="mt-6" role="status">Saved.</Alert>
	{/if}

	<form
		method="POST"
		action="?/save"
		use:enhance={validated(assignmentSchema, (next) => (errors = next))}
		class="mt-8 space-y-6"
	>
		<input type="hidden" name="exists" value={String(exists)} />

		<Field id="title" label="Title" error={problem('title')}>
			{#snippet children({ id, describedBy, invalid })}
				<Input
					{id}
					{invalid}
					name="title"
					{...LIMITS.assignmentTitle}
					aria-describedby={describedBy}
					value={assignment?.title ?? ''}
					placeholder="Essay: the House of Wisdom"
				/>
			{/snippet}
		</Field>

		<Field
			id="instructions"
			label="Instructions"
			error={problem('instructions')}
			hint="What to do, and what to hand in. Learners see this above the upload box."
		>
			{#snippet children({ id, describedBy, invalid })}
				<Textarea
					{id}
					{invalid}
					name="instructions"
					rows={8}
					{...LIMITS.assignmentInstructions}
					aria-describedby={describedBy}
					value={assignment?.instructions ?? ''}
				/>
			{/snippet}
		</Field>

		<div class="grid gap-6 sm:grid-cols-2">
			<Field id="points" label="Points" error={problem('points')}>
				{#snippet children({ id, describedBy, invalid })}
					<Input
						{id}
						{invalid}
						name="points"
						{...LIMITS.assignmentPoints}
						class="numeral"
						aria-describedby={describedBy}
						value={assignment?.points ?? 100}
					/>
				{/snippet}
			</Field>

			<!--
				The pass mark completes the lesson. A submission marked at or above it
				closes the lesson in the same transaction that recorded the grade.
			-->
			<Field
				id="passing_points"
				label="Pass mark"
				error={problem('passing_points')}
				hint="Reaching it completes the lesson."
			>
				{#snippet children({ id, describedBy, invalid })}
					<Input
						{id}
						{invalid}
						name="passing_points"
						{...LIMITS.assignmentPoints}
						class="numeral"
						aria-describedby={describedBy}
						value={assignment?.passing_points ?? 50}
					/>
				{/snippet}
			</Field>

			<Field id="max_files" label="Files allowed" error={problem('max_files')}>
				{#snippet children({ id, describedBy, invalid })}
					<Input
						{id}
						{invalid}
						name="max_files"
						{...LIMITS.assignmentFiles}
						class="numeral"
						aria-describedby={describedBy}
						value={assignment?.max_files ?? 3}
					/>
				{/snippet}
			</Field>

			<Field id="max_bytes" label="Largest file" error={problem('max_bytes')}>
				{#snippet children({ id, describedBy, invalid })}
					<Select
						{id}
						{invalid}
						name="max_bytes"
						aria-describedby={describedBy}
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
		<Field
			id="due_at"
			label="Deadline"
			error={problem('due_at')}
			hint="Leave it empty for no deadline."
		>
			{#snippet children({ id, describedBy, invalid })}
				<Input
					{id}
					{invalid}
					name="due_at"
					{...LIMITS.deadline}
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

		<div class="flex flex-wrap items-center justify-end gap-4 pt-2">
			{#if exists}
				<!-- A link out of the form, not a second button beside the submit: the queue is
				     somewhere else, and only the arrow says so. -->
				<ActionLink
					href={resolve(`/teach/${data.slug}/lessons/${data.lessonId}/assignment/submissions`)}
				>
					Marking queue
				</ActionLink>
			{/if}

			<Button type="submit">
				<Icon icon={FloppyDiskIcon} class="size-4" />
				{exists ? 'Save changes' : 'Add assignment'}
			</Button>
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
						<Button variant="ghost" onclick={() => (confirming = false)}>
							<Icon icon={Cancel01Icon} class="size-4" />
							Keep it
						</Button>
						<Button type="submit" variant="danger">
							<Icon icon={Delete02Icon} class="size-4" />
							Delete it and every submission
						</Button>
					</form>
				{:else}
					<Button variant="secondary" onclick={() => (confirming = true)}>
						<Icon icon={Delete02Icon} class="size-4" />
						Remove assignment
					</Button>
				{/if}
			</div>
		</section>
	{/if}
</Page>
