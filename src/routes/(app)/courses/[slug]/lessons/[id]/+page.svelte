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
		QuoteDownIcon,
		StickyNote02Icon,
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
	import { toast } from '$lib/toast.svelte';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let savingNote = $state(false);

	/*
		The note as it stands in the box, against the note as the server last knew it.
		The difference is what makes "Save" mean anything.

		`savedNote` is derived rather than captured, and the effect resettles the box
		from it: a plain `$state(data.note)` reads the note of the lesson the page was
		first built for, so walking to the next lesson would carry the last one's note
		along and offer to save it there.
	*/
	const savedNote = $derived(data.note ?? '');
	let noteDraft = $derived(savedNote);
	const noteChanged = $derived(noteDraft !== savedNote);

	// The marks live here so a new one shows the instant it is made and a removed one
	// goes at once; the writable derived resettles from the server on the next load.
	let highlights = $derived(data.highlights);
	let focusedHighlight = $state<string | null>(null);

	/*
		Notes, marks and the discussion are three things a reader does *about* a
		lesson, not three more things to scroll past to reach the next one. They share
		one panel below the text, and the tabs pick between them.
	*/
	type Tab = 'notes' | 'highlights' | 'discussion';
	let tab = $state<Tab>('notes');

	const TABS = $derived([
		{ id: 'notes' as const, label: 'Notes', icon: StickyNote02Icon, count: 0 },
		{
			id: 'highlights' as const,
			label: 'Highlights',
			icon: QuoteDownIcon,
			count: highlights.length
		},
		{
			id: 'discussion' as const,
			label: 'Discussion',
			icon: Message01Icon,
			count: data.questions.length
		}
	]);

	/*
		A destructive control that is always on screen is clutter on every row it is
		not wanted on. It appears when the row does — on hover, and on focus, so the
		keyboard reaches what the mouse does.

		Only where a pointer can hover: `lg:` rather than a bare `opacity-0`, because
		on a touch screen there is no hover state to reveal it with, and an invisible
		delete button is a delete button nobody has.
	*/
	const REVEAL_ON_HOVER =
		'shrink-0 rounded-control p-1 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 lg:focus-visible:opacity-100';

	// The same, keyed to the answer's own row: an answer sits inside a question's
	// card, and a bare `group-hover` there would reveal every answer's control at
	// once the moment the pointer touched the card.
	const REVEAL_ON_ANSWER_HOVER =
		'shrink-0 rounded-control p-1 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:opacity-0 lg:group-hover/answer:opacity-100 lg:group-focus-within/answer:opacity-100 lg:focus-visible:opacity-100';

	// Left and right walk the tabs, as a tablist is expected to. Without it the
	// arrow keys do nothing and the widget is a row of buttons wearing a role.
	function moveTab(event: KeyboardEvent, current: Tab) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();

		const order = TABS.map((t) => t.id);
		const step = event.key === 'ArrowRight' ? 1 : -1;
		const next = order[(order.indexOf(current) + step + order.length) % order.length];

		tab = next;
		document.getElementById(`tab-${next}`)?.focus();
	}

	/*
		These three go over `fetch` rather than through a form, so nothing renders their
		outcome by default: a failed mark used to disappear on the next reload and say
		nothing about why. Each one now answers, and a failure says so.
	*/
	async function addHighlight(selection: { quote: string; start: number; end: number }) {
		const result = await callAction('?/addHighlight', selection);
		if (result.type !== 'success') {
			toast.danger('That passage could not be marked.');
			return;
		}
		if (result.data?.highlight) {
			focusedHighlight = String(result.data.highlight.id);
		}
		await invalidateAll();
		toast.success('Passage marked. Add a note to it under Highlights.');
	}

	// On blur, and only when it changed: a reader tabbing through their marks would
	// otherwise post one save per passage they passed over.
	async function saveHighlightNote(id: string, note: string) {
		const current = highlights.find((h) => h.id === id);
		if (current && current.note === note) return;

		const result = await callAction('?/editHighlight', { id, note });
		if (result.type !== 'success') {
			toast.danger('That note could not be saved.');
			return;
		}
		toast.success(note.trim() === '' ? 'Note cleared.' : 'Note saved.');
	}

	async function removeHighlight(id: string) {
		const kept = highlights;
		highlights = highlights.filter((h) => h.id !== id);

		const result = await callAction('?/deleteHighlight', { id });
		if (result.type !== 'success') {
			highlights = kept;
			toast.danger('That highlight could not be removed.');
			return;
		}
		await invalidateAll();
		toast.success('Highlight removed.');
	}

	const crumbs = $derived(
		lessonTrail(data.slug, data.course.title, data.lesson.id, data.lesson.title)
	);

	/*
		The action's answer wins over the loaded lesson, so the button flips without
		waiting for a reload — but only the *completion* action's answer.

		`form` is whatever the last action on this page returned, and saving a note
		returns no `completed` at all: read it as a boolean and a finished lesson
		announced itself unfinished the moment its reader wrote a note.
	*/
	const completed = $derived(
		form && 'completed' in form ? Boolean(form.completed) : Boolean(data.lesson.completed_at)
	);

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

	// The discussion. Which question's answer box is open, the drafts in each box, and
	// a date formatter the threads share.
	let answering = $state<string | null>(null);
	let questionDraft = $state('');
	let answerDraft = $state('');
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

	<div class="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
		<!--
			The outline sits beside the lesson, and scrolls inside itself rather than
			with the page: a course of forty lessons would otherwise run a column of
			links past the bottom of a reader's screen with no way back up but the page.
		-->
		<aside class="order-2">
			<details class="rounded-card border border-border lg:hidden">
				<summary class="cursor-pointer px-4 py-3 text-sm font-medium select-none">
					Course contents
				</summary>
				<div class="border-t border-border px-4 py-4">
					{@render outline()}
				</div>
			</details>

			<div
				class="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-card lg:border lg:border-border lg:p-4"
			>
				{@render outline()}
			</div>
		</aside>

		<!-- ---------------------------------------------------------- the lesson -->
		<div class="order-1 min-w-0">
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
				One panel, three tabs. A tablist, not a row of buttons: the roles are what
				make the arrow keys work and what tells a screen reader that picking one
				replaces the panel below rather than navigating away.
			-->
			{#if data.signedIn}
				<div class="mt-12 max-w-2xl">
					<!--
						One track, three segments. Separate pills read as three unrelated
						buttons; a segmented control says these are the same question asked
						three ways, and only one of them can be the answer.
					-->
					<div
						role="tablist"
						aria-label="About this lesson"
						class="inline-flex gap-1 rounded-pill bg-surface-sunken p-1"
					>
						{#each TABS as t (t.id)}
							{@const active = tab === t.id}
							<button
								type="button"
								role="tab"
								id="tab-{t.id}"
								aria-selected={active}
								aria-controls="panel-{t.id}"
								tabindex={active ? 0 : -1}
								class={cn(
									'flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
									active
										? 'bg-accent text-on-solid'
										: 'text-muted hover:bg-surface-hover hover:text-text'
								)}
								onclick={() => (tab = t.id)}
								onkeydown={(event) => moveTab(event, t.id)}
							>
								<Icon icon={t.icon} class="size-4" />
								{t.label}

								{#if t.count > 0}
									<span
										class={cn(
											'numeral rounded-pill px-1.5 text-xs',
											active ? 'bg-on-solid/20' : 'bg-surface-raised'
										)}
									>
										{t.count}
									</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!--
				A private margin. Only a signed-in reader has one — it is theirs, kept
				against the lesson and shown to nobody else. The whole note is sent on
				save; emptying it clears it, which is why there is nothing to delete.
			-->
			{#if data.signedIn && tab === 'notes'}
				<div id="panel-notes" role="tabpanel" aria-labelledby="tab-notes" class="mt-5 max-w-2xl">
					<p class="text-muted text-xs">Private to you. Nobody else can read them.</p>

					<form
						method="POST"
						action="?/saveNote"
						class="mt-3"
						use:enhance={() => {
							/*
								The outcome is a toast, not a word beside the button. "Saved." in
								grey text under a form is a thing you have to be looking at to see,
								and a reader who just pressed the button is looking at the button.
							*/
							const cleared = noteDraft.trim() === '';
							savingNote = true;

							return async ({ result, update }) => {
								await update({ reset: false });
								savingNote = false;

								if (result.type === 'failure') {
									toast.danger(String(result.data?.noteMessage ?? 'Your note could not be saved.'));
									return;
								}
								if (result.type === 'error') {
									toast.danger('Your note could not be saved.');
									return;
								}

								toast.success(cleared ? 'Note cleared.' : 'Note saved.');
							};
						}}
					>
						<Textarea
							name="body"
							rows={5}
							maxlength={10000}
							bind:value={noteDraft}
							aria-label="Your notes on this lesson"
							placeholder="Jot something down as you read…"
						/>

						<!--
							The commit sits at the end of the form, where the eye leaves it: a
							button under the left edge of a box is a button you pass on the way in.
						-->
						<div class="mt-2 flex items-center justify-end gap-3">
							{#if noteChanged}
								<span class="text-muted text-xs">Unsaved changes</span>
							{/if}

							<!--
								Nothing to save is not an act. Saving an unchanged note answered
								"Saved." to a reader who had changed nothing, which is a lie told
								politely.
							-->
							<Button
								type="submit"
								variant="secondary"
								size="sm"
								loading={savingNote}
								disabled={!noteChanged}
							>
								{savingNote
									? 'Saving…'
									: noteDraft.trim() === '' && savedNote
										? 'Clear note'
										: 'Save note'}
							</Button>
						</div>
					</form>
				</div>
			{/if}

			<!--
				The passages marked in the text, each with its own remark. Select any words
				in the lesson to add one; the quote is the anchor, kept so the passage is
				recognisable even after the lesson is edited under it.
			-->
			{#if data.signedIn && tab === 'highlights'}
				<div
					id="panel-highlights"
					role="tabpanel"
					aria-labelledby="tab-highlights"
					class="mt-5 max-w-2xl"
				>
					{#if highlights.length > 0}
						<div>
							<ul class="space-y-3">
								{#each highlights as highlight (highlight.id)}
									<li
										id="highlight-{highlight.id}"
										class={cn(
											'group rounded-card border p-4 transition-colors',
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
												class={cn(REVEAL_ON_HOVER, 'text-muted hover:text-danger-text')}
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
					{:else}
						<p class="text-muted text-sm">
							Select any passage in the lesson above to mark it, and add a note against it.
						</p>
					{/if}
				</div>
			{/if}

			<!--
				The public discussion. Shared with everyone studying the course, unlike the
				private note. Only a signed-in reader who may read the lesson sees it — the
				API returns an empty thread otherwise.
			-->
			{#if data.signedIn && tab === 'discussion'}
				<div
					id="panel-discussion"
					role="tabpanel"
					aria-labelledby="tab-discussion"
					class="mt-5 max-w-2xl"
				>
					<form
						method="POST"
						action="?/askQuestion"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();

								if (result.type === 'failure') {
									toast.danger(
										String(result.data?.qaMessage ?? 'Your question could not be posted.')
									);
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

					{#if data.questions.length > 0}
						<ul class="mt-6 space-y-4">
							{#each data.questions as question (question.id)}
								<li>
									<Card class="group p-5">
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
																	class={cn(
																		REVEAL_ON_ANSWER_HOVER,
																		'text-muted hover:text-danger-text'
																	)}
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
																	? String(
																			result.data?.qaMessage ?? 'Your answer could not be posted.'
																		)
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
