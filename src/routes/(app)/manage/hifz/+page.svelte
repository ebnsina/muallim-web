<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { ArrowDown01Icon, ArrowRight01Icon, BookOpen01Icon } from '@hugeicons/core-free-icons';
	import { Button, EmptyState, Field, Icon, PageHeader, Select } from '$lib/components';
	import { appendPage, canLoadMore, type Paged } from '$lib/paging';
	import type { Student } from '$lib/students';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const studentKey = (student: Student) => student.id;
	let students = $derived(data.students as Paged<Student>);

	const classMap = $derived(new Map(data.classes.map((klass) => [klass.id, klass.name])));

	let loadingMore = $state(false);
</script>

<svelte:head><title>Hifz — Muallim</title></svelte:head>

<PageHeader
	title="Hifz"
	description="The record of what each student has memorised and recited. Choose a student to see their log and add a recitation."
/>

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
	<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
</form>

<!-- ------------------------------------------------------------------ roster -->
<section class="mt-4">
	{#if students.rows.length === 0}
		<EmptyState
			icon={BookOpen01Icon}
			title={data.gradeLevelId ? 'No students in this class' : 'No students yet'}
			description="Admit students to the institution, then keep their hifz record here."
		/>
	{:else}
		<ul class="divide-y divide-border overflow-hidden rounded-card bg-surface-raised shadow-card">
			{#each students.rows as student (student.id)}
				<li>
					<a
						href={resolve(`/manage/hifz/${student.id}`)}
						class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					>
						<div class="min-w-0">
							<span class="font-medium">{student.full_name}</span>
							<span class="numeral ml-2 text-sm text-muted">#{student.admission_no}</span>
						</div>
						<div class="flex items-center gap-3 text-sm text-muted">
							{#if student.grade_level_id && classMap.get(student.grade_level_id)}
								<span>{classMap.get(student.grade_level_id)}</span>
							{/if}
							<Icon icon={ArrowRight01Icon} class="size-4" />
						</div>
					</a>
				</li>
			{/each}
		</ul>

		{#if canLoadMore(students)}
			<form
				method="POST"
				action="?/more"
				class="mt-4 flex justify-center"
				use:enhance={() => {
					loadingMore = true;
					return async ({ result }) => {
						loadingMore = false;
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
