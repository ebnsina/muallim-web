<script lang="ts">
	import { untrack } from 'svelte';
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		Cancel01Icon,
		Delete02Icon,
		Note04Icon,
		PlusSignIcon,
		SentIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Card,
		EmptyState,
		Field,
		Icon,
		Input,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import {
		createExamSchema,
		EXAM_LIMITS,
		examStatusLabel,
		examStatusTone,
		type Exam
	} from '$lib/exams';
	import { appendPage, canLoadMore, type Paged } from '$lib/paging';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const examKey = (exam: Exam) => exam.id;

	let exams = $derived(data.exams as Paged<Exam>);

	// The names behind the ids an exam carries, so a row reads "Class Six" not a UUID.
	const classMap = $derived(new Map(data.classes.map((klass) => [klass.id, klass.name])));
	const scaleMap = $derived(new Map(data.scales.map((scale) => [scale.id, scale.name])));

	// The bands of the scale shown beside the list, sorted low to high so the ladder reads.
	const defaultBands = $derived(
		[...(data.defaultScale?.bands ?? [])].sort((a, b) => a.min_percent - b.min_percent)
	);

	let createOpen = $state(false);

	// The traditional madrasa scale is a one-time add; hide the offer once it exists.
	const hasMadrasa = $derived(data.scales.some((s) => s.name.toLowerCase().includes('madrasa')));
	let creating = $state(false);
	let loadingMore = $state(false);
	let publishing = $state<string | null>(null);
	let removing = $state<string | null>(null);
	let confirming = $state<string | null>(null);

	// The scale defaults to the workspace's default, so the common case needs no pick.
	let scaleId = $state(untrack(() => data.defaultScale?.id ?? data.scales[0]?.id ?? ''));

	function context(exam: Exam): string {
		const parts = [
			exam.grade_level_id ? classMap.get(exam.grade_level_id) : undefined,
			exam.held_on
		].filter(Boolean);
		return parts.length ? parts.join(' · ') : '—';
	}
</script>

<svelte:head><title>Exams &amp; report cards — Muallim</title></svelte:head>

<PageHeader
	title="Exams &amp; report cards"
	description="Set an exam, enter marks against a grading scale, and hand each student their report card."
>
	{#snippet actions()}
		{#if !hasMadrasa}
			<form
				method="POST"
				action="?/madrasaScale"
				use:enhance={() => async ({ result }) => {
					await applyAction(result);
					if (result.type === 'success') toast.success('Madrasa scale added.');
				}}
			>
				<Button type="submit" variant="secondary">Add madrasa scale</Button>
			</form>
		{/if}
		<Button onclick={() => (createOpen = !createOpen)}>
			<Icon icon={createOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{createOpen ? 'Close' : 'New exam'}
		</Button>
	{/snippet}
</PageHeader>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ------------------------------------------------------------- grading scale -->
{#if data.defaultScale}
	<Card class="mt-6 p-5">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-sm font-medium">{data.defaultScale.name}</h2>
				<p class="mt-0.5 text-xs text-muted">The scale every mark is graded against.</p>
			</div>
			<Badge tone="neutral">
				{defaultBands.length} bands
			</Badge>
		</div>

		<div class="mt-4 flex flex-wrap gap-2">
			{#each defaultBands as band (band.letter + band.min_percent)}
				<span
					class={[
						'inline-flex items-center gap-2 rounded-pill border px-2.5 py-1 text-xs',
						band.is_pass
							? 'border-success-border bg-success-surface text-success-text'
							: 'border-danger-border bg-danger-surface text-danger-text'
					]}
				>
					<span class="font-semibold">{band.letter}</span>
					<span class="numeral opacity-80">≥{band.min_percent}%</span>
					<span class="numeral opacity-80">· {band.gpa_point.toFixed(2)}</span>
				</span>
			{/each}
		</div>
	</Card>
{/if}

<!-- -------------------------------------------------------------------- create -->
{#if createOpen}
	<form
		method="POST"
		action="?/create"
		class="mt-6"
		use:enhance={validated(
			createExamSchema,
			(next) => (errors = next),
			() => {
				creating = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creating = false;

					if (result.type !== 'success') return;

					const created = result.data?.created as Exam | undefined;
					if (created) {
						exams = { ...exams, rows: [created, ...exams.rows] };
						createOpen = false;
						toast.success(`“${created.name}” has been created.`);
					}
				};
			}
		)}
	>
		<Sheet open={createOpen} onClose={() => (createOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">New exam</h2>
				<p class="mt-0.5 text-sm text-muted">
					A name and a grading scale are all it needs. A class, term, and the day it was held place
					it, and can be set later.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="name" label="Name" error={problem('name')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="Half-yearly examination"
							aria-describedby={describedBy}
							{...EXAM_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<Field id="scale_id" label="Grading scale" error={problem('scale_id')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="scale_id"
							aria-describedby={describedBy}
							bind:value={scaleId}
						>
							{#each data.scales as scale (scale.id)}
								<option value={scale.id}>{scale.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="grade_level_id" label="Class" error={problem('grade_level_id')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="grade_level_id" aria-describedby={describedBy}>
							<option value="">All classes</option>
							{#each data.classes as klass (klass.id)}
								<option value={klass.id}>{klass.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="held_on" label="Held on" error={problem('held_on')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="held_on"
							aria-describedby={describedBy}
							{...EXAM_LIMITS.heldOn}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creating} disabled={creating}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create exam
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ---------------------------------------------------------------------- list -->
<section class="mt-8">
	{#if exams.rows.length === 0}
		<EmptyState
			icon={Note04Icon}
			title="No exams yet"
			description="Create your first exam and it will appear here, ready for marks."
		/>
	{:else}
		<ul class="space-y-3">
			{#each exams.rows as exam (exam.id)}
				<li class="rounded-card bg-surface-raised p-4 shadow-card sm:p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<a
									href={resolve(`/manage/exams/${exam.id}`)}
									class="rounded-control font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								>
									{exam.name}
								</a>
								<Badge tone={examStatusTone(exam.status)}>{examStatusLabel(exam.status)}</Badge>
							</div>
							<p class="mt-1 text-sm text-muted">
								{context(exam)}
								<span class="text-muted/70">· {scaleMap.get(exam.scale_id) ?? 'Scale'}</span>
							</p>
						</div>

						<div class="flex shrink-0 items-center gap-2">
							<Button href={resolve(`/manage/exams/${exam.id}`)} variant="secondary" size="sm">
								{exam.status === 'draft' ? 'Enter marks' : 'Report cards'}
							</Button>

							{#if exam.status === 'draft'}
								<form
									method="POST"
									action="?/publish"
									use:enhance={() => {
										publishing = exam.id;
										return async ({ result }) => {
											publishing = null;
											if (result.type !== 'success') return applyAction(result);
											const published = result.data?.published as Exam | undefined;
											if (published) {
												exams = {
													...exams,
													rows: exams.rows.map((e) => (e.id === published.id ? published : e))
												};
												toast.success(`“${published.name}” is published.`);
											}
										};
									}}
								>
									<input type="hidden" name="id" value={exam.id} />
									<Button
										type="submit"
										size="sm"
										loading={publishing === exam.id}
										disabled={publishing === exam.id}
									>
										<Icon icon={SentIcon} class="size-4" />
										Publish
									</Button>
								</form>
							{/if}

							{#if confirming === exam.id}
								<form
									method="POST"
									action="?/remove"
									class="flex items-center gap-2"
									use:enhance={() => {
										removing = exam.id;
										return async ({ result }) => {
											removing = null;
											confirming = null;
											if (result.type !== 'success') return applyAction(result);
											exams = { ...exams, rows: exams.rows.filter((e) => e.id !== exam.id) };
											toast.success(`“${exam.name}” has been removed.`);
										};
									}}
								>
									<input type="hidden" name="id" value={exam.id} />
									<Button
										type="submit"
										variant="danger"
										size="sm"
										loading={removing === exam.id}
										disabled={removing === exam.id}
									>
										Remove
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
									onclick={() => (confirming = exam.id)}
									aria-label="Remove {exam.name}"
								>
									<Icon icon={Delete02Icon} class="size-4" />
								</Button>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>

		{#if canLoadMore(exams)}
			<form
				method="POST"
				action="?/more"
				class="mt-4 flex justify-center"
				use:enhance={() => {
					loadingMore = true;
					return async ({ result }) => {
						loadingMore = false;
						if (result.type !== 'success') return applyAction(result);
						const next = result.data?.more as Paged<Exam> | undefined;
						if (next) exams = appendPage(exams, next, examKey);
					};
				}}
			>
				<input type="hidden" name="cursor" value={exams.cursor} />
				<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
					<Icon icon={ArrowDown01Icon} class="size-4" />
					Load more exams
				</Button>
			</form>
		{/if}
	{/if}
</section>
