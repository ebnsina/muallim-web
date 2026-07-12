<script lang="ts">
	import { enhance } from '$app/forms';
	import { Delete02Icon } from '@hugeicons/core-free-icons';
	import { Badge, Button, Card, Icon, Textarea } from '$lib/components';
	import { toast } from '$lib/toast.svelte';
	import { cn } from '$lib/utils';
	import { REVEAL_ON_ANSWER_HOVER, REVEAL_ON_HOVER } from './tabs';
	import type { Question } from './types';

	type Props = {
		questions: Question[];
		/** An instructor may remove anybody's post; everyone else, only their own. */
		canModerate: boolean;
	};

	let { questions, canModerate }: Props = $props();

	const postedOn = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	// Which question's answer box is open, and the drafts in each box.
	let answering = $state<string | null>(null);
	let questionDraft = $state('');
	let answerDraft = $state('');
</script>

<!--
	The public discussion. Shared with everyone studying the course, unlike the private
	note. Only a signed-in reader who may read the lesson sees it — the API returns an
	empty thread otherwise.
-->
<div id="panel-discussion" role="tabpanel" aria-labelledby="tab-discussion" class="mt-5 max-w-2xl">
	<form
		method="POST"
		action="?/askQuestion"
		use:enhance={() => {
			return async ({ result, update }) => {
				await update();

				if (result.type === 'failure') {
					toast.danger(String(result.data?.qaMessage ?? 'Your question could not be posted.'));
					return;
				}
				if (result.type === 'error') {
					toast.danger('Your question could not be posted.');
					return;
				}

				questionDraft = '';
				toast.success('Question posted.');
			};
		}}
	>
		<Textarea
			name="body"
			rows={2}
			maxlength={5000}
			bind:value={questionDraft}
			aria-label="Ask a question"
			placeholder="Ask a question about this lesson…"
		/>
		<div class="mt-2 flex items-center justify-end gap-3">
			<!-- An empty question is not a question. The server refuses it too. -->
			<Button type="submit" size="sm" disabled={questionDraft.trim() === ''}>Ask</Button>
		</div>
	</form>

	{#if questions.length > 0}
		<ul class="mt-6 space-y-4">
			{#each questions as question (question.id)}
				<li>
					<Card class="group p-5">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-sm whitespace-pre-wrap">{question.body}</p>
								<p class="text-muted mt-1.5 text-xs">
									{question.author_name || 'A learner'} ·
									<span class="numeral">{postedOn.format(new Date(question.created_at))}</span>
								</p>
							</div>
							{#if question.mine || canModerate}
								<form method="POST" action="?/deleteQuestion" use:enhance>
									<input type="hidden" name="id" value={question.id} />
									<button
										type="submit"
										class={cn(REVEAL_ON_HOVER, 'text-muted hover:text-danger-text')}
										aria-label="Remove this question"
									>
										<Icon icon={Delete02Icon} class="size-4" />
									</button>
								</form>
							{/if}
						</div>

						<!-- Answers, oldest first, an instructor's badged. -->
						{#if (question.answers ?? []).length > 0}
							<ul class="mt-4 space-y-3 border-l-2 border-border pl-4">
								{#each question.answers ?? [] as answer (answer.id)}
									<li class="group/answer flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="text-sm whitespace-pre-wrap">{answer.body}</p>
											<p class="text-muted mt-1.5 flex items-center gap-2 text-xs">
												<span>{answer.author_name || 'A learner'}</span>
												{#if answer.by_instructor}
													<Badge tone="accent">Instructor</Badge>
												{/if}
												<span class="numeral">{postedOn.format(new Date(answer.created_at))}</span>
											</p>
										</div>
										{#if answer.mine || canModerate}
											<form method="POST" action="?/deleteAnswer" use:enhance>
												<input type="hidden" name="id" value={answer.id} />
												<button
													type="submit"
													class={cn(REVEAL_ON_ANSWER_HOVER, 'text-muted hover:text-danger-text')}
													aria-label="Remove this answer"
												>
													<Icon icon={Delete02Icon} class="size-4" />
												</button>
											</form>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}

						<!-- Reply. The box opens in place so the thread stays where it is. -->
						{#if answering === question.id}
							<form
								method="POST"
								action="?/answerQuestion"
								class="mt-4"
								use:enhance={() => {
									return async ({ result, update }) => {
										await update();

										if (result.type === 'failure' || result.type === 'error') {
											toast.danger(
												result.type === 'failure'
													? String(result.data?.qaMessage ?? 'Your answer could not be posted.')
													: 'Your answer could not be posted.'
											);
											return;
										}

										answerDraft = '';
										answering = null;
										toast.success('Answer posted.');
									};
								}}
							>
								<input type="hidden" name="question_id" value={question.id} />
								<Textarea
									name="body"
									rows={2}
									maxlength={5000}
									bind:value={answerDraft}
									aria-label="Write an answer"
									placeholder="Write an answer…"
								/>
								<div class="mt-2 flex items-center justify-end gap-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => (answering = null)}
									>
										Cancel
									</Button>
									<Button type="submit" size="sm" disabled={answerDraft.trim() === ''}>
										Post answer
									</Button>
								</div>
							</form>
						{:else}
							<button
								type="button"
								class="text-muted hover:text-text mt-3 text-xs font-medium transition-colors"
								onclick={() => (answering = question.id)}
							>
								Answer
							</button>
						{/if}
					</Card>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-muted mt-4 text-sm">No questions yet. Be the first to ask.</p>
	{/if}
</div>
