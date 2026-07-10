<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Alert, Breadcrumbs, Page, PageHeader } from '$lib/components';
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

	const outcome = $derived.by(() => {
		switch (data.attempt.status) {
			case 'grading':
				return 'Grading…';
			case 'awaiting_review':
				return 'Waiting to be marked';
			default:
				return data.attempt.passed ? 'Passed' : 'Not passed';
		}
	});
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
		<p class="text-muted mt-2" role="status" aria-live="polite">
			Grading… this page will show your score when it is ready.
		</p>
	{:else}
		<p class="mt-2 text-lg" role="status" aria-live="polite">
			<span class="font-semibold">{data.attempt.points} of {data.attempt.max_points}</span>
			<span class="text-muted">· {data.attempt.percent}% · {outcome}</span>
		</p>
	{/if}

	{#if data.attempt.status === 'awaiting_review'}
		<Alert class="mt-6">
			One or more of your answers needs a person. Your score will settle once an instructor has
			marked them.
		</Alert>
	{/if}

	{#if !grading}
		<ol class="mt-10 space-y-8">
			{#each data.items as item, index (item.question_id)}
				<li>
					<p class="font-medium">
						{index + 1}. {item.prompt}
						<span class="text-muted text-sm font-normal">
							({item.points} of {item.max_points})
						</span>
					</p>

					<p class="mt-1 text-sm">
						{#if !item.graded}
							<span class="text-muted">Not marked yet.</span>
						{:else if item.correct}
							<span class="text-success-text">Correct.</span>
						{:else}
							<span class="text-danger-text">
								{item.points > 0 ? 'Partly right.' : 'Not right.'}
							</span>
						{/if}
					</p>

					{#if item.response.text}
						<p class="text-muted mt-2 text-sm whitespace-pre-wrap">
							You wrote: {item.response.text}
						</p>
					{/if}

					{#if item.feedback}
						<p class="mt-2 rounded-control border px-3 py-2 text-sm">
							<span class="font-medium">Your instructor:</span>
							{item.feedback}
						</p>
					{/if}

					<!--
						The author's note, released only once the attempt is graded. It never
						names the correct answer — a quiz that allows another attempt would
						otherwise hand out the key with the first result.
					-->
					{#if item.explanation}
						<p class="text-muted mt-2 text-sm">{item.explanation}</p>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
</Page>
