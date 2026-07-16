<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowLeft01Icon,
		FloppyDiskIcon,
		Note04Icon,
		UserMultiple02Icon
	} from '@hugeicons/core-free-icons';
	import { Alert, Badge, Button, EmptyState, Icon, Input, PageHeader } from '$lib/components';
	import { EXAM_LIMITS, examStatusLabel, examStatusTone } from '$lib/exams';
	import { toast } from '$lib/toast.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const exam = $derived(data.exam);
	const isDraft = $derived(exam.status === 'draft');

	const classMap = $derived(new Map(data.classes.map((klass) => [klass.id, klass.name])));
	const className = $derived(exam.grade_level_id ? classMap.get(exam.grade_level_id) : undefined);

	let saving = $state(false);
</script>

<svelte:head><title>{exam.name} — Muallim</title></svelte:head>

<a
	href={resolve('/manage/exams')}
	class="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
>
	<Icon icon={ArrowLeft01Icon} class="size-4" />
	All exams
</a>

<div class="mt-4">
	<PageHeader title={exam.name}>
		{#snippet meta()}
			<Badge tone={examStatusTone(exam.status)}>{examStatusLabel(exam.status)}</Badge>
			{#if className}<span class="text-muted">{className}</span>{/if}
			{#if exam.held_on}<span class="numeral text-muted">{exam.held_on}</span>{/if}
		{/snippet}
	</PageHeader>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ------------------------------------------------------------- marks entry -->
{#if isDraft}
	<section class="mt-8">
		<h2 class="text-lg font-semibold">Marks</h2>
		<p class="mt-1 text-sm text-muted">
			Set a full mark at the head of each subject, then enter what each student scored. A cell left
			blank is not a zero — only the marks you enter are saved.
		</p>

		{#if data.students.length === 0 || data.subjects.length === 0}
			<div class="mt-4">
				<EmptyState
					icon={Note04Icon}
					title={data.subjects.length === 0 ? 'No subjects to mark' : 'No students to mark'}
					description={data.subjects.length === 0
						? 'Add subjects to this institution before entering marks.'
						: 'This exam’s class has no students yet.'}
				/>
			</div>
		{:else}
			<form
				method="POST"
				action="?/enterMarks"
				class="mt-4"
				use:enhance={() => {
					saving = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						saving = false;
						if (result.type === 'success') {
							const entered = result.data?.entered as number | undefined;
							toast.success(entered === 1 ? '1 mark saved.' : `${entered ?? 0} marks saved.`);
						}
					};
				}}
			>
				<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
					<table class="w-full border-collapse text-sm">
						<caption class="sr-only"
							>Marks, students down the side and subjects across the top.</caption
						>
						<thead>
							<tr class="border-b border-border bg-surface-sunken text-left">
								<th scope="col" class="sticky left-0 bg-surface-sunken px-4 py-3 font-medium"
									>Student</th
								>
								{#each data.subjects as subject (subject.id)}
									<th scope="col" class="px-3 py-2 font-medium">
										<div class="whitespace-nowrap">{subject.name}</div>
										<div class="mt-1.5 w-24">
											<Input
												name="full:{subject.id}"
												aria-label="Full marks for {subject.name}"
												placeholder="Full"
												value="100"
												{...EXAM_LIMITS.fullMarks}
											/>
										</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each data.students as student (student.id)}
								<tr class="border-b border-border last:border-0 hover:bg-surface-sunken">
									<th
										scope="row"
										class="sticky left-0 bg-surface-raised px-4 py-2 text-left font-medium whitespace-nowrap"
									>
										{student.full_name}
										<span class="numeral ml-1 text-xs text-muted">#{student.admission_no}</span>
									</th>
									{#each data.subjects as subject (subject.id)}
										<td class="px-3 py-2">
											<div class="w-20">
												<Input
													name="obtained:{student.id}:{subject.id}"
													aria-label="{student.full_name}, {subject.name}"
													placeholder="—"
													{...EXAM_LIMITS.obtained}
												/>
											</div>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="mt-4">
					<Button type="submit" loading={saving} disabled={saving}>
						<Icon icon={FloppyDiskIcon} class="size-4" />
						Save marks
					</Button>
				</div>
			</form>
		{/if}
	</section>
{:else}
	<Alert tone="info" class="mt-8">
		This exam is published. Its marks are final; open a student’s report card below.
	</Alert>
{/if}

<!-- ------------------------------------------------------------- report cards -->
<section class="mt-10">
	<h2 class="text-lg font-semibold">Report cards</h2>
	<p class="mt-1 text-sm text-muted">
		Each student’s marks totalled and graded against the scale. Open one to view or print it.
	</p>

	{#if data.students.length === 0}
		<div class="mt-4">
			<EmptyState
				icon={UserMultiple02Icon}
				title="No students"
				description="This exam’s class has no students to report on yet."
			/>
		</div>
	{:else}
		<ul
			class="mt-4 divide-y divide-border overflow-hidden rounded-card bg-surface-raised shadow-card"
		>
			{#each data.students as student (student.id)}
				<li class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-sunken">
					<div class="min-w-0">
						<span class="font-medium">{student.full_name}</span>
						<span class="numeral ml-2 text-sm text-muted">#{student.admission_no}</span>
					</div>
					<Button
						href={resolve(`/manage/exams/${exam.id}/students/${student.id}`)}
						variant="secondary"
						size="sm"
					>
						Report card
					</Button>
				</li>
			{/each}
		</ul>
	{/if}
</section>
