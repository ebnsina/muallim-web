<script lang="ts">
	import { enhance } from '$app/forms';
	import { awardSchema } from '$lib/schemas';
	import { validated, type FieldErrors } from '$lib/validation';
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

	// One marking form per question, so the errors are bagged by question: a bad box
	// marks its own question and no other.
	let errors = $state<Record<string, FieldErrors>>({});
	const problem = (questionId: string, field: string) =>
		errors[questionId]?.[field] ??
		(form?.questionId === questionId ? form?.errors?.[field] : undefined);

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

	// The two kinds muallim-api leaves to a person: an essay and a drawing. Everything
	// else it grades itself and refuses a mark on.
	const byHand = (type: string) => type === 'open_ended' || type === 'draw_image';

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

						{#if !byHand(question.type)}
							{#if answer?.correct}
								<Badge tone="success" icon={CheckmarkCircle02Icon}>Correct</Badge>
							{:else}
								<Badge tone="danger" icon={CancelCircleIcon}>Not right</Badge>
							{/if}
						{/if}
					</div>

					{#if byHand(question.type)}
						{#if question.type === 'draw_image'}
							{@const drawing = data.drawingUrls[question.id]}
							{#if drawing}
								<!--
									The link opens the full size: a drawing is marked by looking closely, and
									the card is not the whole of it.
								-->
								<a
									href={drawing}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-3 block w-fit rounded-control border border-border bg-surface-sunken p-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								>
									<img
										src={drawing}
										alt="The drawing submitted for question {index + 1}"
										class="max-h-96 w-auto rounded-sm"
									/>
								</a>
							{:else}
								<p class="mt-3 rounded-control bg-surface-sunken px-4 py-3 text-sm text-muted">
									{answer?.response?.upload
										? 'This drawing could not be opened. Reload the page to try again.'
										: 'They left this blank.'}
								</p>
							{/if}
						{:else}
							<blockquote
								class="mt-3 rounded-control bg-surface-sunken px-4 py-3 text-sm whitespace-pre-wrap"
							>
								{wrote(answer?.response ?? {}) || 'They left this blank.'}
							</blockquote>
						{/if}

						{#if answer?.graded}
							<p class="mt-3 text-sm">
								Marked {answer.points} of {question.points}.
								{#if answer.feedback}<span class="text-muted">{answer.feedback}</span>{/if}
							</p>
						{:else}
							<form
								method="POST"
								class="mt-4 space-y-3"
								use:enhance={validated(
									awardSchema(question.points),
									(next) => (errors = { ...errors, [question.id]: next })
								)}
							>
								<input type="hidden" name="question_id" value={question.id} />
								<input type="hidden" name="max_points" value={question.points} />

								<Field
									id={`points-${question.id}`}
									label="Points"
									error={problem(question.id, 'points')}
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
