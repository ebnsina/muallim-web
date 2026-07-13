<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import { DURATION, easeInOut, easeOut } from '$lib/motion';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import {
		Analytics01Icon,
		ArrowDown01Icon,
		StarIcon,
		ArrowUp01Icon,
		Cancel01Icon,
		CheckmarkCircle02Icon,
		Delete02Icon,
		DragDropVerticalIcon,
		FloppyDiskIcon,
		Megaphone01Icon,
		PencilEdit02Icon,
		PlusSignIcon,
		SentIcon,
		Settings02Icon,
		Tick02Icon,
		TaskDone01Icon,
		ViewIcon
	} from '@hugeicons/core-free-icons';
	import type { ActionResult } from '@sveltejs/kit';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		Donut,
		DonutLegend,
		Field,
		Icon,
		Input,
		Label,
		Numeral,
		Page,
		PageHeader,
		Progress,
		Select,
		Sheet,
		Stars,
		Textarea
	} from '$lib/components';
	import AiOutline from '$lib/components/AiOutline.svelte';
	import {
		LIMITS,
		announcementSchema,
		lessonSchema,
		prerequisiteSchema,
		previewSchema,
		renameSectionSchema,
		sectionSchema
	} from '$lib/schemas';
	import { validated, type FieldErrors } from '$lib/validation';
	import { Pill } from '$lib/pill.svelte';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	/*
		Every section carries a rename box and an "add a lesson" box, so an error has to
		name both the form it came from and the section it came from — otherwise one bad
		title would mark every box on the page. One bag of field errors per form, keyed
		by scope and section; the action keys its own fails the same way.
	*/
	let errors = $state<Record<string, FieldErrors>>({});

	const bag = (scope: string, topicId?: string) => (topicId ? `${scope}:${topicId}` : scope);

	const setErrors = (scope: string, topicId?: string) => (next: FieldErrors) => {
		errors = { ...errors, [bag(scope, topicId)]: next };
	};

	const problem = (scope: string, field: string, topicId?: string) => {
		const server =
			form?.scope === scope && (form?.topicId ?? undefined) === topicId
				? form?.errors?.[field]
				: undefined;

		return errors[bag(scope, topicId)]?.[field] ?? server;
	};

	const renameError = (topicId: string) => problem('rename', 'title', topicId);
	const addLessonError = (topicId: string) => problem('addLesson', 'title', topicId);

	/*
		Four tools, one at a time.

		This page was all four stacked: a settings form, an announcement composer, the
		analytics, and the curriculum — the curriculum last, 1,800 pixels down, which is
		the one thing an author actually came to do. They are not steps in a task and
		they do not inform each other; they are four separate jobs that happen to be
		about the same course. So they are four tabs, and the curriculum is the page.

		The state is local, not in the URL. Every write here goes through `use:enhance`,
		which updates the data without navigating — so the tab a person is working in
		survives their own edits, which is the only thing it has to survive.
	*/
	type Tool = 'curriculum' | 'announcements' | 'insights' | 'settings';

	const TOOLS = $derived([
		{
			id: 'curriculum' as const,
			label: 'Curriculum',
			icon: TaskDone01Icon,
			count: data.lessonCount
		},
		{
			id: 'announcements' as const,
			label: 'Announcements',
			icon: Megaphone01Icon,
			count: data.announcements.length
		},
		{ id: 'insights' as const, label: 'Insights', icon: Analytics01Icon, count: 0 },
		{ id: 'settings' as const, label: 'Settings', icon: Settings02Icon, count: 0 }
	]);

	let tool = $state<Tool>('curriculum');

	const pill = new Pill();
	$effect(() => {
		pill.measure(tool);
	});
	$effect(() => {
		document.fonts?.ready.then(() => pill.measure(tool));
	});

	function moveTool(event: KeyboardEvent, current: Tool) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();

		const order = TOOLS.map((t) => t.id);
		const step = event.key === 'ArrowRight' ? 1 : -1;
		const next = order[(order.indexOf(current) + step + order.length) % order.length];

		tool = next;
		document.getElementById(`tool-${next}`)?.focus();
	}

	// The composer is closed until it is wanted. An empty form at the top of a list of
	// notices is a form that pushes the notices off the screen for nothing.
	let composing = $state(false);

	const PREVIEW_SOURCES = [
		{ value: 'none', label: 'No preview' },
		{ value: 'youtube', label: 'YouTube' },
		{ value: 'vimeo', label: 'Vimeo' },
		{ value: 'embed', label: 'Embed' },
		{ value: 'hosted', label: 'Hosted' }
	];

	// The select drives which fields are shown, so its value is state.
	// The author's choice while they are choosing, the saved one after that. A plain
	// `$state` seeded from `data` would keep the old value when the save reloads it.
	let sourceOverride = $state<string | null>(null);
	const previewSource = $derived(sourceOverride ?? data.course.preview_source ?? 'none');

	const announcementDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	// Which slice the pointer or keyboard is on. The donut and its legend share this
	// one value, which is what links their highlighting.
	let hovered = $state<string | null>(null);

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
		none: 'Every lesson is available as soon as a learner enrolls.',
		scheduled: 'Each lesson opens at its own date and time, the same for everybody.',
		after_enrolment: "Each lesson opens a number of days after each learner's own enrollment.",
		sequential: 'A lesson opens when the learner has finished every lesson before it.'
	};

	const dripHint = $derived(hints[data.course.drip_mode] ?? '');
</script>

<svelte:head><title>{data.course.title} — Teach</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title={data.course.title}>
		{#snippet actions()}
			<!-- The first thing an author wants after an edit is to see what a learner sees. -->
			<Button href={resolve(`/courses/${data.course.slug}`)} variant="secondary" size="sm">
				<Icon icon={ViewIcon} class="size-4" />
				View as learner
			</Button>
			<Button href={resolve(`/teach/${data.course.slug}/gradebook`)} variant="secondary" size="sm">
				<Icon icon={TaskDone01Icon} class="size-4" />
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

	<!-- ------------------------------------------------------------------ tools -->
	<div class="mt-8">
		<div
			bind:this={pill.track}
			role="tablist"
			aria-label="Course tools"
			class="squircle relative inline-flex gap-1 bg-surface-sunken p-1"
		>
			<span
				aria-hidden="true"
				class={cn(
					'squircle-sm pointer-events-none absolute inset-y-1 left-0 bg-accent',
					'transition-[transform,width,opacity] duration-260 ease-out',
					pill.pos.measured ? 'opacity-100' : 'opacity-0'
				)}
				style={pill.style}
			></span>

			{#each TOOLS as t (t.id)}
				{@const active = tool === t.id}
				<button
					bind:this={pill.items[t.id]}
					type="button"
					role="tab"
					id="tool-{t.id}"
					aria-selected={active}
					aria-controls="panel-{t.id}"
					tabindex={active ? 0 : -1}
					class={cn(
						'squircle-sm relative z-10 flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
						active ? 'text-on-solid' : 'text-muted hover:text-text',
						active && !pill.pos.measured && 'bg-accent'
					)}
					onclick={() => (tool = t.id)}
					onkeydown={(event) => moveTool(event, t.id)}
				>
					<Icon icon={t.icon} class="size-4" />
					{t.label}

					{#if t.count > 0}
						<span
							class={cn(
								'numeral rounded-md px-1.5 text-xs',
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

	<!-- ============================================================ curriculum -->
	{#if tool === 'curriculum'}
		<div id="panel-curriculum" role="tabpanel" aria-labelledby="tool-curriculum" tabindex="-1">
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
						<Card float class="p-5">
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

									<!--
										The grip, and two buttons that do the same thing without it.

										A drag is a gesture: it wants a pointer, a steady hand, and a browser that
										agrees about what a drop is. Moving a section one place up is not a gesture,
										it is a decision — so it is a button too, which works on a phone, on a
										trackpad that fights you, and for anybody who cannot drag at all.
									-->
									<div class="flex flex-col">
										<button
											type="button"
											class="text-muted hover:text-text focus-visible:ring-ring rounded-control px-1 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30"
											disabled={topicIndex === 0}
											title="Move section up"
											aria-label="Move section {topic.title} up"
											onclick={() => nudgeTopic(topicIndex, -1)}
										>
											<Icon icon={ArrowUp01Icon} class="size-4" />
										</button>
										<button
											type="button"
											class="text-muted hover:text-text focus-visible:ring-ring rounded-control px-1 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30"
											disabled={topicIndex === topics.length - 1}
											title="Move section down"
											aria-label="Move section {topic.title} down"
											onclick={() => nudgeTopic(topicIndex, 1)}
										>
											<Icon icon={ArrowDown01Icon} class="size-4" />
										</button>
									</div>

									<!-- A row, not a `Field`: the button beside the box is the box's height, and
									     only this layout keeps it there. -->
									<form
										method="POST"
										action="?/renameTopic"
										use:enhance={validated(renameSectionSchema, setErrors('rename', topic.id))}
									>
										<input type="hidden" name="id" value={topic.id} />
										<div class="flex items-center gap-2">
											<Label class="sr-only" for="topic-{topic.id}">Section title</Label>
											<Input
												id="topic-{topic.id}"
												name="title"
												value={topic.title}
												class="w-64"
												{...LIMITS.sectionTitle}
												invalid={Boolean(renameError(topic.id))}
												aria-describedby={renameError(topic.id)
													? `topic-${topic.id}-error`
													: undefined}
											/>
											<Button type="submit" variant="secondary">
												<Icon icon={PencilEdit02Icon} class="size-4" />
												Rename
											</Button>
										</div>

										{#if renameError(topic.id)}
											<p
												id="topic-{topic.id}-error"
												class="text-danger-text mt-2 text-xs font-medium"
												role="alert"
											>
												{renameError(topic.id)}
											</p>
										{/if}
									</form>
								</div>

								<form method="POST" action="?/deleteTopic" use:enhance>
									<input type="hidden" name="id" value={topic.id} />
									<Button type="submit" variant="ghost" size="sm">
										<Icon icon={Delete02Icon} class="size-4" />
										Delete
									</Button>
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

											<div class="flex flex-col">
												<button
													type="button"
													class="text-muted hover:text-text focus-visible:ring-ring rounded-control px-1 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30"
													disabled={lessonIndex === 0}
													title="Move lesson up"
													aria-label="Move lesson {lesson.title} up"
													onclick={() => nudgeLesson(topic.id, lessonIndex, -1)}
												>
													<Icon icon={ArrowUp01Icon} class="size-3.5" />
												</button>
												<button
													type="button"
													class="text-muted hover:text-text focus-visible:ring-ring rounded-control px-1 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30"
													disabled={lessonIndex === topic.lessons.length - 1}
													title="Move lesson down"
													aria-label="Move lesson {lesson.title} down"
													onclick={() => nudgeLesson(topic.id, lessonIndex, 1)}
												>
													<Icon icon={ArrowDown01Icon} class="size-3.5" />
												</button>
											</div>
											<a
												class="underline-grow truncate"
												href={resolve(`/teach/${data.course.slug}/lessons/${lesson.id}`)}
											>
												{lesson.title}
											</a>
										</div>

										<!--
											Icons, not sentences. Twelve lessons × "Make preview" + "Delete" is
											two dozen words of chrome down the one list an author came to read; the
											label moves into the tooltip and the accessible name, where it is still
											said to everyone who needs it said.
										-->
										<div class="flex shrink-0 items-center gap-1">
											<Badge tone="neutral" class="mr-1 capitalize">{lesson.content_type}</Badge>

											{#if lesson.is_preview}
												<Badge tone="accent" icon={ViewIcon}>Preview</Badge>
											{/if}

											<form method="POST" action="?/togglePreview" use:enhance>
												<input type="hidden" name="id" value={lesson.id} />
												<input type="hidden" name="is_preview" value={String(!lesson.is_preview)} />
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													class="px-2"
													title={lesson.is_preview
														? 'Stop offering as a free preview'
														: 'Offer as a free preview'}
													aria-label={lesson.is_preview
														? `Stop offering ${lesson.title} as a free preview`
														: `Offer ${lesson.title} as a free preview`}
												>
													<Icon icon={ViewIcon} class="size-4" />
												</Button>
											</form>

											<form method="POST" action="?/deleteLesson" use:enhance>
												<input type="hidden" name="id" value={lesson.id} />
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													class="px-2"
													title="Delete lesson"
													aria-label="Delete {lesson.title}"
												>
													<Icon icon={Delete02Icon} class="size-4" />
												</Button>
											</form>
										</div>
									</li>
								{/each}
							</ul>

							<form
								method="POST"
								action="?/addLesson"
								class="mt-4"
								use:enhance={validated(lessonSchema, setErrors('addLesson', topic.id))}
							>
								<input type="hidden" name="topic_id" value={topic.id} />
								<div class="flex items-center gap-2">
									<Label class="sr-only" for="lesson-title-{topic.id}">New lesson title</Label>
									<Input
										id="lesson-title-{topic.id}"
										name="title"
										placeholder="New lesson"
										class="w-64"
										{...LIMITS.lessonTitle}
										invalid={Boolean(addLessonError(topic.id))}
										aria-describedby={addLessonError(topic.id)
											? `lesson-title-${topic.id}-error`
											: undefined}
									/>
									<Button type="submit" variant="secondary">
										<Icon icon={PlusSignIcon} class="size-4" />
										Add lesson
									</Button>
								</div>

								{#if addLessonError(topic.id)}
									<p
										id="lesson-title-{topic.id}-error"
										class="text-danger-text mt-2 text-xs font-medium"
										role="alert"
									>
										{addLessonError(topic.id)}
									</p>
								{/if}
							</form>
						</Card>
					</li>
				{/each}
			</ol>

			<form
				method="POST"
				action="?/addTopic"
				class="mt-8"
				use:enhance={validated(sectionSchema, setErrors('addTopic'))}
			>
				<div class="flex items-center gap-2">
					<Label class="sr-only" for="new-topic">New section title</Label>
					<Input
						id="new-topic"
						name="title"
						placeholder="New section"
						class="w-64"
						{...LIMITS.sectionTitle}
						invalid={Boolean(problem('addTopic', 'title'))}
						aria-describedby={problem('addTopic', 'title') ? 'new-topic-error' : undefined}
					/>
					<Button type="submit">
						<Icon icon={PlusSignIcon} class="size-4" />
						Add section
					</Button>
				</div>

				{#if problem('addTopic', 'title')}
					<p id="new-topic-error" class="text-danger-text mt-2 text-xs font-medium" role="alert">
						{problem('addTopic', 'title')}
					</p>
				{/if}
			</form>

			{#if data.aiEnabled}
				<div class="mt-8">
					<AiOutline enabled={data.aiEnabled} courseTitle={data.course.title} />
				</div>
			{/if}
		</div>
	{/if}

	<!-- ============================================================ announcements -->
	{#if tool === 'announcements'}
		<div
			id="panel-announcements"
			role="tabpanel"
			aria-labelledby="tool-announcements"
			tabindex="-1"
		>
			<!-- ----------------------------------------------------- announcements -->
			<section class="mt-8 max-w-3xl">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h2 class="text-lg font-semibold">Announcements</h2>
						<p class="text-muted mt-1 text-sm">
							Notices your learners see at the top of the course page. The newest is first.
						</p>
					</div>

					<Button size="sm" onclick={() => (composing = !composing)}>
						<Icon icon={composing ? Cancel01Icon : PlusSignIcon} class="size-4" />
						{composing ? 'Close' : 'New announcement'}
					</Button>
				</div>

				{#if composing}
					<!-- Closed until it is wanted: an empty form standing above the notices is a
					     form that pushes the notices off the screen for nothing. -->
					<form
						method="POST"
						action="?/postAnnouncement"
						class="mt-4"
						transition:slide={{ duration: DURATION.base, easing: easeOut }}
						use:enhance={validated(announcementSchema, setErrors('announcement'), () => {
							return async ({ update, result }) => {
								await update();
								if (result.type === 'success') composing = false;
							};
						})}
					>
						<Sheet>
							<div class="space-y-4">
								<Field
									id="announcement-title"
									label="Title"
									error={problem('announcement', 'title')}
								>
									{#snippet children({ id, describedBy, invalid })}
										<Input
											{id}
											{invalid}
											name="title"
											{...LIMITS.announcementTitle}
											aria-describedby={describedBy}
										/>
									{/snippet}
								</Field>

								<Field
									id="announcement-body"
									label="Message"
									error={problem('announcement', 'body')}
								>
									{#snippet children({ id, describedBy, invalid })}
										<Textarea
											{id}
											{invalid}
											name="body"
											rows={4}
											{...LIMITS.announcementBody}
											aria-describedby={describedBy}
										/>
									{/snippet}
								</Field>
							</div>

							{#snippet footer()}
								<Button type="submit">
									<Icon icon={SentIcon} class="size-4" />
									Post announcement
								</Button>
							{/snippet}
						</Sheet>
					</form>
				{/if}

				{#if data.announcements.length > 0}
					<ul class="mt-6 space-y-3">
						{#each data.announcements as announcement (announcement.id)}
							<li>
								<!-- Float: a notice already posted is a loose card on the page, not part of
						     the form above it. -->
								<Card float class="p-4">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="font-medium text-pretty">{announcement.title}</p>
											<p class="text-muted numeral mt-0.5 text-xs">
												{announcementDate.format(new Date(announcement.created_at))}
											</p>
										</div>

										<form method="POST" action="?/deleteAnnouncement" use:enhance>
											<input type="hidden" name="id" value={announcement.id} />
											<Button type="submit" variant="ghost" size="sm">
												<Icon icon={Delete02Icon} class="size-4" />
												Remove
											</Button>
										</form>
									</div>
									<p class="text-muted mt-2 text-sm whitespace-pre-wrap">{announcement.body}</p>
								</Card>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>
	{/if}

	<!-- ============================================================ insights -->
	{#if tool === 'insights'}
		<div id="panel-insights" role="tabpanel" aria-labelledby="tool-insights" tabindex="-1">
			<!-- ---------------------------------------------------------- analytics -->
			{#if data.analytics}
				{@const a = data.analytics}
				{@const segments = [
					{ key: 'active', label: 'Active', value: a.active, tone: 'text-chart-1' },
					{ key: 'completed', label: 'Completed', value: a.completed, tone: 'text-chart-2' },
					{ key: 'inactive', label: 'Lapsed', value: a.inactive, tone: 'text-chart-3' }
				]}
				<!--
				The dashboard's own shape, because it is the same statement: a part-to-whole
				on the left, the figures it cannot carry beside it, ruled apart by a dashed
				line. It was a sunken slab with a small-caps heading and no marks on its
				numbers — the one summary in the product that did not look like the others.
			-->
				<section class="mt-8">
					<h2 class="flex items-center gap-2.5 text-lg font-semibold">
						<span
							class="flex size-8 items-center justify-center rounded-control bg-accent-surface text-accent-text"
						>
							<Icon icon={Analytics01Icon} class="size-4.5" strokeWidth={2} />
						</span>
						At a glance
					</h2>

					<Card float class="mt-4 p-5 sm:p-6">
						<div class="grid gap-8 lg:grid-cols-3 lg:gap-0">
							<!--
							The mix is a part-to-whole, so it is drawn as one: three states of an
							enrollment, summing to everybody who ever started. Hovering a slice lights
							its row and hovering a row lights its slice — one bound value, so the two
							cannot disagree about what is highlighted.
						-->
							<div class="flex items-center justify-center gap-6 lg:pr-8">
								<Donut {segments} centreLabel="enrolled" bind:hovered size={140} />

								{#if a.total_enrolments === 0}
									<!-- An empty ring and a zero, not a hidden chart: the shape stays where a
								     reader learned to look for it, and the sentence says why it is empty. -->
									<p class="text-muted min-w-40 text-sm">
										Nobody has enrolled yet. The mix fills in with the first learner.
									</p>
								{:else}
									<div class="min-w-40">
										<DonutLegend {segments} bind:hovered caption="Enrollments by status" />
									</div>
								{/if}
							</div>

							<!--
							The two numbers a donut cannot carry — they are not parts of that whole —
							each with the bar that says what the empty half of it is.
						-->
							<dl
								class="grid content-center gap-6 border-dashed border-border max-lg:border-t max-lg:pt-8 sm:grid-cols-2 lg:grid-cols-1 lg:gap-8 lg:border-l lg:border-r lg:px-8"
							>
								<div class="flex flex-col">
									<dt class="text-muted order-2 mt-1.5 flex items-center gap-2 text-xs">
										<span
											class="flex size-5 items-center justify-center rounded-md bg-success-surface text-success-text"
										>
											<Icon icon={CheckmarkCircle02Icon} class="size-3" strokeWidth={2} />
										</span>
										Completion
									</dt>
									<dd class="order-1">
										<Numeral
											countUp
											value={Math.round(a.completion_rate * 100)}
											suffix="%"
											class="text-success-text text-4xl font-semibold tracking-tight"
										/>
									</dd>
									<dd class="order-3 mt-3">
										<Progress
											value={Math.round(a.completion_rate * 100)}
											tone="completed"
											class="h-1.5"
											label="{Math.round(a.completion_rate * 100)}% of everyone who started"
										/>
									</dd>
								</div>

								<div class="flex flex-col">
									<dt class="text-muted order-2 mt-1.5 flex items-center gap-2 text-xs">
										<span
											class="flex size-5 items-center justify-center rounded-md bg-accent-surface text-accent-text"
										>
											<Icon icon={Analytics01Icon} class="size-3" strokeWidth={2} />
										</span>
										Average progress
									</dt>
									<dd class="order-1">
										<Numeral
											countUp
											value={Math.round(a.average_progress)}
											suffix="%"
											class="text-accent-text text-4xl font-semibold tracking-tight"
										/>
									</dd>
									<dd class="order-3 mt-3">
										<Progress
											value={Math.round(a.average_progress)}
											tone="active"
											class="h-1.5"
											label="{Math.round(a.average_progress)}% across the course"
										/>
									</dd>
								</div>
							</dl>

							<!-- The rating does not roll: it is printed to one decimal, and a roll would
						     have to renumber the place after the point to say the same thing. -->
							<div
								class="flex flex-col justify-center border-dashed border-border max-lg:border-t max-lg:pt-8 lg:pl-8"
							>
								<p class="text-muted flex items-center gap-2 text-xs">
									<span
										class="flex size-5 items-center justify-center rounded-md bg-warning-surface text-warning-text"
									>
										<Icon icon={StarIcon} class="size-3" strokeWidth={2} />
									</span>
									Rating
								</p>

								{#if a.reviews.count > 0}
									<p class="mt-1.5 flex items-baseline gap-2.5">
										<span class="text-warning-text numeral text-4xl font-semibold tracking-tight">
											{a.reviews.average.toFixed(1)}
										</span>
										<Stars value={a.reviews.average} size="sm" />
									</p>
									<p class="text-muted mt-2 text-xs">
										from <span class="numeral">{a.reviews.count}</span>
										{a.reviews.count === 1 ? 'review' : 'reviews'}
									</p>
								{:else}
									<p class="text-muted mt-1.5 text-sm">
										No reviews yet. A learner may leave one once they finish.
									</p>
								{/if}
							</div>
						</div>
					</Card>
				</section>
			{/if}
		</div>
	{/if}

	<!-- ============================================================ settings -->
	{#if tool === 'settings'}
		<div id="panel-settings" role="tabpanel" aria-labelledby="tool-settings" tabindex="-1">
			<section class="mt-8 max-w-3xl">
				<Card float class="space-y-6 p-5">
					<div>
						<h2 class="font-medium">Preview</h2>
						<p class="text-muted mt-1 text-sm">
							The clip a stranger watches before deciding to enroll. Paste the link; muallim-api
							turns it into a player it will vouch for.
						</p>

						<form
							method="POST"
							action="?/setPreview"
							class="mt-3 space-y-3"
							use:enhance={validated(
								previewSchema,
								(next) => (errors = { ...errors, 'preview:': next })
							)}
						>
							<div class="flex flex-wrap items-end gap-2">
								<div>
									<Label class="sr-only" for="preview-source">Preview source</Label>
									<Select
										id="preview-source"
										name="preview_source"
										value={previewSource}
										onchange={(event) => (sourceOverride = event.currentTarget.value)}
									>
										{#each PREVIEW_SOURCES as source (source.value)}
											<option value={source.value}>{source.label}</option>
										{/each}
									</Select>
								</div>

								{#if previewSource !== 'none'}
									<!-- Deliberately not `type="url"`: a hosted clip is a bare id, and the
									     browser would refuse to submit it. The API decides what is valid. -->
									<div
										class="min-w-0 flex-1"
										transition:slide={{ duration: DURATION.base, easing: easeOut }}
									>
										<Label class="sr-only" for="preview-url">
											{previewSource === 'hosted' ? 'Video ID' : 'Video URL'}
										</Label>
										<Input
											id="preview-url"
											name="preview_url"
											value={data.course.preview_url ?? ''}
											placeholder={previewSource === 'hosted'
												? 'The hosted id'
												: 'https://www.youtube.com/watch?v=…'}
											maxlength={2000}
											invalid={Boolean(problem('preview', 'preview_url'))}
										/>
									</div>
								{/if}

								<Button type="submit" variant="secondary">
									<Icon icon={FloppyDiskIcon} class="size-4" />
									Save
								</Button>
							</div>

							{#if problem('preview', 'preview_url')}
								<p class="text-xs font-medium text-danger-text" role="alert">
									{problem('preview', 'preview_url')}
								</p>
							{/if}
						</form>

						{#if data.course.preview_embed_url}
							<p class="text-muted mt-2 text-xs">
								Learners see it at the top of the panel that asks them to enroll.
							</p>
						{/if}
					</div>

					<div class="border-t border-border pt-6">
						<h2 class="font-medium">Release schedule</h2>
						<p class="text-muted mt-1 text-sm">
							How this course hands its lessons to a learner. A free preview is never held back, and
							neither are you.
						</p>

						<form
							method="POST"
							action="?/setDripMode"
							class="mt-3 flex items-center gap-2"
							use:enhance
						>
							<Label class="sr-only" for="drip-mode">Release schedule</Label>
							<Select id="drip-mode" name="mode">
								{#each dripModes as mode (mode.value)}
									<option value={mode.value} selected={mode.value === data.course.drip_mode}>
										{mode.label}
									</option>
								{/each}
							</Select>
							<Button type="submit" variant="secondary">
								<Icon icon={FloppyDiskIcon} class="size-4" />
								Save
							</Button>
						</form>

						<p class="text-muted mt-2 text-xs">{dripHint}</p>
					</div>

					<div>
						<h2 class="font-medium">Prerequisites</h2>
						<p class="text-muted mt-1 text-sm">
							Courses a learner must finish before they may enroll on this one. An administrator
							granting an enrollment overrides them.
						</p>

						{#if data.prerequisites.length === 0}
							<p class="text-muted mt-3 text-sm">None. Anyone may enroll.</p>
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
											<Button type="submit" variant="ghost" size="sm">
												<Icon icon={Delete02Icon} class="size-4" />
												Remove
											</Button>
										</form>
									</li>
								{/each}
							</ul>
						{/if}

						{#if data.candidates.length > 0}
							<form
								method="POST"
								action="?/addPrerequisite"
								class="mt-4"
								use:enhance={validated(prerequisiteSchema, setErrors('prerequisite'))}
							>
								<div class="flex items-center gap-2">
									<Label class="sr-only" for="requires-slug">Course to require</Label>
									<Select
										id="requires-slug"
										name="requires_slug"
										{...LIMITS.prerequisite}
										invalid={Boolean(problem('prerequisite', 'requires_slug'))}
										aria-describedby={problem('prerequisite', 'requires_slug')
											? 'requires-slug-error'
											: undefined}
									>
										{#each data.candidates as candidate (candidate.id)}
											<option value={candidate.slug}>{candidate.title}</option>
										{/each}
									</Select>
									<Button type="submit" variant="secondary">
										<Icon icon={PlusSignIcon} class="size-4" />
										Require
									</Button>
								</div>

								{#if problem('prerequisite', 'requires_slug')}
									<p
										id="requires-slug-error"
										class="text-danger-text mt-2 text-xs font-medium"
										role="alert"
									>
										{problem('prerequisite', 'requires_slug')}
									</p>
								{/if}
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
							<Button type="submit" variant="secondary">
								<Icon icon={Tick02Icon} class="size-4" />
								Apply
							</Button>
						</form>
					</div>
				</Card>
			</section>
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
	   the brand color rather than a raw blue, drawn on a pseudo-element so it adds
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
