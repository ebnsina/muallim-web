<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { CancelCircleIcon, CheckmarkCircle02Icon, Clock01Icon } from '@hugeicons/core-free-icons';
	import { Alert, Badge, Breadcrumbs, Card, Numeral, Page, PageHeader } from '$lib/components';
	import { lessonTitle, lessonTrail } from '$lib/breadcrumbs';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const crumbs = $derived(
		lessonTrail(
			data.slug,
			data.course.title,
			data.lessonId,
			lessonTitle(data.topics, data.lessonId),
			{ label: 'Quiz', href: resolve(`/courses/${data.slug}/lessons/${data.lessonId}/quiz`) },
			{ label: `Attempt ${data.attempt.number}` }
		)
	);

	const grading = $derived(data.attempt.status === 'grading');

	/**
	 * Grading happens in a background job, so the result is not ready when the
	 * browser arrives. Ask again until it is.
	 *
	 * A poll rather than a stream: this is one page, waiting one second, on a job
	 * that takes milliseconds. An SSE endpoint would be a connection, a heartbeat
	 * and a reconnection policy for the same answer.
	 *
	 * The effect re-runs whenever `data` changes, so reaching a settled status stops
	 * the timer by not setting a new one. Its teardown clears the pending one, which
	 * is what keeps a navigated-away page from asking forever.
	 */
	$effect(() => {
		if (!grading) return;

		const timer = setTimeout(() => invalidateAll(), 1000);
		return () => clearTimeout(timer);
	});

	// Null while a person still has to mark something — the badge says "waiting"
	// rather than guessing a pass that has not been decided.
	const passed = $derived(data.attempt.status === 'graded' ? data.attempt.passed : null);
</script>

<svelte:head><title>Attempt {data.attempt.number} — Quiz</title></svelte:head>

<Page>
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title="Attempt {data.attempt.number}" />

	{#if grading}
		<!--
			`role="status"` so a screen reader is told when this becomes a score, rather
			than leaving the reader to discover it.
		-->
		<p class="text-muted mt-4" role="status" aria-live="polite">
			Grading… this page will show your score when it is ready.
		</p>
	{:else}
		<!--
			The score rolls up, and it is the only figure here that does. Its readable copy
			is the settled number from the first frame, so the live region announces the
			result once rather than narrating the roll.
		-->
		<div class="mt-4 flex flex-wrap items-center gap-3" role="status" aria-live="polite">
			<!--
				Plain numerals, not a rolling column. A Numeral keeps all ten digits of every
				place in the DOM and hides them from assistive tech — which is right for a
				headline figure and wrong here: this line is a sentence, "3 of 5 · 60%", and
				a sentence has to survive being read, selected, and searched for as text.
			-->
			<p class="numeral flex items-center gap-1.5 text-lg">
				<span class="font-semibold">{data.attempt.points}</span>
				<span class="text-muted">of</span>
				<span>{data.attempt.max_points}</span>
				<span class="text-muted ml-1">· {data.attempt.percent}%</span>
			</p>

			{#if passed === null}
				<Badge tone="neutral" icon={Clock01Icon}>Waiting to be marked</Badge>
			{:else if passed}
				<Badge tone="success" icon={CheckmarkCircle02Icon}>Passed</Badge>
			{:else}
				<Badge tone="danger" icon={CancelCircleIcon}>Not passed</Badge>
			{/if}
		</div>
	{/if}

	{#if data.attempt.status === 'awaiting_review'}
		<Alert class="mt-6">
			One or more of your answers needs a person. Your score will settle once an instructor has
			marked them.
		</Alert>
	{/if}

	{#if !grading}
		<ol class="mt-8 space-y-3">
			{#each data.items as item, index (item.question_id)}
				<li>
					<Card float class="p-5">
						<div class="flex items-start justify-between gap-4">
							<p class="font-medium text-pretty">
								{index + 1}. {item.prompt}
							</p>

							{#if !item.graded}
								<Badge tone="neutral" icon={Clock01Icon}>Not marked</Badge>
							{:else if item.correct}
								<Badge tone="success" icon={CheckmarkCircle02Icon}>Correct</Badge>
							{:else if item.points > 0}
								<Badge tone="warning">Partly right</Badge>
							{:else}
								<Badge tone="danger" icon={CancelCircleIcon}>Not right</Badge>
							{/if}
						</div>

						<p class="text-muted numeral mt-1 text-xs">
							{item.points} of {item.max_points} points
						</p>

						{#if item.response.text}
							<p class="mt-3 text-sm whitespace-pre-wrap">
								<span class="text-muted">You wrote:</span>
								{item.response.text}
							</p>
						{/if}

						{#if item.feedback}
							<div
								class="mt-3 rounded-control border border-accent-border bg-accent-surface px-3 py-2 text-sm"
							>
								<span class="text-accent-text font-medium">Your instructor:</span>
								{item.feedback}
							</div>
						{/if}

						<!--
							The author's note, released only once the attempt is graded. It never
							names the correct answer — a quiz that allows another attempt would
							otherwise hand out the key with the first result.
						-->
						{#if item.explanation}
							<p class="text-muted mt-3 text-sm">{item.explanation}</p>
						{/if}
					</Card>
				</li>
			{/each}
		</ol>
	{/if}
</Page>
