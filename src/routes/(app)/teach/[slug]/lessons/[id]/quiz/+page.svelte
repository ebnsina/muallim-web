<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import {
		Add01Icon,
		Delete02Icon,
		FloppyDiskIcon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import {
		ActionLink,
		Alert,
		Breadcrumbs,
		Button,
		Checkbox,
		Icon,
		Input,
		Label,
		Page,
		PageHeader,
		Select,
		Textarea
	} from '$lib/components';
	import AiQuiz from '$lib/components/AiQuiz.svelte';
	import { teachTrail } from '$lib/breadcrumbs';
	import { DURATION, easeOut } from '$lib/motion';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const crumbs = $derived(
		teachTrail(data.slug, data.course.title, data.lessonId, data.lessonTitle, { label: 'Quiz' })
	);

	const TYPES = [
		'true_false',
		'single_choice',
		'multiple_choice',
		'fill_blanks',
		'short_answer',
		'ordering',
		'matching',
		'open_ended',
		'range',
		'image_answering',
		'image_matching'
	];

	let type = $state('single_choice');

	// The option rows the author is composing. Reset after a successful add, which
	// is when `data.questions` grows.
	let rows = $state([
		{ content: '', match: '' },
		{ content: '', match: '' }
	]);

	const chooses = $derived(!['open_ended', 'short_answer', 'fill_blanks', 'range'].includes(type));
	const typed = $derived(type === 'short_answer' || type === 'fill_blanks');
	const matches = $derived(type === 'matching' || type === 'image_matching');
	const isRange = $derived(type === 'range');
	// Image types carry an image URL where the others carry text.
	const isImage = $derived(type === 'image_answering' || type === 'image_matching');

	// An ordering question's answer is the order the rows are in. Marking one
	// "correct" would set an answer the grader never reads, and muallim-api refuses it.
	const marksCorrect = $derived(chooses && type !== 'ordering');

	function typeLabel(t: string): string {
		return t.replaceAll('_', ' ');
	}
</script>

<svelte:head><title>{data.lessonTitle} — Quiz</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title="Quiz — {data.lessonTitle}" />

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{/if}

	{#if !data.quiz}
		<form method="POST" action="?/create" class="mt-8 space-y-4" use:enhance>
			<p class="text-muted text-sm">This lesson has no quiz yet.</p>
			<div class="space-y-2">
				<Label for="title">Title</Label>
				<Input id="title" name="title" required />
			</div>
			<div class="flex items-center justify-end gap-3">
				<Button type="submit">
					<Icon icon={PlusSignIcon} class="size-4" />
					Create the quiz
				</Button>
			</div>
		</form>
	{:else}
		<div class="mt-8 flex gap-4">
			<ActionLink href={resolve(`/teach/${data.slug}/lessons/${data.lessonId}/quiz/submissions`)}>
				Marking queue
			</ActionLink>
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
					<Textarea
						id="description"
						name="description"
						rows={2}
						value={data.quiz.description ?? ''}
					/>
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
						<p id="time-hint" class="text-muted text-xs">Zero means no limit.</p>
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
						<p id="attempts-hint" class="text-muted text-xs">Zero means unlimited.</p>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3">
					<Button type="submit">
						<Icon icon={FloppyDiskIcon} class="size-4" />
						Save settings
					</Button>
				</div>
			</form>
		</section>

		<section class="mt-12">
			<h2 class="text-lg font-medium">Questions</h2>

			{#if data.questions.length === 0}
				<p class="text-muted mt-2 text-sm">
					None yet. A quiz with no questions cannot be attempted.
				</p>
			{:else}
				<ol class="mt-4 space-y-3">
					{#each data.questions as question, index (question.id)}
						<li class="rounded-control border border-border px-4 py-3">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="font-medium">{index + 1}. {question.prompt}</p>
									<p class="text-muted mt-1 text-xs">
										{typeLabel(question.type)} · {question.points}
										{question.points === 1 ? 'point' : 'points'}
									</p>

									{#if question.options?.length}
										<ul class="mt-2 space-y-0.5 text-sm">
											{#each question.options as option (option.id)}
												<li>
													{option.content}
													{#if option.is_correct}
														<span class="text-success-text">— correct</span>
													{/if}
													{#if option.match_content}
														<span class="text-muted">→ {option.match_content}</span>
													{/if}
												</li>
											{/each}
										</ul>
									{/if}

									{#if question.type === 'range' && question.accepted?.[0]}
										<p class="text-muted mt-2 text-sm">
											Accepts any number from {question.accepted[0][0]} to {question.accepted[0][1]}
										</p>
									{:else if question.accepted?.length}
										<p class="text-muted mt-2 text-sm">
											Accepts: {question.accepted
												.map((blank) => (blank ?? []).join(' or '))
												.join(' · ')}
										</p>
									{/if}
								</div>

								<div class="flex shrink-0 flex-col items-end gap-2">
									<form method="POST" action="?/deleteQuestion" use:enhance>
										<input type="hidden" name="question_id" value={question.id} />
										<Button type="submit" variant="secondary" size="sm">
											<Icon icon={Delete02Icon} class="size-4" />
											Remove
										</Button>
									</form>

									<form
										method="POST"
										action="?/saveToBank"
										class="flex items-center gap-1"
										use:enhance
									>
										<input type="hidden" name="question_id" value={question.id} />
										<Input
											name="category"
											placeholder="Category"
											class="h-8 w-28"
											aria-label="Bank category"
										/>
										<Button type="submit" variant="ghost" size="sm">
											<Icon icon={FloppyDiskIcon} class="size-4" />
											Save to bank
										</Button>
									</form>
								</div>
							</div>
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		<!-- The reusable question bank. -->
		<section class="mt-12">
			<div class="flex flex-wrap items-baseline justify-between gap-3">
				<h2 class="text-lg font-medium">Question bank</h2>
				{#if data.bankCategories.length > 0}
					<form method="GET" class="flex items-center gap-2">
						<Label for="bank-filter" class="text-muted text-xs">Category</Label>
						<Select
							id="bank-filter"
							name="bank"
							value={data.bankFilter}
							class="h-8 w-44"
							onchange={(event) => event.currentTarget.form?.requestSubmit()}
						>
							<option value="">All</option>
							{#each data.bankCategories as category (category)}
								<option value={category}>{category}</option>
							{/each}
						</Select>
					</form>
				{/if}
			</div>

			{#if data.bank.length === 0}
				<p class="text-muted mt-2 text-sm">
					Nothing here yet. Save a question above to reuse it in other quizzes.
				</p>
			{:else}
				<ul class="mt-4 space-y-2">
					{#each data.bank as bankQuestion (bankQuestion.id)}
						<li
							class="flex items-start justify-between gap-4 rounded-control border border-border px-4 py-3"
						>
							<div class="min-w-0">
								<p class="text-sm text-pretty">{bankQuestion.prompt}</p>
								<p class="text-muted mt-1 text-xs">
									{typeLabel(bankQuestion.type)} · {bankQuestion.points}
									{bankQuestion.points === 1 ? 'point' : 'points'}
									{#if bankQuestion.category}· {bankQuestion.category}{/if}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<form method="POST" action="?/addFromBank" use:enhance>
									<input type="hidden" name="bank_question_id" value={bankQuestion.id} />
									<Button type="submit" size="sm">
										<Icon icon={PlusSignIcon} class="size-4" />
										Add to this quiz
									</Button>
								</form>
								<form method="POST" action="?/deleteBankQuestion" use:enhance>
									<input type="hidden" name="bank_question_id" value={bankQuestion.id} />
									<Button type="submit" variant="ghost" size="sm">
										<Icon icon={Delete02Icon} class="size-4" />
										Remove
									</Button>
								</form>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if data.aiEnabled}
			<section class="mt-12">
				<AiQuiz
					enabled={data.aiEnabled}
					lessonTitle={data.lessonTitle}
					lessonContent={data.lessonContent}
				/>
			</section>
		{/if}

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
					<Select id="type" name="type" bind:value={type}>
						{#each TYPES as option (option)}
							<option value={option}>{typeLabel(option)}</option>
						{/each}
					</Select>
				</div>

				<div class="space-y-2">
					<Label for="prompt">Prompt</Label>
					<Textarea id="prompt" name="prompt" rows={2} required />
				</div>

				<div class="space-y-2">
					<Label for="points">Points</Label>
					<Input id="points" name="points" type="number" min="0" value="1" class="w-32" />
				</div>

				<!--
					The type select decides which of the next three blocks exists, and each of
					them is taller than the select that summoned it. They grow rather than
					appear, or every field under them jumps while the author is looking at it.
				-->
				{#if chooses}
					<fieldset
						class="space-y-2"
						transition:slide={{ duration: DURATION.base, easing: easeOut }}
					>
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
									<Checkbox
										name="option_correct"
										value={index}
										aria-label={`Option ${index + 1} is correct`}
									/>
								{/if}

								<Input
									name="option_content"
									bind:value={row.content}
									placeholder={matches
										? isImage
											? 'Left image URL'
											: 'Left'
										: isImage
											? `Image URL ${index + 1}`
											: `Option ${index + 1}`}
									aria-label={`Option ${index + 1}`}
								/>

								{#if matches}
									<Input
										name="option_match"
										bind:value={row.match}
										placeholder={isImage ? 'Right image URL' : 'Right'}
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
							variant="secondary"
							size="sm"
							onclick={() => (rows = [...rows, { content: '', match: '' }])}
						>
							<Icon icon={Add01Icon} class="size-4" />
							Add an option
						</Button>
					</fieldset>
				{/if}

				{#if isRange}
					<div class="space-y-2" transition:slide={{ duration: DURATION.base, easing: easeOut }}>
						<Label for="range_low">Accepted range</Label>
						<div class="flex items-center gap-2">
							<Input
								id="range_low"
								name="range_low"
								type="number"
								step="any"
								class="w-32"
								placeholder="Low"
							/>
							<span class="text-muted">to</span>
							<Input name="range_high" type="number" step="any" class="w-32" placeholder="High" />
						</div>
						<p class="text-muted text-xs">
							Any number from the low bound to the high bound counts as right.
						</p>
					</div>
				{/if}

				{#if typed}
					<!-- The two fields grow as one: sliding them separately would run two
					     animations over the same stretch of page. -->
					<div class="space-y-4" transition:slide={{ duration: DURATION.base, easing: easeOut }}>
						<div class="space-y-2">
							<Label for="accepted">Accepted answers</Label>
							<Textarea
								id="accepted"
								name="accepted"
								rows={3}
								placeholder="4 | four&#10;Paris"
								aria-describedby="accepted-hint"
							/>
							<p id="accepted-hint" class="text-muted text-xs">
								One line per blank; alternatives separated by <code>|</code>. A short answer has
								exactly one blank.
							</p>
						</div>

						<div class="flex items-center gap-2">
							<Checkbox id="case_sensitive" name="case_sensitive" />
							<Label for="case_sensitive">Case must match</Label>
						</div>
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="explanation">Explanation</Label>
					<Textarea
						id="explanation"
						name="explanation"
						rows={2}
						aria-describedby="explanation-hint"
					/>
					<p id="explanation-hint" class="text-muted text-xs">
						Shown to the learner once their attempt is graded, never before.
					</p>
				</div>

				<div class="flex items-center justify-end gap-3">
					<Button type="submit">
						<Icon icon={PlusSignIcon} class="size-4" />
						Add the question
					</Button>
				</div>
			</form>
		</section>

		<section class="mt-16 border-t pt-6">
			<form method="POST" action="?/deleteQuiz" use:enhance>
				<Button type="submit" variant="secondary" size="sm">
					<Icon icon={Delete02Icon} class="size-4" />
					Remove the quiz
				</Button>
				<p class="text-muted mt-2 text-xs">Deletes every question, and every attempt at it.</p>
			</form>
		</section>
	{/if}
</Page>
