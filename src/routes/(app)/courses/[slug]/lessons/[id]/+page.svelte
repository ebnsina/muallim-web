<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		ArrowLeft01Icon,
		ArrowRight01Icon,
		Clock01Icon,
		Delete02Icon,
		Message01Icon,
		Tick02Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		HighlightableText,
		Icon,
		LessonIcon,
		Page,
		PageHeader,
		Textarea
	} from '$lib/components';
	import { lessonTrail } from '$lib/breadcrumbs';
	import { callAction } from '$lib/form';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let savingNote = $state(false);

	// The marks live here so a new one shows the instant it is made and a removed one
	// goes at once; the writable derived resettles from the server on the next load.
	let highlights = $derived(data.highlights);
	let focusedHighlight = $state<string | null>(null);

	// Add a mark for the reader's selection, then jump to its note field so they can
	// write straight away. On failure the list reloads to the truth.
	async function addHighlight(selection: { quote: string; start: number; end: number }) {
		const result = await callAction('?/addHighlight', selection);
		if (result.type === 'success' && result.data?.highlight) {
			focusedHighlight = String(result.data.highlight.id);
		}
		await invalidateAll();
	}

	async function saveHighlightNote(id: string, note: string) {
		await callAction('?/editHighlight', { id, note });
	}

	async function removeHighlight(id: string) {
		highlights = highlights.filter((h) => h.id !== id);
		await callAction('?/deleteHighlight', { id });
		await invalidateAll();
	}

	const crumbs = $derived(
		lessonTrail(data.slug, data.course.title, data.lesson.id, data.lesson.title)
	);

	// The action's answer wins over the loaded lesson, so the button flips without
	// waiting for a reload. `form` is undefined until something has been submitted.
	const completed = $derived(form ? Boolean(form.completed) : Boolean(data.lesson.completed_at));

	// Completing a lesson requires an enrolment, so a previewer is shown the
	// content and nothing to press. `access` is the API's word on that, not a
	// guess made from the presence of a session.
	const canComplete = $derived(data.access === 'enrolled');

	// The type, said in words. "text" is the API's token; a reader wants "Reading".
	const TYPE_LABEL: Record<string, string> = {
		text: 'Reading',
		video: 'Video',
		quiz: 'Quiz',
		assignment: 'Assignment',
		live: 'Live session',
		scorm: 'Interactive',
		h5p: 'Interactive'
	};

	function minutes(seconds: number): number {
		return Math.round(seconds / 60);
	}

	// The discussion. Which question's answer box is open, and a date formatter the
	// threads share.
	let answering = $state<string | null>(null);
	const postedOn = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	/*
		The course flattened to one ordered run, so "the lesson before this one" and
		"the lesson after" are an index step. The curriculum is already loaded by the
		course layout, so the ends of a lesson cost no request — only this arithmetic.
	*/
	const sequence = $derived(data.topics.flatMap((topic) => topic.lessons ?? []));
	const position = $derived(sequence.findIndex((lesson) => lesson.id === data.lesson.id));
	const previous = $derived(position > 0 ? sequence[position - 1] : null);
	const next = $derived(
		position >= 0 && position < sequence.length - 1 ? sequence[position + 1] : null
	);
</script>

<svelte:head><title>{data.lesson.title} — Muallim</title></svelte:head>

<!--
	A lesson page reads like a page in a book, and a book shows you where you are in
	it. The outline sits beside the words on a wide screen and follows you down; the
	prose keeps a readable measure rather than running the width of the display.
-->
{#snippet outline()}
	<nav aria-label="Course outline">
		<a
			href={resolve(`/courses/${data.slug}`)}
			class="block text-sm font-semibold underline-offset-4 hover:underline"
		>
			{data.course.title}
		</a>

		<ol class="mt-4 space-y-5">
			{#each data.topics as topic, section (topic.id)}
				<li>
					<p
						class="text-muted flex items-baseline gap-2 text-xs font-medium tracking-wide uppercase"
					>
						<span class="numeral">{String(section + 1).padStart(2, '0')}</span>
						<span class="text-text normal-case">{topic.title}</span>
					</p>

					<ul class="mt-2 space-y-0.5">
						{#each topic.lessons ?? [] as lesson (lesson.id)}
							{@const current = lesson.id === data.lesson.id}
							<li>
								<a
									href={resolve(`/courses/${data.slug}/lessons/${lesson.id}`)}
									aria-current={current ? 'page' : undefined}
									class={cn(
										'flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-sm transition-colors',
										current
											? 'bg-accent-surface font-medium text-accent-text'
											: 'text-muted hover:bg-surface-sunken hover:text-text'
									)}
								>
									<span class="shrink-0">
										<LessonIcon contentType={lesson.content_type} />
									</span>
									<span class="min-w-0 flex-1 truncate">{lesson.title}</span>
									{#if lesson.is_preview}
										<span class="text-accent-text shrink-0 text-xs">Free</span>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	</nav>
{/snippet}

<Page width="full">
	<Breadcrumbs {crumbs} />

	<div class="mt-6 grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
		<!-- The outline: a sticky column on a wide screen, a disclosure on a narrow one. -->
		<aside class="order-2 lg:order-1">
			<details class="rounded-card border border-border lg:hidden">
				<summary class="cursor-pointer px-4 py-3 text-sm font-medium select-none">
					Course contents
				</summary>
				<div class="border-t border-border px-4 py-4">
					{@render outline()}
				</div>
			</details>

			<div class="hidden lg:sticky lg:top-24 lg:block">
				{@render outline()}
			</div>
		</aside>

		<!-- ---------------------------------------------------------- the lesson -->
		<div class="order-1 min-w-0 lg:order-2">
			<PageHeader title={data.lesson.title}>
				{#snippet meta()}
					<span class="text-muted flex items-center gap-1.5">
						<LessonIcon contentType={data.lesson.content_type} />
						{TYPE_LABEL[data.lesson.content_type] ?? data.lesson.content_type}
					</span>

					{#if data.lesson.duration_seconds}
						<span class="text-muted flex items-center gap-1.5">
							<Icon icon={Clock01Icon} class="size-3.5" />
							<span class="numeral">{minutes(data.lesson.duration_seconds)}</span> min
						</span>
					{/if}

					{#if data.access === 'preview'}
						<Badge tone="accent">Preview</Badge>
					{/if}
				{/snippet}
			</PageHeader>

			{#if form?.message}
				<Alert tone="danger" class="mt-6" role="alert">
					{form.message}
				</Alert>
			{/if}

			<!--
				`video_embed_url`, never `video_url`. The first is a player the API built
				from a video id it recognised, on a host it allows, over https. The second
				is a string an author typed, and framing it would run their page on this
				origin for every reader of the lesson.
			-->
			{#if data.lesson.video_embed_url}
				<div class="mt-8">
					<iframe
						class="aspect-video w-full rounded-card border border-border"
						src={data.lesson.video_embed_url}
						title={data.lesson.title}
						allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				</div>
			{/if}

			{#if data.lesson.content}
				<!-- A readable measure and generous leading: this is where the reading is
				     actually done, so it gets the typography of a page, not of a field.

				     Signed in, the text is selectable into a highlight; otherwise it is
				     just text, because marks are the reader's own and a stranger has none. -->
				{#if data.signedIn}
					<HighlightableText
						content={data.lesson.content}
						{highlights}
						onadd={addHighlight}
						class="mt-8 max-w-2xl leading-relaxed text-pretty"
					/>
				{:else}
					<div class="mt-8 max-w-2xl leading-relaxed text-pretty whitespace-pre-wrap">
						{data.lesson.content}
					</div>
				{/if}
			{:else if !data.lesson.video_embed_url}
				<p class="text-muted mt-8 text-sm">This lesson has no content yet.</p>
			{/if}

			<!--
				A quiz lesson's body is its quiz. The link is shown to anyone who can read
				the lesson; whether they may *take* it is muallim-api's decision, made on entry.
			-->
			{#if data.lesson.content_type === 'quiz'}
				<div class="mt-8">
					<Button href={resolve(`/courses/${data.slug}/lessons/${data.lesson.id}/quiz`)}>
						Go to the quiz
					</Button>
				</div>
			{:else if data.lesson.content_type === 'assignment'}
				<div class="mt-8">
					<Button href={resolve(`/courses/${data.slug}/lessons/${data.lesson.id}/assignment`)}>
						Go to the assignment
					</Button>
				</div>
			{/if}

			{#if data.access === 'preview'}
				<Alert class="mt-10 max-w-2xl">
					This is a free preview. Enrol on the course to read the rest and to track your progress.
				</Alert>
			{:else if canComplete}
				<div class="mt-10 flex items-center gap-4">
					<form method="POST" action="?/complete" use:enhance>
						<input type="hidden" name="complete" value={completed ? 'false' : 'true'} />
						<Button type="submit" variant={completed ? 'secondary' : 'primary'}>
							{#if !completed}
								<Icon icon={Tick02Icon} class="size-4" />
							{/if}
							{completed ? 'Reopen lesson' : 'Mark as complete'}
						</Button>
					</form>

					{#if completed}
						<p class="flex items-center gap-1.5 text-sm text-success-text" role="status">
							<Icon icon={Tick02Icon} class="size-4" />
							Completed.
						</p>
					{/if}
				</div>
			{/if}

			<!--
				A private margin. Only a signed-in reader has one — it is theirs, kept
				against the lesson and shown to nobody else. The whole note is sent on
				save; emptying it clears it, which is why there is nothing to delete.
			-->
			{#if data.signedIn}
				<section class="mt-12 max-w-2xl">
					<h2 class="text-sm font-medium tracking-wide uppercase">Your notes</h2>
					<p class="text-muted mt-1 text-xs">Private to you. Nobody else can read them.</p>

					<form
						method="POST"
						action="?/saveNote"
						class="mt-3"
						use:enhance={() => {
							savingNote = true;
							return async ({ update }) => {
								await update({ reset: false });
								savingNote = false;
							};
						}}
					>
						<Textarea
							name="body"
							rows={5}
							maxlength={10000}
							value={data.note}
							aria-label="Your notes on this lesson"
							placeholder="Jot something down as you read…"
						/>

						<div class="mt-2 flex items-center gap-3">
							<Button type="submit" variant="secondary" size="sm" loading={savingNote}>
								{savingNote ? 'Saving…' : 'Save note'}
							</Button>

							{#if form?.noteSaved}
								<span class="text-xs text-success-text" role="status">Saved.</span>
							{:else if form?.noteMessage}
								<span class="text-xs text-danger-text" role="alert">{form.noteMessage}</span>
							{/if}
						</div>
					</form>

					<!--
						The passages marked in the text, each with its own remark. Select any
						words above to add one; the quote is the anchor, kept so the passage is
						recognisable even after the lesson is edited under it.
					-->
					{#if highlights.length > 0}
						<div class="mt-10">
							<h2 class="text-sm font-medium tracking-wide uppercase">Highlighted passages</h2>

							<ul class="mt-3 space-y-3">
								{#each highlights as highlight (highlight.id)}
									<li
										id="highlight-{highlight.id}"
										class={cn(
											'rounded-card border p-4 transition-colors',
											focusedHighlight === highlight.id
												? 'border-warning-border bg-warning-surface/40'
												: 'border-border'
										)}
									>
										<div class="flex items-start justify-between gap-3">
											<blockquote
												class="border-l-2 border-warning-border pl-3 text-sm text-pretty text-muted italic"
											>
												{highlight.quote}
											</blockquote>

											<button
												type="button"
												class="text-muted hover:text-danger-text shrink-0 rounded-control p-1 transition-colors"
												aria-label="Remove this highlight"
												onclick={() => removeHighlight(highlight.id)}
											>
												<Icon icon={Delete02Icon} class="size-4" />
											</button>
										</div>

										<Textarea
											class="mt-3"
											rows={2}
											value={highlight.note}
											aria-label="Note on this passage"
											placeholder="Add a note on this passage…"
											onblur={(event) => saveHighlightNote(highlight.id, event.currentTarget.value)}
										/>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</section>
			{/if}

			<!--
				The public discussion. Shared with everyone studying the course, unlike the
				private note above. Only a signed-in reader who may read the lesson sees it —
				the API returns an empty thread otherwise.
			-->
			{#if data.signedIn}
				<section class="mt-14 max-w-2xl">
					<h2 class="flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
						<Icon icon={Message01Icon} class="size-4" />
						Discussion
					</h2>

					<form method="POST" action="?/askQuestion" class="mt-4" use:enhance>
						<Textarea
							name="body"
							rows={2}
							maxlength={5000}
							aria-label="Ask a question"
							placeholder="Ask a question about this lesson…"
						/>
						<div class="mt-2 flex items-center gap-3">
							<Button type="submit" size="sm">Ask</Button>
							{#if form?.qaMessage}
								<span class="text-xs text-danger-text" role="alert">{form.qaMessage}</span>
							{/if}
						</div>
					</form>

					{#if data.questions.length > 0}
						<ul class="mt-6 space-y-4">
							{#each data.questions as question (question.id)}
								<li>
									<Card class="p-5">
										<div class="flex items-start justify-between gap-3">
											<div class="min-w-0">
												<p class="text-sm whitespace-pre-wrap">{question.body}</p>
												<p class="text-muted mt-1.5 text-xs">
													{question.author_name || 'A learner'} ·
													<span class="numeral"
														>{postedOn.format(new Date(question.created_at))}</span
													>
												</p>
											</div>
											{#if question.mine || data.canModerate}
												<form method="POST" action="?/deleteQuestion" use:enhance>
													<input type="hidden" name="id" value={question.id} />
													<button
														type="submit"
														class="text-muted hover:text-danger-text shrink-0 rounded-control p-1 transition-colors"
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
													<li class="flex items-start justify-between gap-3">
														<div class="min-w-0">
															<p class="text-sm whitespace-pre-wrap">{answer.body}</p>
															<p class="text-muted mt-1.5 flex items-center gap-2 text-xs">
																<span>{answer.author_name || 'A learner'}</span>
																{#if answer.by_instructor}
																	<Badge tone="accent">Instructor</Badge>
																{/if}
																<span class="numeral"
																	>{postedOn.format(new Date(answer.created_at))}</span
																>
															</p>
														</div>
														{#if answer.mine || data.canModerate}
															<form method="POST" action="?/deleteAnswer" use:enhance>
																<input type="hidden" name="id" value={answer.id} />
																<button
																	type="submit"
																	class="text-muted hover:text-danger-text shrink-0 rounded-control p-1 transition-colors"
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
													return async ({ update }) => {
														await update();
														answering = null;
													};
												}}
											>
												<input type="hidden" name="question_id" value={question.id} />
												<Textarea
													name="body"
													rows={2}
													maxlength={5000}
													aria-label="Write an answer"
													placeholder="Write an answer…"
												/>
												<div class="mt-2 flex items-center gap-2">
													<Button type="submit" size="sm">Post answer</Button>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onclick={() => (answering = null)}
													>
														Cancel
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
				</section>
			{/if}

			<!--
				The two steps out of a lesson, side by side. Each names the lesson it goes
				to, so a reader knows what is next before they leave what they are on. The
				pair sits below everything, where a page turn belongs.
			-->
			{#if previous || next}
				<nav
					aria-label="Lesson"
					class="mt-14 grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
				>
					{#if previous}
						<a
							href={resolve(`/courses/${data.slug}/lessons/${previous.id}`)}
							class="lift group flex items-center gap-3 rounded-card border border-border p-4 sm:col-start-1"
						>
							<Icon
								icon={ArrowLeft01Icon}
								class="text-muted size-5 shrink-0 transition-colors group-hover:text-text"
							/>
							<span class="min-w-0">
								<span class="text-muted text-xs">Previous</span>
								<span class="block truncate text-sm font-medium">{previous.title}</span>
							</span>
						</a>
					{/if}

					{#if next}
						<a
							href={resolve(`/courses/${data.slug}/lessons/${next.id}`)}
							class="lift group flex items-center gap-3 rounded-card border border-border p-4 text-right sm:col-start-2"
						>
							<span class="min-w-0 flex-1">
								<span class="text-muted text-xs">Next</span>
								<span class="block truncate text-sm font-medium">{next.title}</span>
							</span>
							<Icon
								icon={ArrowRight01Icon}
								class="text-muted size-5 shrink-0 transition-colors group-hover:text-text"
							/>
						</a>
					{/if}
				</nav>
			{/if}
		</div>
	</div>
</Page>
