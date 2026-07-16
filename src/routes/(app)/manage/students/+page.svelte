<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		Cancel01Icon,
		UserAdd01Icon,
		UserMultiple02Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		EmptyState,
		Field,
		Icon,
		Input,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import { appendPage, canLoadMore, type Paged } from '$lib/paging';
	import { LIMITS, admitStudentSchema } from '$lib/schemas';
	import { statusLabel, statusTone, type Student } from '$lib/students';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const studentKey = (student: Student) => student.id;

	// The rows on screen. Seeded by the server's first page; "Load more" appends the
	// next, and admitting one puts it at the head — re-reading would throw a reader
	// several pages in back to the first.
	let students = $derived(data.students as Paged<Student>);

	// The names behind the ids a student carries, so a placement reads as "Class Six ·
	// Section A" and not two UUIDs. Both maps come from the class list loaded with the page.
	const classMap = $derived(new Map(data.classes.map((klass) => [klass.id, klass.name])));
	const sectionMap = $derived(
		new Map(
			Object.values(data.sectionsByClass)
				.flat()
				.map((section) => [section.id, section.name])
		)
	);

	function placement(student: Student): string {
		const klass = student.grade_level_id ? classMap.get(student.grade_level_id) : undefined;
		const section = student.section_id ? sectionMap.get(student.section_id) : undefined;
		if (klass && section) return `${klass} · ${section}`;
		return klass ?? '—';
	}

	let admitOpen = $state(false);
	let admitting = $state(false);
	let loadingMore = $state(false);

	// The admit form's class picks its own sections; changing the class drops a section
	// that no longer belongs to it, so the two never leave the form disagreeing.
	let admitClass = $state('');
	let admitSection = $state('');
	const admitSections = $derived(admitClass ? (data.sectionsByClass[admitClass] ?? []) : []);
	$effect(() => {
		void admitClass;
		admitSection = '';
	});
</script>

<svelte:head><title>Students — Muallim</title></svelte:head>

<PageHeader
	title="Students"
	description="Everyone enrolled at this institution, and how to admit more."
>
	{#snippet actions()}
		<Button onclick={() => (admitOpen = !admitOpen)}>
			<Icon icon={admitOpen ? Cancel01Icon : UserAdd01Icon} class="size-4" />
			{admitOpen ? 'Close' : 'Admit student'}
		</Button>
	{/snippet}
</PageHeader>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ------------------------------------------------------------------ admit -->
{#if admitOpen}
	<form
		method="POST"
		action="?/admit"
		class="mt-6"
		use:enhance={validated(
			admitStudentSchema,
			(next) => (errors = next),
			() => {
				admitting = true;
				return async ({ result, update }) => {
					// `invalidateAll: false` keeps the pages already loaded from being dropped.
					await update({ invalidateAll: false });
					admitting = false;

					if (result.type !== 'success') return;

					const admitted = result.data?.admitted as Student | undefined;
					if (admitted) {
						students = { ...students, rows: [admitted, ...students.rows] };
						admitOpen = false;
						admitClass = '';
						toast.success(`${admitted.full_name} has been admitted.`);
					}
				};
			}
		)}
	>
		<Sheet open={admitOpen} onClose={() => (admitOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Admit a student</h2>
				<p class="mt-0.5 text-sm text-muted">
					An admission number and a name are all that is needed. Class, section, and roll place the
					student, and can be set later.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="admission_no" label="Admission number" error={problem('admission_no')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="admission_no"
							placeholder="2026-0148"
							aria-describedby={describedBy}
							{...LIMITS.admissionNo}
						/>
					{/snippet}
				</Field>

				<Field id="full_name" label="Full name" error={problem('full_name')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="full_name"
							autocomplete="off"
							placeholder="Fatima Rahman"
							aria-describedby={describedBy}
							{...LIMITS.studentName}
						/>
					{/snippet}
				</Field>

				<Field id="grade_level_id" label="Class" error={problem('grade_level_id')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="grade_level_id"
							aria-describedby={describedBy}
							bind:value={admitClass}
						>
							<option value="">Not placed yet</option>
							{#each data.classes as klass (klass.id)}
								<option value={klass.id}>{klass.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="section_id" label="Section" error={problem('section_id')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="section_id"
							aria-describedby={describedBy}
							bind:value={admitSection}
							disabled={admitSections.length === 0}
						>
							<option value="">{admitClass ? 'No section' : 'Choose a class first'}</option>
							{#each admitSections as section (section.id)}
								<option value={section.id}>{section.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="roll" label="Roll number" error={problem('roll')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="roll"
							inputmode="numeric"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...LIMITS.roll}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={admitting} disabled={admitting}>
					<Icon icon={UserAdd01Icon} class="size-4" />
					Admit student
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ----------------------------------------------------------------- filter -->
<form method="GET" class="mt-8 flex flex-wrap items-end gap-3">
	<div class="w-full max-w-xs">
		<Field id="class-filter" label="Filter by class">
			{#snippet children({ id })}
				<Select
					{id}
					name="class"
					value={data.gradeLevelId}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				>
					<option value="">All classes</option>
					{#each data.classes as klass (klass.id)}
						<option value={klass.id}>{klass.name}</option>
					{/each}
				</Select>
			{/snippet}
		</Field>
	</div>
	<!-- A working control without JS: the button submits the same GET. -->
	<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
</form>

<!-- ------------------------------------------------------------------ roster -->
<section class="mt-4">
	{#if students.rows.length === 0}
		<EmptyState
			icon={UserMultiple02Icon}
			title={data.gradeLevelId ? 'No students in this class' : 'No students yet'}
			description={data.gradeLevelId
				? 'Choose another class, or admit a student into this one.'
				: 'Admit your first student and they will appear here.'}
		/>
	{:else}
		<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
			<table class="w-full border-collapse text-sm">
				<caption class="sr-only">
					Every student: their admission number, name, class and section, roll, and status.
				</caption>

				<thead>
					<tr class="border-b border-border bg-surface-sunken text-left">
						<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Admission no.</th>
						<th scope="col" class="px-4 py-3 font-medium">Name</th>
						<th scope="col" class="px-4 py-3 font-medium">Class / Section</th>
						<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Roll</th>
						<th scope="col" class="px-4 py-3 font-medium">Status</th>
					</tr>
				</thead>

				<tbody>
					{#each students.rows as student (student.id)}
						<tr class="border-b border-border last:border-0 hover:bg-surface-sunken">
							<td class="numeral px-4 py-3 whitespace-nowrap text-muted">
								{student.admission_no}
							</td>
							<th scope="row" class="px-4 py-3 text-left font-medium">
								<a
									href={resolve(`/manage/students/${student.id}`)}
									class="rounded-control underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								>
									{student.full_name}
								</a>
							</th>
							<td class="px-4 py-3 text-muted">{placement(student)}</td>
							<td class="numeral px-4 py-3 text-muted">{student.roll || '—'}</td>
							<td class="px-4 py-3">
								<Badge tone={statusTone(student.status)}>{statusLabel(student.status)}</Badge>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- No total: muallim-api runs no COUNT(*), so nothing here claims one. The button
		     is the only thing that knows there is more, and it goes when there is not. -->
		{#if canLoadMore(students)}
			<form
				method="POST"
				action="?/more"
				class="mt-4 flex justify-center"
				use:enhance={() => {
					loadingMore = true;
					return async ({ result }) => {
						loadingMore = false;

						// Not `update()`: re-running the load would drop every page but the first.
						if (result.type !== 'success') return applyAction(result);

						const next = result.data?.more as Paged<Student> | undefined;
						if (next) students = appendPage(students, next, studentKey);
					};
				}}
			>
				<input type="hidden" name="cursor" value={students.cursor} />
				<input type="hidden" name="class" value={data.gradeLevelId} />
				<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
					<Icon icon={ArrowDown01Icon} class="size-4" />
					Load more students
				</Button>
			</form>
		{/if}
	{/if}
</section>
