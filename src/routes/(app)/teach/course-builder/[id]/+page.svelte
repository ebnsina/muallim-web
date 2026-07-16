<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Add01Icon,
		ArrowDown01Icon,
		ArrowUp01Icon,
		Cancel01Icon,
		Delete02Icon,
		DragDropVerticalIcon,
		Edit02Icon,
		FloppyDiskIcon,
		Layers01Icon
	} from '@hugeicons/core-free-icons';
	import {
		Badge,
		Breadcrumbs,
		Button,
		Card,
		EmptyState,
		Field,
		Icon,
		Input,
		Label,
		Page,
		PageHeader,
		Select,
		Textarea
	} from '$lib/components';
	import {
		addLesson,
		addModule,
		KIND_META,
		LESSON_KINDS,
		lessonCount,
		moveLessonAcross,
		moveLessonBy,
		moveModule,
		moveModuleBy,
		newLesson,
		removeLesson,
		removeModule,
		renameModule,
		updateLesson,
		type LessonKind,
		type Structure
	} from '$lib/coursebuild';
	import { draggable, dropzone, type DropDetail } from '$lib/dnd';
	import { BLUEPRINT_LIMITS } from '$lib/coursebuild';
	import { toast } from '$lib/toast.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The initial capture is the point: this page is loaded fresh per blueprint id,
	// and the editor owns the working copy from here on. `untrack` says so.
	let name = $state(untrack(() => data.blueprint.name));
	let description = $state(untrack(() => data.blueprint.description));
	let structure = $state<Structure>(untrack(() => data.blueprint.structure));
	let saving = $state(false);

	// The design as sent to the API, and the copy last saved. Their difference is
	// the whole of "unsaved changes" — no per-field dirty flags to keep in step.
	const liveSnapshot = $derived(JSON.stringify({ name, description, structure }));
	let savedSnapshot = $state(untrack(() => liveSnapshot));
	const dirty = $derived(liveSnapshot !== savedSnapshot);

	const crumbs = [
		{ label: 'Teach', href: resolve('/teach') },
		{ label: 'Course Builder', href: resolve('/teach/course-builder') },
		{ label: untrack(() => data.blueprint.name) }
	];

	// One inline editor at a time — adding a new lesson or editing an existing one.
	interface Editor {
		moduleId: string;
		lessonId: string | null;
		title: string;
		kind: LessonKind;
		notes: string;
	}
	let editor = $state<Editor | null>(null);

	function openAdd(moduleId: string) {
		editor = { moduleId, lessonId: null, title: '', kind: 'video', notes: '' };
	}
	function openEdit(moduleId: string, lessonId: string) {
		const lesson = structure.find((m) => m.id === moduleId)?.lessons.find((l) => l.id === lessonId);
		if (lesson) {
			editor = { moduleId, lessonId, title: lesson.title, kind: lesson.kind, notes: lesson.notes };
		}
	}
	function commitEditor() {
		if (!editor) return;
		const title = editor.title.trim();
		if (!title) {
			toast.warning('Give the lesson a title.');
			return;
		}
		if (editor.lessonId) {
			structure = updateLesson(structure, editor.moduleId, editor.lessonId, {
				title,
				kind: editor.kind,
				notes: editor.notes.trim()
			});
		} else {
			structure = addLesson(
				structure,
				editor.moduleId,
				newLesson(title, editor.kind, editor.notes)
			);
		}
		editor = null;
	}

	function addModuleAtEnd() {
		structure = addModule(structure, `Module ${structure.length + 1}`);
	}
	function deleteModule(moduleId: string, title: string) {
		if (
			structure.find((m) => m.id === moduleId)?.lessons.length &&
			!confirm(`Delete “${title || 'Untitled module'}” and its lessons?`)
		)
			return;
		if (editor?.moduleId === moduleId) editor = null;
		structure = removeModule(structure, moduleId);
	}

	// --- Drag drops. The action reports what landed where; these apply it.
	function onModuleDrop(detail: DropDetail) {
		const from = structure.findIndex((m) => m.id === detail.id);
		if (from !== -1) structure = moveModule(structure, from, detail.toIndex);
	}
	function onLessonDrop(toModuleId: string, detail: DropDetail) {
		if (!detail.fromZone.startsWith('lessons:')) return;
		const fromModuleId = detail.fromZone.slice('lessons:'.length);
		structure = moveLessonAcross(structure, fromModuleId, detail.id, toModuleId, detail.toIndex);
	}

	const total = $derived(lessonCount(structure));

	$effect(() => {
		if (form?.message) toast.danger(form.message);
	});
</script>

<svelte:head><title>{name} — Course Builder — Muallim</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			saving = true;
			const submitted = liveSnapshot;
			return async ({ update, result }) => {
				await update({ reset: false });
				saving = false;
				if (result.type === 'success') {
					savedSnapshot = submitted;
					toast.success('Course plan saved.');
				}
			};
		}}
	>
		<!-- The whole design travels in these three fields. -->
		<input type="hidden" name="name" value={name} />
		<input type="hidden" name="description" value={description} />
		<input type="hidden" name="structure" value={JSON.stringify(structure)} />

		<PageHeader class="mt-4" title="Course Builder">
			{#snippet meta()}
				<Badge tone="neutral" icon={Layers01Icon}>{structure.length} modules</Badge>
				<span class="text-muted">{total} {total === 1 ? 'lesson' : 'lessons'}</span>
				{#if dirty}
					<Badge tone="warning">Unsaved changes</Badge>
				{:else}
					<span class="text-muted">All changes saved</span>
				{/if}
			{/snippet}
			{#snippet actions()}
				<Button type="submit" loading={saving} disabled={!dirty && !saving}>
					<Icon icon={FloppyDiskIcon} />
					Save blueprint
				</Button>
			{/snippet}
		</PageHeader>

		<!-- Blueprint details -->
		<Card class="mt-6 p-5 sm:p-6">
			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="bp-name" label="Plan name">
					{#snippet children({ id })}
						<Input {id} bind:value={name} maxlength={BLUEPRINT_LIMITS.name.maxlength} required />
					{/snippet}
				</Field>
				<Field id="bp-desc" label="Description" hint="Optional.">
					{#snippet children({ id })}
						<Input
							{id}
							bind:value={description}
							maxlength={BLUEPRINT_LIMITS.description.maxlength}
							placeholder="What this course covers"
						/>
					{/snippet}
				</Field>
			</div>
		</Card>

		<!-- Modules -->
		<div class="mt-8 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold">Modules</h2>
				<p class="mt-1 text-sm text-muted">
					Drag the handle to reorder modules. Lessons drag within a module and across modules.
				</p>
			</div>
			<Button type="button" variant="secondary" size="sm" onclick={addModuleAtEnd}>
				<Icon icon={Add01Icon} />
				Add module
			</Button>
		</div>

		{#if structure.length === 0}
			<div class="mt-4">
				<EmptyState
					icon={Layers01Icon}
					title="No modules yet"
					description="Add a module, then fill it with lessons."
				>
					{#snippet action()}
						<Button type="button" size="sm" onclick={addModuleAtEnd}>
							<Icon icon={Add01Icon} />
							Add module
						</Button>
					{/snippet}
				</EmptyState>
			</div>
		{:else}
			<ul class="mt-4 space-y-4" use:dropzone={{ zone: 'modules', onDrop: onModuleDrop }}>
				{#each structure as mod, mi (mod.id)}
					<li data-dnd-item class="transition-opacity data-[dragging=true]:opacity-40">
						<Card elevation="raised" class="overflow-hidden">
							<!-- Module header -->
							<div
								class="flex items-center gap-2 border-b border-border bg-surface-sunken/40 px-3 py-2.5"
							>
								<button
									type="button"
									use:draggable={{ zone: 'modules', id: mod.id, group: 'module' }}
									class="cursor-grab touch-none rounded-control p-1 text-muted hover:bg-surface-hover active:cursor-grabbing"
									aria-label="Drag to reorder module"
									title="Drag to reorder"
								>
									<Icon icon={DragDropVerticalIcon} class="size-5" />
								</button>

								<input
									value={mod.title}
									oninput={(e) =>
										(structure = renameModule(structure, mod.id, e.currentTarget.value))}
									placeholder="Module title"
									aria-label="Module title"
									class="min-w-0 flex-1 rounded-control border border-transparent bg-transparent px-2 py-1 text-base font-semibold hover:border-border-control focus-visible:border-border-control focus-visible:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
								/>

								<span class="shrink-0 text-xs text-muted">{mod.lessons.length}</span>

								<div class="flex shrink-0 items-center">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										aria-label="Move module up"
										disabled={mi === 0}
										onclick={() => (structure = moveModuleBy(structure, mod.id, -1))}
									>
										<Icon icon={ArrowUp01Icon} />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										aria-label="Move module down"
										disabled={mi === structure.length - 1}
										onclick={() => (structure = moveModuleBy(structure, mod.id, 1))}
									>
										<Icon icon={ArrowDown01Icon} />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										aria-label="Delete module"
										onclick={() => deleteModule(mod.id, mod.title)}
									>
										<Icon icon={Delete02Icon} class="text-danger-text" />
									</Button>
								</div>
							</div>

							<!-- Lessons -->
							<ul
								class="min-h-4 space-y-2 p-3 data-[dropping=true]:bg-accent-surface/40"
								use:dropzone={{
									zone: `lessons:${mod.id}`,
									group: 'lesson',
									onDrop: (d) => onLessonDrop(mod.id, d)
								}}
							>
								{#each mod.lessons as lesson, li (lesson.id)}
									{@const meta = KIND_META[lesson.kind]}
									<li
										data-dnd-item
										class="flex items-center gap-2 rounded-control border border-border bg-surface-raised px-2 py-2 transition-opacity data-[dragging=true]:opacity-40"
									>
										<button
											type="button"
											use:draggable={{ zone: `lessons:${mod.id}`, id: lesson.id, group: 'lesson' }}
											class="cursor-grab touch-none rounded-control p-1 text-muted hover:bg-surface-hover active:cursor-grabbing"
											aria-label="Drag to reorder lesson"
											title="Drag to reorder"
										>
											<Icon icon={DragDropVerticalIcon} class="size-4" />
										</button>

										<Icon icon={meta.icon} class="size-4 shrink-0 text-muted" />

										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium">
												{lesson.title || 'Untitled lesson'}
											</p>
											{#if lesson.notes}
												<p class="truncate text-xs text-muted">{lesson.notes}</p>
											{/if}
										</div>

										<Badge tone={meta.tone}>{meta.label}</Badge>

										<div class="flex shrink-0 items-center">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												aria-label="Move lesson up"
												disabled={li === 0}
												onclick={() => (structure = moveLessonBy(structure, mod.id, lesson.id, -1))}
											>
												<Icon icon={ArrowUp01Icon} />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												aria-label="Move lesson down"
												disabled={li === mod.lessons.length - 1}
												onclick={() => (structure = moveLessonBy(structure, mod.id, lesson.id, 1))}
											>
												<Icon icon={ArrowDown01Icon} />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												aria-label="Edit lesson"
												onclick={() => openEdit(mod.id, lesson.id)}
											>
												<Icon icon={Edit02Icon} />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												aria-label="Delete lesson"
												onclick={() => (structure = removeLesson(structure, mod.id, lesson.id))}
											>
												<Icon icon={Delete02Icon} class="text-danger-text" />
											</Button>
										</div>
									</li>
								{/each}

								<!-- Inline lesson editor, for this module -->
								{#if editor && editor.moduleId === mod.id}
									<li class="rounded-control border border-accent-border bg-accent-surface/40 p-3">
										<div class="grid gap-3 sm:grid-cols-[1fr_10rem]">
											<div class="space-y-1">
												<Label for="ed-title">Lesson title</Label>
												<Input
													id="ed-title"
													bind:value={editor.title}
													placeholder="e.g. Introduction"
													onkeydown={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															commitEditor();
														}
													}}
												/>
											</div>
											<div class="space-y-1">
												<Label for="ed-kind">Kind</Label>
												<Select id="ed-kind" bind:value={editor.kind}>
													{#each LESSON_KINDS as kind (kind)}
														<option value={kind}>{KIND_META[kind].label}</option>
													{/each}
												</Select>
											</div>
										</div>
										<div class="mt-3 space-y-1">
											<Label for="ed-notes">Notes</Label>
											<Textarea
												id="ed-notes"
												bind:value={editor.notes}
												rows={2}
												placeholder="Optional notes for this lesson"
											/>
										</div>
										<div class="mt-3 flex justify-end gap-2">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onclick={() => (editor = null)}
											>
												<Icon icon={Cancel01Icon} />
												Cancel
											</Button>
											<Button type="button" size="sm" onclick={commitEditor}>
												{editor.lessonId ? 'Save lesson' : 'Add lesson'}
											</Button>
										</div>
									</li>
								{:else}
									<li>
										<button
											type="button"
											onclick={() => openAdd(mod.id)}
											class="flex w-full items-center gap-2 rounded-control border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-border-strong hover:text-text"
										>
											<Icon icon={Add01Icon} class="size-4" />
											Add lesson
										</button>
									</li>
								{/if}
							</ul>
						</Card>
					</li>
				{/each}
			</ul>

			<div class="mt-4">
				<Button type="button" variant="secondary" size="sm" onclick={addModuleAtEnd}>
					<Icon icon={Add01Icon} />
					Add module
				</Button>
			</div>
		{/if}
	</form>
</Page>
