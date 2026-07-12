<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Clock01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		HighlightableText,
		Icon,
		LessonIcon,
		Page,
		PageHeader
	} from '$lib/components';
	import { minutes } from '$lib/features/course';
	import {
		LessonDiscussion,
		LessonHighlights,
		LessonNav,
		LessonNotes,
		LessonOutline,
		LessonTabs,
		type Tab
	} from '$lib/features/lesson';
	import { lessonTrail } from '$lib/breadcrumbs';
	import { callAction } from '$lib/form';
	import { toast } from '$lib/toast.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let tab = $state<Tab>('notes');

	// The marks live here so a new one shows the instant it is made and a removed one
	// goes at once; the writable derived resettles from the server on the next load.
	let highlights = $derived(data.highlights);
	let focusedHighlight = $state<string | null>(null);

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

	// Completing a lesson requires an enrolment, so a previewer is shown the content
	// and nothing to press. `access` is the API's word on that, not a guess made from
	// the presence of a session.
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

<Page width="full">
	<Breadcrumbs {crumbs} />

	<div class="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
		<!--
			The outline sits beside the lesson, and scrolls inside itself rather than with
			the page: a course of forty lessons would otherwise run a column of links past
			the bottom of a reader's screen with no way back up but the page.
		-->
		<aside class="order-2">
			<details class="rounded-card bg-surface-raised shadow-card lg:hidden">
				<summary class="cursor-pointer px-4 py-3 text-sm font-medium select-none">
					Course contents
				</summary>
				<div class="border-t border-border px-4 py-4">
					<LessonOutline
						slug={data.slug}
						courseTitle={data.course.title}
						topics={data.topics}
						currentLessonId={data.lesson.id}
					/>
				</div>
			</details>

			<div
				class="hidden lg:sticky lg:top-32 lg:block lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-card lg:bg-surface-raised lg:p-4 lg:shadow-card"
			>
				<LessonOutline
					slug={data.slug}
					courseTitle={data.course.title}
					topics={data.topics}
					currentLessonId={data.lesson.id}
				/>
			</div>
		</aside>

		<!-- ------------------------------------------------------------- the lesson -->
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
				`video_embed_url`, never `video_url`. The first is a player the API built from
				a video id it recognised, on a host it allows, over https. The second is a
				string an author typed, and framing it would run their page on this origin for
				every reader of the lesson.
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

				     Signed in, the text is selectable into a highlight; otherwise it is just
				     text, because marks are the reader's own and a stranger has none. -->
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
				A quiz lesson's body is its quiz. The link is shown to anyone who can read the
				lesson; whether they may *take* it is muallim-api's decision, made on entry.
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

			{#if data.signedIn}
				<LessonTabs
					bind:tab
					highlightCount={highlights.length}
					questionCount={data.questions.length}
				/>

				{#if tab === 'notes'}
					<LessonNotes savedNote={data.note ?? ''} />
				{:else if tab === 'highlights'}
					<LessonHighlights
						{highlights}
						focused={focusedHighlight}
						onedit={saveHighlightNote}
						onremove={removeHighlight}
					/>
				{:else}
					<LessonDiscussion questions={data.questions} canModerate={data.canModerate} />
				{/if}
			{/if}

			{#if previous || next}
				<LessonNav slug={data.slug} {previous} {next} />
			{/if}
		</div>
	</div>
</Page>
