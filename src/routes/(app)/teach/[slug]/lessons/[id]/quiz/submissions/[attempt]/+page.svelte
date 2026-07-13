<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { CancelCircleIcon, CheckmarkCircle02Icon, Task01Icon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		Field,
		Icon,
		Input,
		Label,
		Page,
		PageHeader,
		Textarea
	} from '$lib/components';
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

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title="Attempt {data.attempt.number}">
		{#snippet meta()}
			<!--
				One run of text, not a Badge per fact. The score and the verdict are read
				as one sentence, and splitting them into pills makes a marker assemble it.
			-->
			<p class="text-muted text-sm">
				{data.attempt.points} of {data.attempt.max_points} · {data.attempt.percent}%
				{#if settled}
					· {data.attempt.passed ? 'passed' : 'not passed'}
				{:else}
					· awaiting review
				{/if}
			</p>
		{/snippet}
	</PageHeader>

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

	<ol class="mt-10 space-y-3">
		{#each data.questions as question, index (question.id)}
			{@const answer = question.answer}
			<li>
				<Card float class="p-5 sm:p-6">
					<div class="flex items-start justify-between gap-4">
						<p class="font-medium text-pretty">
							{index + 1}. {question.prompt}
							<span class="text-muted text-sm font-normal">
								({question.points}
								{question.points === 1 ? 'point' : 'points'})
							</span>
						</p>

						{#if question.type !== 'open_ended'}
							{#if answer?.correct}
								<Badge tone="success" icon={CheckmarkCircle02Icon}>Correct</Badge>
							{:else}
								<Badge tone="danger" icon={CancelCircleIcon}>Not right</Badge>
							{/if}
						{/if}
					</div>

					{#if question.type === 'open_ended'}
						<blockquote
							class="mt-3 rounded-control bg-surface-sunken px-4 py-3 text-sm whitespace-pre-wrap"
						>
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

								<Field
									id={`points-${question.id}`}
									label="Points"
									error={form?.questionId === question.id ? form.pointsMessage : undefined}
								>
									{#snippet children({ id, describedBy, invalid })}
										<Input
											{id}
											{invalid}
											name="points"
											type="number"
											min="0"
											max={question.points}
											required
											class="w-24"
											aria-describedby={describedBy}
										/>
									{/snippet}
								</Field>

								<div class="space-y-2">
									<Label for={`feedback-${question.id}`}>Feedback</Label>
									<Textarea id={`feedback-${question.id}`} name="feedback" rows={3} />
								</div>

								<div class="flex items-center justify-end gap-3">
									<Button type="submit">
										<Icon icon={Task01Icon} class="size-4" />
										Record the mark
									</Button>
								</div>
							</form>
						{/if}
					{:else}
						<!--
							Graded by the machine, and shown only so the marker can see the whole
							attempt. There is no form: muallim-api refuses a mark on a question it
							graded itself.
						-->
						<p class="text-muted mt-2 text-sm">
							{answer?.points ?? 0} of {question.points} · graded automatically
						</p>
					{/if}
				</Card>
			</li>
		{/each}
	</ol>
</Page>
