<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

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

<main class="mx-auto min-h-dvh max-w-2xl px-6 py-16">
	<p class="text-muted-foreground text-sm">
		<a class="underline" href={resolve(`/courses/${data.slug}/lessons/${data.lessonId}/quiz`)}>
			Back to the quiz
		</a>
	</p>

	<h1 class="mt-2 text-2xl font-semibold">Attempt {data.attempt.number}</h1>

	{#if grading}
		<!--
			`role="status"` so a screen reader is told when this becomes a score, rather
			than leaving the reader to discover it.
		-->
		<p class="text-muted-foreground mt-2" role="status" aria-live="polite">
			Grading… this page will show your score when it is ready.
		</p>
	{:else}
		<p class="mt-2 text-lg" role="status" aria-live="polite">
			<span class="font-semibold">{data.attempt.points} of {data.attempt.max_points}</span>
			<span class="text-muted-foreground">· {data.attempt.percent}% · {outcome}</span>
		</p>
	{/if}

	{#if data.attempt.status === 'awaiting_review'}
		<Alert class="mt-6">
			<AlertDescription>
				One or more of your answers needs a person. Your score will settle once an instructor has
				marked them.
			</AlertDescription>
		</Alert>
	{/if}

	{#if !grading}
		<ol class="mt-10 space-y-8">
			{#each data.items as item, index (item.question_id)}
				<li>
					<p class="font-medium">
						{index + 1}. {item.prompt}
						<span class="text-muted-foreground text-sm font-normal">
							({item.points} of {item.max_points})
						</span>
					</p>

					<p class="mt-1 text-sm">
						{#if !item.graded}
							<span class="text-muted-foreground">Not marked yet.</span>
						{:else if item.correct}
							<span class="text-green-700 dark:text-green-500">Correct.</span>
						{:else}
							<span class="text-red-700 dark:text-red-500">
								{item.points > 0 ? 'Partly right.' : 'Not right.'}
							</span>
						{/if}
					</p>

					{#if item.response.text}
						<p class="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
							You wrote: {item.response.text}
						</p>
					{/if}

					{#if item.feedback}
						<p class="mt-2 rounded-md border px-3 py-2 text-sm">
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
						<p class="text-muted-foreground mt-2 text-sm">{item.explanation}</p>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
</main>
