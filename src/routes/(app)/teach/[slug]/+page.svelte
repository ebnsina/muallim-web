<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { flip } from 'svelte/animate';
	import { DURATION, easeInOut } from '$lib/motion';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import {
		CheckmarkCircle02Icon,
		DragDropVerticalIcon,
		PencilEdit02Icon
	} from '@hugeicons/core-free-icons';
	import type { ActionResult } from '@sveltejs/kit';
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
		Select,
		Sheet,
		Stars,
		Textarea
	} from '$lib/components';
	import AiOutline from '$lib/components/AiOutline.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const announcementDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	/*
		Drag-and-drop reordering.

		`topics` is an editable copy of the loaded curriculum: a reorder mutates it at
		once for an instant response, then submits the whole new order and lets the
		server's answer resettle it. The `$effect` is a resync of that copy from the
		server's version — the genuine external input — not one piece of local state
		shadowing another, which is the thing to avoid.
	*/
	type EditorLesson = { id: string; title: string; content_type: string; is_preview: boolean };
	type EditorTopic = { id: string; title: string; lessons: EditorLesson[] };

	function mapTopics(source: typeof data.topics): EditorTopic[] {
		return source.map((topic) => ({
			id: topic.id,
			title: topic.title,
			lessons: (topic.lessons ?? []).map((lesson) => ({
				id: lesson.id,
				title: lesson.title,
				content_type: lesson.content_type,
				is_preview: lesson.is_preview
			}))
		}));
	}

	// A writable `$derived`: it tracks the loaded curriculum — so it renders on the
	// server and refreshes whenever the load runs again — but a drag can also assign
	// to it directly, and that optimistic value holds until the next load resettles
	// it. One expression does the job an editable copy plus a resync effect would.
	let topics = $derived(mapTopics(data.topics));

	// Submit a reordered list to one of the page's actions, by hand because the drag
	// happened in script. On success nothing more is done — the optimistic order the
	// drag already applied is the order the server now holds, so reloading it would
	// only make the list flash and jump. A rejection reverts: it surfaces the error
	// and reloads, snapping the list back to the truth instead of lying on screen.
	async function postOrder(action: string, entries: [string, string][]) {
		const body = new FormData();
		for (const [key, value] of entries) body.append(key, value);

		const response = await fetch(action, {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result: ActionResult = deserialize(await response.text());
		if (result.type !== 'success') {
			applyAction(result);
			await invalidateAll();
		}
	}

	// Move the dropped item to where it landed. `dropPosition` says whether it goes
	// before or after the target; a drag whose payload is not in this list (a lesson
	// dropped on a section, say) matches nothing and is left alone.
	function reordered<T extends { id: string }>(list: T[], draggedId: string, target: number): T[] {
		const from = list.findIndex((item) => item.id === draggedId);
		if (from < 0 || Number.isNaN(target)) return list;
		const next = [...list];
		const [moved] = next.splice(from, 1);
		next.splice(from < target ? target - 1 : target, 0, moved);
		return next;
	}

	// The drop callbacks are handed a `DragDropState<unknown>`; the payload is one of
	// our own items, so its id is what identifies it.
	function draggedId(state: DragDropState<unknown>): string {
		return (state.draggedItem as { id: string }).id;
	}

	function handleTopicDrop(state: DragDropState<unknown>) {
		if (!state.targetContainer) return;
		let target = Number(state.targetContainer.split('-')[1]);
		if (state.dropPosition === 'after') target += 1;

		const next = reordered(topics, draggedId(state), target);
		if (next === topics) return;
		topics = next;
		postOrder(
			'?/reorderTopics',
			next.map((topic) => ['topic_ids', topic.id])
		);
	}

	function handleLessonDrop(topicId: string, state: DragDropState<unknown>) {
		if (!state.targetContainer) return;
		const topic = topics.find((candidate) => candidate.id === topicId);
		if (!topic) return;

		let target = Number(state.targetContainer.split('-')[2]);
		if (state.dropPosition === 'after') target += 1;

		const next = reordered(topic.lessons, draggedId(state), target);
		if (next === topic.lessons) return;
		commitLessons(topicId, next);
	}

	// Writing the reordered lessons back onto the whole `topics` value, not onto the
	// topic object in place: `topics` is the writable derived the template reads, and
	// only reassigning it makes the change show. Then the new order is submitted.
	function commitLessons(topicId: string, lessons: EditorLesson[]) {
		topics = topics.map((topic) => (topic.id === topicId ? { ...topic, lessons } : topic));
		postOrder('?/reorderLessons', [
			['topic_id', topicId],
			...lessons.map((lesson) => ['lesson_ids', lesson.id] as [string, string])
		]);
	}

	// Keyboard reordering, so the grip is not a mouse-only control. Arrow keys on a
	// handle move its row one place; focus rides along because the list is keyed by
	// id, so the same button survives the re-render and the next arrow keeps going.
	function nudgeTopic(index: number, delta: number) {
		const to = index + delta;
		if (to < 0 || to >= topics.length) return;
		const next = [...topics];
		[next[index], next[to]] = [next[to], next[index]];
		topics = next;
		postOrder(
			'?/reorderTopics',
			next.map((topic) => ['topic_ids', topic.id])
		);
	}

	function nudgeLesson(topicId: string, index: number, delta: number) {
		const topic = topics.find((candidate) => candidate.id === topicId);
		if (!topic) return;
		const to = index + delta;
		if (to < 0 || to >= topic.lessons.length) return;
		const next = [...topic.lessons];
		[next[index], next[to]] = [next[to], next[index]];
		commitLessons(topicId, next);
	}

	// The <select> value: the course's template, or '' for the built-in default.
	const currentTemplateId = $derived(data.currentTemplateId ?? '');

	const crumbs = $derived([
		{ label: 'Teach', href: resolve('/teach') },
		{ label: data.course.title }
	]);

	const dripModes = [
		{ value: 'none', label: 'All at once' },
		{ value: 'scheduled', label: 'On a fixed date' },
		{ value: 'after_enrolment', label: 'Days after enrolling' },
		{ value: 'sequential', label: 'One lesson at a time' }
	];

	const hints: Record<string, string> = {
		none: 'Every lesson is available as soon as a learner enrols.',
		scheduled: 'Each lesson opens at its own date and time, the same for everybody.',
		after_enrolment: "Each lesson opens a number of days after each learner's own enrolment.",
		sequential: 'A lesson opens when the learner has finished every lesson before it.'
	};

	const dripHint = $derived(hints[data.course.drip_mode] ?? '');
</script>

<svelte:head><title>{data.course.title} — Teach</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title={data.course.title}>
		{#snippet actions()}
			<Button href={resolve(`/teach/${data.course.slug}/gradebook`)} variant="secondary" size="sm">
				Gradebook
			</Button>
		{/snippet}

		{#snippet meta()}
			<Badge
				tone={data.course.status === 'published' ? 'success' : 'neutral'}
				icon={data.course.status === 'published' ? CheckmarkCircle02Icon : PencilEdit02Icon}
			>
				{data.course.status}
			</Badge>
			<span class="text-muted">
				<span class="numeral">{data.lessonCount}</span>
				{data.lessonCount === 1 ? 'lesson' : 'lessons'}
			</span>
		{/snippet}
	</PageHeader>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{:else if form?.templateSaved}
		<Alert tone="success" class="mt-6" role="status">Certificate template updated.</Alert>
	{/if}

	<!-- ---------------------------------------------------------- analytics -->
	{#if data.analytics}
		{@const a = data.analytics}
		<section class="mt-8">
			<h2 class="text-sm font-medium tracking-wide uppercase">At a glance</h2>
			<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card class="p-5">
					<p class="text-muted text-xs tracking-wide uppercase">Enrolments</p>
					<p class="mt-2 text-2xl font-semibold">
						<span class="numeral">{a.total_enrolments}</span>
					</p>
					<p class="text-muted mt-1 text-xs">
						<span class="numeral">{a.active}</span> active ·
						<span class="numeral">{a.completed}</span> completed
					</p>
				</Card>

				<Card class="p-5">
					<p class="text-muted text-xs tracking-wide uppercase">Completion</p>
					<p class="mt-2 text-2xl font-semibold">
						<span class="numeral">{Math.round(a.completion_rate * 100)}</span>%
					</p>
					<p class="text-muted mt-1 text-xs">of active and finished learners</p>
				</Card>

				<Card class="p-5">
					<p class="text-muted text-xs tracking-wide uppercase">Avg. progress</p>
					<p class="mt-2 text-2xl font-semibold">
						<span class="numeral">{Math.round(a.average_progress)}</span>%
					</p>
					<p class="text-muted mt-1 text-xs">across the course</p>
				</Card>

				<Card class="p-5">
					<p class="text-muted text-xs tracking-wide uppercase">Rating</p>
					{#if a.reviews.count > 0}
						<p class="mt-2 flex items-center gap-2">
							<span class="text-2xl font-semibold">
								<span class="numeral">{a.reviews.average.toFixed(1)}</span>
							</span>
							<Stars value={a.reviews.average} size="sm" />
						</p>
						<p class="text-muted mt-1 text-xs">
							from <span class="numeral">{a.reviews.count}</span>
							{a.reviews.count === 1 ? 'review' : 'reviews'}
						</p>
					{:else}
						<p class="text-muted mt-2 text-sm">No reviews yet.</p>
					{/if}
				</Card>
			</div>
		</section>
	{/if}

	<section class="mt-8 max-w-3xl">
		<Card class="space-y-6 p-5">
			<div>
				<h2 class="font-medium">Release schedule</h2>
				<p class="text-muted mt-1 text-sm">
					How this course hands its lessons to a learner. A free preview is never held back, and
					neither are you.
				</p>

				<form method="POST" action="?/setDripMode" class="mt-3 flex items-center gap-2" use:enhance>
					<Label class="sr-only" for="drip-mode">Release schedule</Label>
					<Select id="drip-mode" name="mode">
						{#each dripModes as mode (mode.value)}
							<option value={mode.value} selected={mode.value === data.course.drip_mode}>
								{mode.label}
							</option>
						{/each}
					</Select>
					<Button type="submit" variant="secondary" size="sm">Save</Button>
				</form>

				<p class="text-muted mt-2 text-xs">{dripHint}</p>
			</div>

			<div>
				<h2 class="font-medium">Prerequisites</h2>
				<p class="text-muted mt-1 text-sm">
					Courses a learner must finish before they may enrol on this one. An administrator granting
					an enrolment overrides them.
				</p>

				{#if data.prerequisites.length === 0}
					<p class="text-muted mt-3 text-sm">None. Anyone may enrol.</p>
				{:else}
					<ul class="mt-3 space-y-2">
						{#each data.prerequisites as prerequisite (prerequisite.id)}
							<li
								class="flex items-center justify-between gap-3 border-t border-border pt-2 text-sm"
							>
								<span>
									{prerequisite.title}
									{#if prerequisite.status !== 'published'}
										<Badge tone="neutral" class="ml-2">{prerequisite.status}</Badge>
									{/if}
								</span>
								<form method="POST" action="?/removePrerequisite" use:enhance>
									<input type="hidden" name="requires_slug" value={prerequisite.slug} />
									<Button type="submit" variant="ghost" size="sm">Remove</Button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}

				{#if data.candidates.length > 0}
					<form
						method="POST"
						action="?/addPrerequisite"
						class="mt-4 flex items-center gap-2"
						use:enhance
					>
						<Label class="sr-only" for="requires-slug">Course to require</Label>
						<Select id="requires-slug" name="requires_slug">
							{#each data.candidates as candidate (candidate.id)}
								<option value={candidate.slug}>{candidate.title}</option>
							{/each}
						</Select>
						<Button type="submit" variant="secondary" size="sm">Require</Button>
					</form>
				{:else}
					<p class="text-muted mt-4 text-sm">
						There is no other course in this workspace to require.
					</p>
				{/if}
			</div>

			<div class="border-t border-border pt-6">
				<h2 class="font-medium">Certificate</h2>
				<p class="text-muted mt-1 text-sm">
					The words a learner's certificate carries when they finish. Write templates on the
					<a class="underline underline-offset-4" href={resolve('/teach/certificates')}>
						certificate templates
					</a> page.
				</p>

				<form
					method="POST"
					action="?/setCertificateTemplate"
					use:enhance
					class="mt-3 flex items-end gap-2"
				>
					<div class="min-w-0 flex-1">
						<Label class="sr-only" for="cert-template">Certificate template</Label>
						<Select id="cert-template" name="template_id" value={currentTemplateId}>
							{#each data.certificateTemplates as template (template.id ?? 'builtin')}
								<option value={template.id ?? ''}>
									{template.name}{template.builtin ? ' (built in)' : ''}
								</option>
							{/each}
						</Select>
					</div>
					<Button type="submit" variant="secondary" size="sm">Apply</Button>
				</form>
			</div>
		</Card>
	</section>

	<!-- ----------------------------------------------------- announcements -->
	<section class="mt-8 max-w-3xl">
		<h2 class="text-sm font-medium tracking-wide uppercase">Announcements</h2>
		<p class="text-muted mt-1 text-sm">
			Notices your learners see at the top of the course page. The newest is first.
		</p>

		{#if form?.announcementMessage}
			<Alert tone="danger" class="mt-4" role="alert">{form.announcementMessage}</Alert>
		{/if}

		<form method="POST" action="?/postAnnouncement" use:enhance class="mt-4">
			<Sheet>
				<div class="space-y-4">
					<Field id="announcement-title" label="Title">
						{#snippet children({ id, invalid })}
							<Input {id} {invalid} name="title" required maxlength={200} />
						{/snippet}
					</Field>

					<Field id="announcement-body" label="Message">
						{#snippet children({ id, invalid })}
							<Textarea {id} {invalid} name="body" rows={4} required maxlength={5000} />
						{/snippet}
					</Field>
				</div>

				{#snippet footer()}
					<Button type="submit">Post announcement</Button>
				{/snippet}
			</Sheet>
		</form>

		{#if data.announcements.length > 0}
			<ul class="mt-6 space-y-3">
				{#each data.announcements as announcement (announcement.id)}
					<li>
						<Card class="p-4">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="font-medium text-pretty">{announcement.title}</p>
									<p class="text-muted numeral mt-0.5 text-xs">
										{announcementDate.format(new Date(announcement.created_at))}
									</p>
								</div>

								<form method="POST" action="?/deleteAnnouncement" use:enhance>
									<input type="hidden" name="id" value={announcement.id} />
									<Button type="submit" variant="ghost" size="sm">Remove</Button>
								</form>
							</div>
							<p class="text-muted mt-2 text-sm whitespace-pre-wrap">{announcement.body}</p>
						</Card>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if topics.length === 0}
		<p class="text-muted mt-10 text-sm">
			This course has no sections yet. A course needs at least one lesson before it can be
			published.
		</p>
	{/if}

	<!--
		Sections and their lessons reorder by dragging the grip; only the handle
		starts a drag, so the rename field and every button stay usable. The order
		you drop is the order that is sent — the whole list at once, which is what
		muallim-api wants.
	-->
	<ol class="mt-8 space-y-6">
		{#each topics as topic, topicIndex (topic.id)}
			<li animate:flip={{ duration: DURATION.base, easing: easeInOut }}>
				<Card class="p-5">
					<!--
						The section's drag zone is its header row, not the whole card. A card
						contains its lessons, and a lesson's own drop would be swallowed by the
						section's if the section were the outer drop target — so they do not
						nest: sections reorder by their header, lessons by their row.
					-->
					<div
						use:draggable={{
							container: `topic-${topicIndex}`,
							dragData: topic,
							handle: '.topic-handle'
						}}
						use:droppable={{
							container: `topic-${topicIndex}`,
							callbacks: { onDrop: handleTopicDrop }
						}}
						class="flex flex-wrap items-center justify-between gap-3"
					>
						<div class="flex items-center gap-2">
							<button
								type="button"
								class="topic-handle text-muted hover:text-text focus-visible:ring-ring cursor-grab rounded-control p-1 focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
								aria-label="Reorder section {topic.title}. Drag, or use the arrow keys."
								aria-keyshortcuts="ArrowUp ArrowDown"
								onkeydown={(event) => {
									if (event.key === 'ArrowUp') {
										event.preventDefault();
										nudgeTopic(topicIndex, -1);
									} else if (event.key === 'ArrowDown') {
										event.preventDefault();
										nudgeTopic(topicIndex, 1);
									}
								}}
							>
								<Icon icon={DragDropVerticalIcon} class="size-5" />
							</button>

							<form
								method="POST"
								action="?/renameTopic"
								class="flex items-center gap-2"
								use:enhance
							>
								<input type="hidden" name="id" value={topic.id} />
								<Label class="sr-only" for="topic-{topic.id}">Section title</Label>
								<Input id="topic-{topic.id}" name="title" value={topic.title} class="w-64" />
								<Button type="submit" variant="secondary" size="sm">Rename</Button>
							</form>
						</div>

						<form method="POST" action="?/deleteTopic" use:enhance>
							<input type="hidden" name="id" value={topic.id} />
							<Button type="submit" variant="ghost" size="sm">Delete</Button>
						</form>
					</div>

					<ul class="mt-4">
						{#each topic.lessons as lesson, lessonIndex (lesson.id)}
							<li
								animate:flip={{ duration: DURATION.base, easing: easeInOut }}
								use:draggable={{
									container: `lesson-${topicIndex}-${lessonIndex}`,
									dragData: lesson,
									handle: '.lesson-handle'
								}}
								use:droppable={{
									container: `lesson-${topicIndex}-${lessonIndex}`,
									callbacks: { onDrop: (state) => handleLessonDrop(topic.id, state) }
								}}
								class="flex flex-wrap items-center justify-between gap-3 border-t border-border py-2 text-sm"
							>
								<div class="flex min-w-0 items-center gap-2">
									<button
										type="button"
										class="lesson-handle text-muted hover:text-text focus-visible:ring-ring cursor-grab rounded-control p-1 focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
										aria-label="Reorder lesson {lesson.title}. Drag, or use the arrow keys."
										aria-keyshortcuts="ArrowUp ArrowDown"
										onkeydown={(event) => {
											if (event.key === 'ArrowUp') {
												event.preventDefault();
												nudgeLesson(topic.id, lessonIndex, -1);
											} else if (event.key === 'ArrowDown') {
												event.preventDefault();
												nudgeLesson(topic.id, lessonIndex, 1);
											}
										}}
									>
										<Icon icon={DragDropVerticalIcon} class="size-4" />
									</button>
									<a
										class="truncate underline-offset-4 hover:underline"
										href={resolve(`/teach/${data.course.slug}/lessons/${lesson.id}`)}
									>
										{lesson.title}
									</a>
								</div>

								<div class="flex items-center gap-1">
									<span class="text-muted mr-2 text-xs capitalize">{lesson.content_type}</span>

									<form method="POST" action="?/togglePreview" use:enhance>
										<input type="hidden" name="id" value={lesson.id} />
										<input type="hidden" name="is_preview" value={String(!lesson.is_preview)} />
										<Button
											type="submit"
											variant={lesson.is_preview ? 'secondary' : 'ghost'}
											size="sm"
										>
											{lesson.is_preview ? 'Preview' : 'Make preview'}
										</Button>
									</form>

									<form method="POST" action="?/deleteLesson" use:enhance>
										<input type="hidden" name="id" value={lesson.id} />
										<Button type="submit" variant="ghost" size="sm">Delete</Button>
									</form>
								</div>
							</li>
						{/each}
					</ul>

					<form method="POST" action="?/addLesson" class="mt-4 flex items-center gap-2" use:enhance>
						<input type="hidden" name="topic_id" value={topic.id} />
						<Label class="sr-only" for="lesson-title-{topic.id}">New lesson title</Label>
						<Input
							id="lesson-title-{topic.id}"
							name="title"
							placeholder="New lesson"
							class="w-64"
							required
						/>
						<Button type="submit" variant="secondary" size="sm">Add lesson</Button>
					</form>
				</Card>
			</li>
		{/each}
	</ol>

	<form method="POST" action="?/addTopic" class="mt-8 flex items-center gap-2" use:enhance>
		<Label class="sr-only" for="new-topic">New section title</Label>
		<Input id="new-topic" name="title" placeholder="New section" class="w-64" required />
		<Button type="submit">Add section</Button>
	</form>

	{#if data.aiEnabled}
		<div class="mt-8">
			<AiOutline enabled={data.aiEnabled} courseTitle={data.course.title} />
		</div>
	{/if}
</Page>

<style>
	/*
		The drag's own look. The package ships a stylesheet its exports do not let us
		import, and its defaults are loud — a hard blue line, a dashed green box — so
		the feedback is drawn here instead, in the accent, quietly.
	*/

	/* The row being carried: lifted out of the flow, not just faded. */
	:global(.dragging),
	:global(.svelte-dnd-dragging) {
		opacity: 0.4;
	}

	/* No dashed outline around the drop zone; the insertion line says enough. */
	:global(.svelte-dnd-drop-target),
	:global(.svelte-dnd-invalid-target) {
		outline: none;
	}

	/* A thin, rounded accent line where the row will land — the one indicator, in
	   the brand colour rather than a raw blue, drawn on a pseudo-element so it adds
	   no layout. */
	:global(.drop-before),
	:global(.drop-after) {
		position: relative;
	}
	:global(.drop-before)::before,
	:global(.drop-after)::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		border-radius: 999px;
		background-color: var(--accent);
		z-index: 10;
		pointer-events: none;
	}
	:global(.drop-before)::before {
		top: -1px;
	}
	:global(.drop-after)::after {
		bottom: -1px;
	}
</style>
