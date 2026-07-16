<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		Book02Icon,
		Cancel01Icon,
		Delete02Icon,
		Mortarboard02Icon,
		PlusSignIcon,
		UserGroupIcon
	} from '@hugeicons/core-free-icons';
	import { Alert, Badge, Button, EmptyState, Field, Icon, Input, Sheet } from '$lib/components';
	import {
		CLASS_LIMITS,
		classCreateSchema,
		nextRank,
		sectionCreateSchema,
		subjectCreateSchema,
		type Class,
		type Section,
		type Subject
	} from '$lib/classes';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The rows on screen, seeded by the server and mutated in place as things are
	// created and deleted, so a form does not cost a round trip to see its own result.
	let classes = $derived(data.classes as Class[]);
	let sections = $derived(data.sections as Section[]);
	let subjects = $derived(data.subjects as Subject[]);

	const selected = $derived(classes.find((c) => c.id === data.selectedId));

	// Per-form field errors, kept apart so one form's mistake does not light another.
	let classErrors = $state<FieldErrors>({});
	let sectionErrors = $state<FieldErrors>({});
	let subjectErrors = $state<FieldErrors>({});

	let classOpen = $state(false);
	let sectionOpen = $state(false);
	let subjectOpen = $state(false);
	let creatingClass = $state(false);
	let creatingSection = $state(false);
	let creatingSubject = $state(false);

	// Which row is asking "are you sure?". A destructive button that fires on the first
	// click is a class deleted by a slip of the mouse.
	let confirming = $state<string | null>(null);
	let deleting = $state<string | null>(null);
</script>

<svelte:head><title>Classes — Muallim</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div class="min-w-0">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Classes</h1>
		<p class="mt-2 max-w-2xl text-muted">
			The classes this school teaches, the sections each one is split into, and the subjects taught
			across them. Attendance, fees, exams and the timetable all build on this.
		</p>
	</div>
	<div class="flex shrink-0 items-center gap-3">
		<Button
			variant="secondary"
			onclick={() => {
				subjectErrors = {};
				subjectOpen = !subjectOpen;
			}}
		>
			<Icon icon={subjectOpen ? Cancel01Icon : Book02Icon} class="size-4" />
			{subjectOpen ? 'Close' : 'Add subject'}
		</Button>
		<Button
			onclick={() => {
				classErrors = {};
				classOpen = !classOpen;
			}}
		>
			<Icon icon={classOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{classOpen ? 'Close' : 'New class'}
		</Button>
	</div>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ------------------------------------------------------------- new class -->
{#if classOpen}
	<form
		method="POST"
		action="?/createClass"
		use:enhance={validated(
			classCreateSchema,
			(next) => (classErrors = next),
			() => {
				creatingClass = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingClass = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdClass as Class | undefined;
					if (created) {
						classOpen = false;
						toast.success(`“${created.name}” has been created.`);
						// The new class becomes the one on show, and its (empty) sections
						// have to come from the server — hence a reload rather than a splice.
						await invalidateAll();
					}
				};
			}
		)}
	>
		<Sheet open={classOpen} onClose={() => (classOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new class</h2>
				<p class="mt-0.5 text-sm text-muted">
					A name, and where it sits in the order — junior classes first.
				</p>
			{/snippet}

			<div class="space-y-5">
				<Field id="class-name" label="Name" error={classErrors.name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="Class 6"
							aria-describedby={describedBy}
							{...CLASS_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<Field
					id="class-rank"
					label="Order"
					hint="Classes are listed from the lowest number up."
					error={classErrors.rank}
				>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="rank"
							value={String(nextRank(classes))}
							inputmode="numeric"
							aria-describedby={describedBy}
							{...CLASS_LIMITS.rank}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creatingClass} disabled={creatingClass}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create class
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ----------------------------------------------------------- new section -->
{#if sectionOpen && selected}
	<form
		method="POST"
		action="?/createSection"
		use:enhance={validated(
			sectionCreateSchema,
			(next) => (sectionErrors = next),
			() => {
				creatingSection = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingSection = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdSection as Section | undefined;
					if (created) {
						sections = [...sections, created];
						sectionOpen = false;
						toast.success(`Section “${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<input type="hidden" name="class_id" value={selected.id} />
		<Sheet open={sectionOpen} onClose={() => (sectionOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new section of {selected.name}</h2>
				<p class="mt-0.5 text-sm text-muted">
					The group a student actually sits in, and how many it seats.
				</p>
			{/snippet}

			<div class="space-y-5">
				<Field id="section-name" label="Name" error={sectionErrors.name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="A"
							aria-describedby={describedBy}
							{...CLASS_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<Field
					id="section-capacity"
					label="Seats"
					hint="Leave this at 0 if you are not capping the section."
					error={sectionErrors.capacity}
				>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="capacity"
							value="0"
							inputmode="numeric"
							aria-describedby={describedBy}
							{...CLASS_LIMITS.capacity}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creatingSection} disabled={creatingSection}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Add section
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ----------------------------------------------------------- new subject -->
{#if subjectOpen}
	<form
		method="POST"
		action="?/createSubject"
		use:enhance={validated(
			subjectCreateSchema,
			(next) => (subjectErrors = next),
			() => {
				creatingSubject = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingSubject = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdSubject as Subject | undefined;
					if (created) {
						subjects = [...subjects, created];
						subjectOpen = false;
						toast.success(`“${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={subjectOpen} onClose={() => (subjectOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new subject</h2>
				<p class="mt-0.5 text-sm text-muted">
					Subjects belong to the school, not to one class — every class can teach them.
				</p>
			{/snippet}

			<div class="space-y-5">
				<Field id="subject-name" label="Name" error={subjectErrors.name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="Mathematics"
							aria-describedby={describedBy}
							{...CLASS_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<Field
					id="subject-code"
					label="Code"
					hint="A short code the school files it under. Optional."
					error={subjectErrors.code}
				>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="code"
							placeholder="MATH"
							aria-describedby={describedBy}
							{...CLASS_LIMITS.code}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creatingSubject} disabled={creatingSubject}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Add subject
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ---------------------------------------------------- classes & sections -->
<section class="mt-10">
	{#if classes.length === 0}
		<EmptyState
			icon={Mortarboard02Icon}
			title="No classes yet"
			description="A class is where everything else starts — students, attendance, fees, exams and the timetable all hang off one. Create your first class above."
		/>
	{:else}
		<div class="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
			<!-- The classes, junior to senior. Choosing one is a real navigation, so the
			     sections beside it are loaded rather than guessed. -->
			<div>
				<h2 class="text-lg font-semibold">Classes</h2>
				<p class="mt-1 text-sm text-muted">Junior to senior. Choose one to see its sections.</p>

				<ul
					class="mt-4 divide-y divide-border overflow-hidden rounded-card bg-surface-raised shadow-card"
				>
					{#each classes as klass (klass.id)}
						<li>
							<div
								class="flex items-center gap-2 px-4 py-3 {klass.id === data.selectedId
									? 'bg-surface-sunken'
									: ''}"
							>
								<a
									href="?class={klass.id}"
									class="min-w-0 flex-1 rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
									aria-current={klass.id === data.selectedId ? 'true' : undefined}
								>
									<span class="block truncate font-medium">{klass.name}</span>
									<span class="mt-0.5 block text-xs text-muted">Order {klass.rank}</span>
								</a>

								{#if confirming === klass.id}
									<form
										method="POST"
										action="?/deleteClass"
										class="flex shrink-0 items-center gap-1"
										use:enhance={() => {
											deleting = klass.id;
											return async ({ result }) => {
												deleting = null;
												confirming = null;
												if (result.type !== 'success') return applyAction(result);
												toast.success(`“${klass.name}” has been deleted.`);
												// The deleted class may be the one on show; the server
												// picks the next one to stand on.
												await invalidateAll();
											};
										}}
									>
										<input type="hidden" name="id" value={klass.id} />
										<Button
											type="submit"
											variant="danger"
											size="sm"
											loading={deleting === klass.id}
											disabled={deleting === klass.id}
										>
											Delete
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onclick={() => (confirming = null)}
										>
											Keep
										</Button>
									</form>
								{:else}
									<Button
										variant="ghost"
										size="sm"
										aria-label="Delete {klass.name}"
										onclick={() => (confirming = klass.id)}
									>
										<Icon icon={Delete02Icon} class="size-4" />
									</Button>
								{/if}
							</div>

							<!-- Deleting a class takes its sections with it: say so before it happens. -->
							{#if confirming === klass.id}
								<p class="px-4 pb-3 text-xs text-muted">
									This also deletes every section of {klass.name}. It cannot be undone.
								</p>
							{/if}
						</li>
					{/each}
				</ul>
			</div>

			<!-- The chosen class's sections. -->
			<div>
				<div class="flex flex-wrap items-end justify-between gap-3">
					<div class="min-w-0">
						<h2 class="text-lg font-semibold">
							{selected ? `Sections of ${selected.name}` : 'Sections'}
						</h2>
						<p class="mt-1 text-sm text-muted">
							A class is split into sections; a student sits in one of them.
						</p>
					</div>
					<Button
						variant="secondary"
						size="sm"
						disabled={!selected}
						onclick={() => {
							sectionErrors = {};
							sectionOpen = !sectionOpen;
						}}
					>
						<Icon icon={sectionOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
						{sectionOpen ? 'Close' : 'Add section'}
					</Button>
				</div>

				<div class="mt-4">
					{#if data.sectionsError}
						<Alert tone="warning" role="alert">{data.sectionsError}</Alert>
					{:else if sections.length === 0}
						<EmptyState
							icon={UserGroupIcon}
							title="No sections"
							description={selected
								? `${selected.name} has no sections yet. Add one and students can be placed in it.`
								: 'Choose a class to see its sections.'}
						/>
					{:else}
						<ul class="grid gap-3 sm:grid-cols-2">
							{#each sections as section (section.id)}
								<li class="rounded-card border border-border bg-surface-raised p-4">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate font-medium">{section.name}</p>
											<p class="mt-0.5 text-sm text-muted">
												{section.capacity > 0 ? `${section.capacity} seats` : 'No seat limit'}
											</p>
										</div>

										{#if confirming === section.id}
											<form
												method="POST"
												action="?/deleteSection"
												class="flex shrink-0 items-center gap-1"
												use:enhance={() => {
													deleting = section.id;
													return async ({ result }) => {
														deleting = null;
														confirming = null;
														if (result.type !== 'success') return applyAction(result);
														sections = sections.filter((s) => s.id !== section.id);
														toast.success(`Section “${section.name}” has been deleted.`);
													};
												}}
											>
												<input type="hidden" name="id" value={section.id} />
												<Button
													type="submit"
													variant="danger"
													size="sm"
													loading={deleting === section.id}
													disabled={deleting === section.id}
												>
													Delete
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onclick={() => (confirming = null)}
												>
													Keep
												</Button>
											</form>
										{:else}
											<Button
												variant="ghost"
												size="sm"
												aria-label="Delete section {section.name}"
												onclick={() => (confirming = section.id)}
											>
												<Icon icon={Delete02Icon} class="size-4" />
											</Button>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</section>

<!-- ------------------------------------------------------------- subjects -->
<section class="mt-10">
	<div>
		<h2 class="text-lg font-semibold">Subjects</h2>
		<p class="mt-1 text-sm text-muted">
			Everything this school teaches. Exams and the timetable pick from this list.
		</p>
	</div>

	<div class="mt-4">
		{#if data.subjectsError}
			<Alert tone="warning" role="alert">{data.subjectsError}</Alert>
		{:else if subjects.length === 0}
			<EmptyState
				icon={Book02Icon}
				title="No subjects yet"
				description="Add a subject and it becomes available to every class — to timetable, to examine, and to grade."
			/>
		{:else}
			<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each subjects as subject (subject.id)}
					<li class="rounded-card border border-border bg-surface-raised p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate font-medium">{subject.name}</p>
								{#if subject.code}
									<Badge class="mt-1">{subject.code}</Badge>
								{/if}
							</div>

							{#if confirming === subject.id}
								<form
									method="POST"
									action="?/deleteSubject"
									class="flex shrink-0 items-center gap-1"
									use:enhance={() => {
										deleting = subject.id;
										return async ({ result }) => {
											deleting = null;
											confirming = null;
											if (result.type !== 'success') return applyAction(result);
											subjects = subjects.filter((s) => s.id !== subject.id);
											toast.success(`“${subject.name}” has been deleted.`);
										};
									}}
								>
									<input type="hidden" name="id" value={subject.id} />
									<Button
										type="submit"
										variant="danger"
										size="sm"
										loading={deleting === subject.id}
										disabled={deleting === subject.id}
									>
										Delete
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => (confirming = null)}
									>
										Keep
									</Button>
								</form>
							{:else}
								<Button
									variant="ghost"
									size="sm"
									aria-label="Delete {subject.name}"
									onclick={() => (confirming = subject.id)}
								>
									<Icon icon={Delete02Icon} class="size-4" />
								</Button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
