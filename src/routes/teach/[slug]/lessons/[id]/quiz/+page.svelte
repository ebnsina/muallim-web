<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const TYPES = [
		'true_false',
		'single_choice',
		'multiple_choice',
		'fill_blanks',
		'short_answer',
		'ordering',
		'matching',
		'open_ended'
	];

	let type = $state('single_choice');

	// The option rows the author is composing. Reset after a successful add, which
	// is when `data.questions` grows.
	let rows = $state([
		{ content: '', match: '' },
		{ content: '', match: '' }
	]);

	const chooses = $derived(!['open_ended', 'short_answer', 'fill_blanks'].includes(type));
	const typed = $derived(type === 'short_answer' || type === 'fill_blanks');
	const matches = $derived(type === 'matching');

	// An ordering question's answer is the order the rows are in. Marking one
	// "correct" would set an answer the grader never reads, and lms-api refuses it.
	const marksCorrect = $derived(chooses && type !== 'ordering');

	const selectClass = 'border-input bg-background h-9 w-full rounded-md border px-3 text-sm';

	function typeLabel(t: string): string {
		return t.replaceAll('_', ' ');
	}
</script>

<svelte:head><title>{data.lessonTitle} — Quiz</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-3xl px-6 py-16">
	<p class="text-muted-foreground text-sm">
		<a class="underline" href={resolve(`/teach/${data.slug}/lessons/${data.lessonId}`)}>
			Back to the lesson
		</a>
	</p>

	<h1 class="mt-2 text-2xl font-semibold">Quiz — {data.lessonTitle}</h1>

	{#if form?.message}
		<Alert variant="destructive" class="mt-6" role="alert">
			<AlertDescription>{form.message}</AlertDescription>
		</Alert>
	{/if}

	{#if !data.quiz}
		<form method="POST" action="?/create" class="mt-8 space-y-4" use:enhance>
			<p class="text-muted-foreground text-sm">This lesson has no quiz yet.</p>
			<div class="space-y-2">
				<Label for="title">Title</Label>
				<Input id="title" name="title" required />
			</div>
			<Button type="submit">Create the quiz</Button>
		</form>
	{:else}
		<div class="mt-8 flex gap-4 text-sm">
			<a
				class="underline"
				href={resolve(`/teach/${data.slug}/lessons/${data.lessonId}/quiz/submissions`)}
			>
				Marking queue
			</a>
		</div>

		<section class="mt-8">
			<h2 class="text-lg font-medium">Settings</h2>

			<form method="POST" action="?/settings" class="mt-4 space-y-4" use:enhance>
				<div class="space-y-2">
					<Label for="title">Title</Label>
					<Input id="title" name="title" value={data.quiz.title} required />
				</div>

				<div class="space-y-2">
					<Label for="description">Description</Label>
					<textarea
						id="description"
						name="description"
						rows="2"
						class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
						>{data.quiz.description ?? ''}</textarea
					>
				</div>

				<div class="grid gap-4 sm:grid-cols-3">
					<div class="space-y-2">
						<Label for="passing_percent">Pass mark (%)</Label>
						<Input
							id="passing_percent"
							name="passing_percent"
							type="number"
							min="0"
							max="100"
							value={data.quiz.passing_percent}
						/>
					</div>
					<div class="space-y-2">
						<Label for="time_limit_seconds">Time limit (seconds)</Label>
						<Input
							id="time_limit_seconds"
							name="time_limit_seconds"
							type="number"
							min="0"
							value={data.quiz.time_limit_seconds}
							aria-describedby="time-hint"
						/>
						<p id="time-hint" class="text-muted-foreground text-xs">Zero means no limit.</p>
					</div>
					<div class="space-y-2">
						<Label for="max_attempts">Attempts</Label>
						<Input
							id="max_attempts"
							name="max_attempts"
							type="number"
							min="0"
							value={data.quiz.max_attempts}
							aria-describedby="attempts-hint"
						/>
						<p id="attempts-hint" class="text-muted-foreground text-xs">Zero means unlimited.</p>
					</div>
				</div>

				<Button type="submit">Save settings</Button>
			</form>
		</section>

		<section class="mt-12">
			<h2 class="text-lg font-medium">Questions</h2>

			{#if data.questions.length === 0}
				<p class="text-muted-foreground mt-2 text-sm">
					None yet. A quiz with no questions cannot be attempted.
				</p>
			{:else}
				<ol class="mt-4 space-y-3">
					{#each data.questions as question, index (question.id)}
						<li class="rounded-md border px-4 py-3">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="font-medium">{index + 1}. {question.prompt}</p>
									<p class="text-muted-foreground mt-1 text-xs">
										{typeLabel(question.type)} · {question.points}
										{question.points === 1 ? 'point' : 'points'}
									</p>

									{#if question.options?.length}
										<ul class="mt-2 space-y-0.5 text-sm">
											{#each question.options as option (option.id)}
												<li>
													{option.content}
													{#if option.is_correct}
														<span class="text-green-700 dark:text-green-500">— correct</span>
													{/if}
													{#if option.match_content}
														<span class="text-muted-foreground">→ {option.match_content}</span>
													{/if}
												</li>
											{/each}
										</ul>
									{/if}

									{#if question.accepted?.length}
										<p class="text-muted-foreground mt-2 text-sm">
											Accepts: {question.accepted
												.map((blank) => (blank ?? []).join(' or '))
												.join(' · ')}
										</p>
									{/if}
								</div>

								<form method="POST" action="?/deleteQuestion" use:enhance>
									<input type="hidden" name="question_id" value={question.id} />
									<Button type="submit" variant="outline" size="sm">Remove</Button>
								</form>
							</div>
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		<section class="mt-12">
			<h2 class="text-lg font-medium">Add a question</h2>

			<form
				method="POST"
				action="?/addQuestion"
				class="mt-4 space-y-4"
				use:enhance={() =>
					async ({ update, result }) => {
						await update({ reset: true });
						if (result.type === 'success') {
							rows = [
								{ content: '', match: '' },
								{ content: '', match: '' }
							];
						}
					}}
			>
				<div class="space-y-2">
					<Label for="type">Type</Label>
					<select id="type" name="type" bind:value={type} class={selectClass}>
						{#each TYPES as option (option)}
							<option value={option}>{typeLabel(option)}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="prompt">Prompt</Label>
					<textarea
						id="prompt"
						name="prompt"
						rows="2"
						required
						class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
					></textarea>
				</div>

				<div class="space-y-2">
					<Label for="points">Points</Label>
					<Input id="points" name="points" type="number" min="0" value="1" class="w-32" />
				</div>

				{#if chooses}
					<fieldset class="space-y-2">
						<legend class="text-sm font-medium">
							{#if matches}
								Pairs
							{:else if type === 'ordering'}
								Items, in the right order
							{:else}
								Options
							{/if}
						</legend>

						{#each rows as row, index (index)}
							<div class="flex items-center gap-2">
								{#if marksCorrect}
									<input
										type="checkbox"
										name="option_correct"
										value={index}
										class="size-4"
										aria-label={`Option ${index + 1} is correct`}
									/>
								{/if}

								<Input
									name="option_content"
									bind:value={row.content}
									placeholder={matches ? 'Left' : `Option ${index + 1}`}
									aria-label={`Option ${index + 1}`}
								/>

								{#if matches}
									<Input
										name="option_match"
										bind:value={row.match}
										placeholder="Right"
										aria-label={`Match ${index + 1}`}
									/>
								{:else}
									<!-- Kept so the three arrays stay the same length, row for row. -->
									<input type="hidden" name="option_match" value="" />
								{/if}
							</div>
						{/each}

						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => (rows = [...rows, { content: '', match: '' }])}
						>
							Add an option
						</Button>
					</fieldset>
				{/if}

				{#if typed}
					<div class="space-y-2">
						<Label for="accepted">Accepted answers</Label>
						<textarea
							id="accepted"
							name="accepted"
							rows="3"
							placeholder="4 | four&#10;Paris"
							aria-describedby="accepted-hint"
							class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
						></textarea>
						<p id="accepted-hint" class="text-muted-foreground text-xs">
							One line per blank; alternatives separated by <code>|</code>. A short answer has
							exactly one blank.
						</p>
					</div>

					<div class="flex items-center gap-2">
						<input id="case_sensitive" name="case_sensitive" type="checkbox" class="size-4" />
						<Label for="case_sensitive">Case must match</Label>
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="explanation">Explanation</Label>
					<textarea
						id="explanation"
						name="explanation"
						rows="2"
						aria-describedby="explanation-hint"
						class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
					></textarea>
					<p id="explanation-hint" class="text-muted-foreground text-xs">
						Shown to the learner once their attempt is graded, never before.
					</p>
				</div>

				<Button type="submit">Add the question</Button>
			</form>
		</section>

		<section class="mt-16 border-t pt-6">
			<form method="POST" action="?/deleteQuiz" use:enhance>
				<Button type="submit" variant="outline" size="sm">Remove the quiz</Button>
				<p class="text-muted-foreground mt-2 text-xs">
					Deletes every question, and every attempt at it.
				</p>
			</form>
		</section>
	{/if}
</main>
