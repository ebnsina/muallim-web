<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Breadcrumbs, Button, Input, Label, Textarea } from '$lib/components';
	import { lessonTitle, teachTrail } from '$lib/breadcrumbs';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const crumbs = $derived(
		teachTrail(
			data.slug,
			data.course.title,
			data.lessonId,
			lessonTitle(data.topics, data.lessonId),
			{ label: 'Quiz', href: resolve(`/teach/${data.slug}/lessons/${data.lessonId}/quiz`) },
			{
				label: 'Marking',
				href: resolve(`/teach/${data.slug}/lessons/${data.lessonId}/quiz/submissions`)
			},
			{ label: `Attempt ${data.attempt.number}` }
		)
	);

	const settled = $derived(data.attempt.status === 'graded');

	function wrote(response: Record<string, unknown>): string {
		if (typeof response.text === 'string' && response.text !== '') return response.text;
		return '';
	}
</script>

<svelte:head><title>Attempt {data.attempt.number} — Marking</title></svelte:head>

<main class="mx-auto max-w-3xl px-6 py-16">
	<Breadcrumbs {crumbs} />

	<h1 class="mt-4 text-2xl font-semibold">Attempt {data.attempt.number}</h1>

	<p class="text-muted mt-1 text-sm">
		{data.attempt.points} of {data.attempt.max_points} · {data.attempt.percent}%
		{#if settled}
			· {data.attempt.passed ? 'passed' : 'not passed'}
		{:else}
			· awaiting review
		{/if}
	</p>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{/if}

	{#if settled}
		<Alert class="mt-6">
			This attempt is graded. Marking the last answer settled it, and a settled grade cannot be
			changed here.
		</Alert>
	{/if}

	<ol class="mt-10 space-y-10">
		{#each data.questions as question, index (question.id)}
			{@const answer = question.answer}
			<li>
				<p class="font-medium">
					{index + 1}. {question.prompt}
					<span class="text-muted text-sm font-normal">
						({question.points}
						{question.points === 1 ? 'point' : 'points'})
					</span>
				</p>

				{#if question.type === 'open_ended'}
					<blockquote class="mt-3 rounded-control border px-4 py-3 text-sm whitespace-pre-wrap">
						{wrote(answer?.response ?? {}) || 'They left this blank.'}
					</blockquote>

					{#if answer?.graded}
						<p class="mt-3 text-sm">
							Marked {answer.points} of {question.points}.
							{#if answer.feedback}<span class="text-muted">{answer.feedback}</span>{/if}
						</p>
					{:else}
						<form method="POST" class="mt-4 space-y-3" use:enhance>
							<input type="hidden" name="question_id" value={question.id} />

							<div class="flex items-end gap-3">
								<div class="space-y-2">
									<Label for={`points-${question.id}`}>Points</Label>
									<Input
										id={`points-${question.id}`}
										name="points"
										type="number"
										min="0"
										max={question.points}
										required
										class="w-24"
									/>
								</div>
								<Button type="submit">Record the mark</Button>
							</div>

							<div class="space-y-2">
								<Label for={`feedback-${question.id}`}>Feedback</Label>
								<Textarea id={`feedback-${question.id}`} name="feedback" rows={3} />
							</div>
						</form>
					{/if}
				{:else}
					<!--
						Graded by the machine, and shown only so the marker can see the whole
						attempt. There is no form: lms-api refuses a mark on a question it
						graded itself.
					-->
					<p class="mt-2 text-sm">
						{#if answer?.correct}
							<span class="text-success-text">Correct</span>
						{:else}
							<span class="text-danger-text">Not right</span>
						{/if}
						<span class="text-muted">
							· {answer?.points ?? 0} of {question.points} · graded automatically
						</span>
					</p>
				{/if}
			</li>
		{/each}
	</ol>
</main>
