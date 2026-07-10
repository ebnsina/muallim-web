<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Badge, Button, Card, Field, FileList, Input, Textarea } from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const assignment = $derived(data.assignment);
	const submission = $derived(data.submission);
	const remarking = $derived(submission.status === 'graded');

	const dateFormat = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	// The box starts empty on a first marking. Pre-filling it with 0, or with the
	// full points, is a number a marker did not choose that they might not notice.
	// Read off `data` once on purpose: this is the box's initial contents, not a
	// mirror of the server's answer. Deriving it would throw away what a marker had
	// typed the moment anything else on the page invalidated.
	// svelte-ignore state_referenced_locally
	let points = $state<number | ''>(data.submission.points ?? '');

	const passes = $derived(typeof points === 'number' && points >= assignment.passing_points);
</script>

<svelte:head><title>Marking — {assignment.title}</title></svelte:head>

<main class="mx-auto max-w-2xl px-6 py-16">
	<p class="text-muted text-sm">
		<a
			class="underline"
			href={resolve(`/teach/${data.slug}/lessons/${data.lessonId}/assignment/submissions`)}
		>
			Back to the queue
		</a>
	</p>

	<div class="mt-2 flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">{assignment.title}</h1>
		{#if submission.late}<Badge tone="warning">Late</Badge>{/if}
		{#if remarking}<Badge tone="success">Marked</Badge>{/if}
	</div>

	<p class="text-muted mt-1 text-sm">
		{#if submission.submitted_at}
			Handed in {dateFormat.format(new Date(submission.submitted_at))}
		{/if}
	</p>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	{#if form?.url}
		<Alert class="mt-6" role="status">
			<a class="underline" href={form.url} rel="noreferrer">Your download is ready.</a>
			It expires in five minutes.
		</Alert>
	{/if}

	{#if assignment.instructions}
		<Card class="mt-8 p-6">
			<h2 class="text-sm font-medium">What was asked for</h2>
			<p class="text-muted mt-2 text-sm whitespace-pre-wrap">{assignment.instructions}</p>
		</Card>
	{/if}

	<h2 class="mt-10 text-sm font-medium">What was handed in</h2>
	<div class="mt-3"><FileList files={submission.files ?? []} /></div>

	<!--
		Re-marking is allowed: a marker who mistyped a grade should not have to ask a
		learner to hand in again. lms-api records it in the same transaction as the
		lesson completion, so a corrected fail reopens the lesson it had closed.
	-->
	<form method="POST" action="?/mark" use:enhance class="mt-10 space-y-6">
		<Field
			id="points"
			label="Grade"
			hint="Out of {assignment.points}. {assignment.passing_points} passes and completes the lesson."
		>
			{#snippet children({ id, describedBy, invalid })}
				<div class="flex items-center gap-3">
					<Input
						{id}
						{invalid}
						name="points"
						type="number"
						min={0}
						max={assignment.points}
						required
						class="numeral w-32"
						aria-describedby={describedBy}
						bind:value={points}
					/>
					<span class="text-muted numeral text-sm">of {assignment.points}</span>

					{#if points !== ''}
						<Badge tone={passes ? 'success' : 'danger'}>{passes ? 'Passes' : 'Does not pass'}</Badge
						>
					{/if}
				</div>
			{/snippet}
		</Field>

		<Field id="feedback" label="Feedback" hint="The learner reads this next to their grade.">
			{#snippet children({ id, describedBy, invalid })}
				<Textarea
					{id}
					{invalid}
					name="feedback"
					rows={6}
					maxlength={8000}
					aria-describedby={describedBy}
					value={submission.feedback ?? ''}
				/>
			{/snippet}
		</Field>

		<Button type="submit">{remarking ? 'Change the grade' : 'Record grade'}</Button>
	</form>
</main>
