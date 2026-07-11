<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowRight01Icon,
		CancelCircleIcon,
		CheckmarkCircle02Icon,
		Clock01Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		Checkbox,
		Icon,
		Input,
		Label,
		Page,
		PageHeader,
		Radio,
		Select,
		Textarea
	} from '$lib/components';
	import { lessonTitle, lessonTrail } from '$lib/breadcrumbs';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const crumbs = $derived(
		lessonTrail(
			data.slug,
			data.course.title,
			data.lessonId,
			lessonTitle(data.topics, data.lessonId),
			{
				label: 'Quiz'
			}
		)
	);

	let submitting = $state(false);

	const questions = $derived(data.quiz.questions ?? []);

	const finished = $derived(data.attempts.filter((a) => a.status !== 'in_progress'));
	const remaining = $derived(
		data.quiz.max_attempts === 0 ? null : data.quiz.max_attempts - data.attempts.length
	);

	function minutes(seconds: number): string {
		const whole = Math.round(seconds / 60);
		return whole === 1 ? '1 minute' : `${whole} minutes`;
	}
</script>

<svelte:head><title>{data.quiz.title} — Quiz</title></svelte:head>

<Page>
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title={data.quiz.title} description={data.quiz.description} />

	<p class="text-muted mt-2 text-sm">
		{questions.length} questions · {data.quiz.total_points} points
		{#if data.quiz.passing_percent > 0}
			· pass at {data.quiz.passing_percent}%
		{/if}
		{#if data.quiz.time_limit_seconds > 0}
			· {minutes(data.quiz.time_limit_seconds)}
		{/if}
		{#if remaining !== null}
			· {remaining} of {data.quiz.max_attempts} attempts left
		{/if}
	</p>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{/if}

	{#if form?.saved}
		<Alert class="mt-6" role="status">Saved. Your answers are kept until you submit.</Alert>
	{/if}

	{#if finished.length > 0}
		<section class="mt-8">
			<h2 class="text-sm font-medium tracking-wide uppercase">Your attempts</h2>
			<ul class="mt-3 space-y-2">
				{#each finished as attempt (attempt.number)}
					<li>
						<a
							class="lift focus-visible:ring-ring flex items-center justify-between gap-3 rounded-card border border-border bg-surface-raised px-4 py-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
							href={resolve(
								`/courses/${data.slug}/lessons/${data.lessonId}/quiz/${attempt.number}`
							)}
						>
							<span class="flex items-center gap-3">
								<span class="text-sm font-medium">Attempt {attempt.number}</span>
								{#if attempt.status === 'grading'}
									<Badge tone="neutral" icon={Clock01Icon}>Grading</Badge>
								{:else if attempt.status === 'awaiting_review'}
									<Badge tone="warning" icon={Clock01Icon}>Waiting to be marked</Badge>
								{:else if attempt.passed}
									<Badge tone="success" icon={CheckmarkCircle02Icon}>Passed</Badge>
								{:else}
									<Badge tone="danger" icon={CancelCircleIcon}>Not passed</Badge>
								{/if}
							</span>

							<span class="flex items-center gap-3">
								{#if attempt.status !== 'grading' && attempt.status !== 'awaiting_review'}
									<span class="text-muted numeral text-sm">
										{attempt.points} of {attempt.max_points}
									</span>
								{/if}
								<Icon icon={ArrowRight01Icon} class="text-muted size-4" />
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if !data.signedIn}
		<Alert class="mt-8">
			<a class="underline" href={resolve('/login')}>Sign in</a> and enrol to take this quiz.
		</Alert>
	{:else if !data.open}
		<form method="POST" action="?/start" class="mt-8" use:enhance>
			<Button type="submit">
				{data.attempts.length === 0 ? 'Start the quiz' : 'Try again'}
			</Button>
		</form>
	{:else}
		<!--
			One form for the whole quiz. Field names carry the question they belong to,
			because a browser hands the server a flat list of names, and `$lib/quiz`
			reads them back into one answer per question.
		-->
		<form
			method="POST"
			action="?/submit"
			class="mt-8 space-y-10"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			{#each questions as question, index (question.id)}
				{@const id = question.id}
				<Card class="p-5 sm:p-6">
					<fieldset class="space-y-3">
						<input type="hidden" name={`q:${id}:type`} value={question.type} />

						<legend class="font-medium text-pretty">
							{index + 1}. {question.prompt}
							<span class="text-muted text-sm font-normal">
								({question.points}
								{question.points === 1 ? 'point' : 'points'})
							</span>
						</legend>

						{#if question.type === 'true_false' || question.type === 'single_choice'}
							{#each question.options ?? [] as option (option.id)}
								<div class="flex items-center gap-2">
									<Radio id={option.id} name={`q:${id}:choice`} value={option.id} />
									<Label for={option.id}>{option.content}</Label>
								</div>
							{/each}
						{:else if question.type === 'multiple_choice'}
							<p class="text-muted text-xs">Choose every correct answer.</p>
							{#each question.options ?? [] as option (option.id)}
								<div class="flex items-center gap-2">
									<Checkbox id={option.id} name={`q:${id}:choices`} value={option.id} />
									<Label for={option.id}>{option.content}</Label>
								</div>
							{/each}
						{:else if question.type === 'short_answer'}
							<Input name={`q:${id}:text`} aria-label={question.prompt} />
						{:else if question.type === 'open_ended'}
							<Textarea name={`q:${id}:text`} rows={6} aria-label={question.prompt} />
							<p class="text-muted text-xs">An instructor marks this one.</p>
						{:else if question.type === 'fill_blanks'}
							{#each Array.from({ length: question.blanks ?? 0 }, (_, at) => at) as blank (blank)}
								<div class="flex items-center gap-2">
									<Label for={`${id}-blank-${blank}`}>Blank {blank + 1}</Label>
									<Input id={`${id}-blank-${blank}`} name={`q:${id}:blank:${blank}`} />
								</div>
							{/each}
						{:else if question.type === 'ordering'}
							<p class="text-muted text-xs">Number these from 1.</p>
							{#each question.options ?? [] as option (option.id)}
								<div class="flex items-center gap-2">
									<Input
										id={option.id}
										name={`q:${id}:rank:${option.id}`}
										type="number"
										min="1"
										max={(question.options ?? []).length}
										class="w-20"
									/>
									<Label for={option.id}>{option.content}</Label>
								</div>
							{/each}
						{:else if question.type === 'matching'}
							{#each question.options ?? [] as option (option.id)}
								<div class="flex items-center gap-2">
									<Label for={option.id} class="w-40">{option.content}</Label>
									<Select id={option.id} name={`q:${id}:pair:${option.id}`}>
										<option value="">—</option>
										{#each question.matches ?? [] as match (match.id)}
											<option value={match.id}>{match.content}</option>
										{/each}
									</Select>
								</div>
							{/each}
						{:else if question.type === 'range'}
							<Input
								name={`q:${id}:number`}
								type="number"
								step="any"
								class="w-40"
								aria-label={question.prompt}
								placeholder="A number"
							/>
						{:else}
							<p class="text-muted text-sm">
								This question needs a newer version of this app. Submitting will leave it blank.
							</p>
						{/if}
					</fieldset>
				</Card>
			{/each}

			<div class="flex gap-3">
				<Button type="submit" name="intent" value="submit" disabled={submitting}>
					{submitting ? 'Submitting…' : 'Submit for grading'}
				</Button>
				<Button type="submit" name="intent" value="save" variant="secondary" disabled={submitting}>
					Save and finish later
				</Button>
			</div>
		</form>
	{/if}
</Page>
