<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { Calendar03Icon, Delete02Icon, PlusSignIcon, UserIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Button,
		EmptyState,
		Field,
		Icon,
		Input,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import { DAYS, addPeriodSchema, periodsByDay, subjectMap, type Period } from '$lib/timetable';
	import type { Section } from '$lib/students';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const periods = $derived((data.periods ?? []) as Period[]);
	const week = $derived(periodsByDay(periods));
	const subjects = $derived(subjectMap(data.subjects));

	// The picker travels in the URL, so a section's week is a link. Section drops when it
	// stops belonging to the class.
	let selectClass = $state(untrack(() => data.classId));
	let selectSection = $state(untrack(() => data.sectionId));
	const sections = $derived<Section[]>(
		selectClass ? (data.sectionsByClass[selectClass] ?? []) : []
	);
	$effect(() => {
		if (selectSection !== '' && !sections.some((section) => section.id === selectSection)) {
			selectSection = '';
		}
	});

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	let adding = $state(false);
	let removing = $state<string | null>(null);
</script>

<svelte:head><title>Timetable — Muallim</title></svelte:head>

<PageHeader
	title="Timetable"
	description="A section’s week, period by period. Sunday first, as the school runs it."
/>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ----------------------------------------------------------------- filter -->
<form method="GET" class="mt-8 grid gap-5 sm:grid-cols-2 lg:max-w-2xl">
	<Field id="class" label="Class">
		{#snippet children({ id })}
			<Select
				{id}
				name="class"
				bind:value={selectClass}
				onchange={(event) => event.currentTarget.form?.requestSubmit()}
			>
				<option value="">Choose a class</option>
				{#each data.classes as klass (klass.id)}
					<option value={klass.id}>{klass.name}</option>
				{/each}
			</Select>
		{/snippet}
	</Field>

	<Field id="section" label="Section">
		{#snippet children({ id })}
			<Select
				{id}
				name="section"
				bind:value={selectSection}
				disabled={sections.length === 0}
				onchange={(event) => event.currentTarget.form?.requestSubmit()}
			>
				<option value="">{selectClass ? 'Choose a section' : 'Choose a class first'}</option>
				{#each sections as section (section.id)}
					<option value={section.id}>{section.name}</option>
				{/each}
			</Select>
		{/snippet}
	</Field>
	<noscript><Button type="submit" variant="secondary">Load timetable</Button></noscript>
</form>

{#if !data.sectionId}
	<div class="mt-8">
		<EmptyState
			icon={Calendar03Icon}
			title="Pick a section to see its week"
			description="Choose a class and section above and its timetable appears here."
		/>
	</div>
{:else}
	<!-- ------------------------------------------------------------ add period -->
	<section class="mt-8">
		<form
			method="POST"
			action="?/add"
			use:enhance={validated(
				addPeriodSchema,
				(next) => (errors = next),
				() => {
					adding = true;
					return async ({ result, update }) => {
						// Reload the grid from the server so a new period lands in its slot.
						await update();
						adding = false;
						if (result.type === 'success' && result.data?.added) {
							toast.success('The period has been added.');
						}
					};
				}
			)}
		>
			<input type="hidden" name="section_id" value={data.sectionId} />
			<Sheet>
				{#snippet header()}
					<h2 class="font-medium">Add a period</h2>
					<p class="mt-0.5 text-sm text-muted">
						A day and its start and end time place the period. The subject, teacher, and room are
						optional.
					</p>
				{/snippet}

				<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					<Field id="day_of_week" label="Day" error={problem('day_of_week')}>
						{#snippet children({ id, describedBy, invalid })}
							<Select {id} {invalid} name="day_of_week" aria-describedby={describedBy}>
								{#each DAYS as day (day.value)}
									<option value={day.value}>{day.label}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>

					<Field id="starts_at" label="Starts" error={problem('starts_at')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="starts_at"
								type="time"
								required
								aria-describedby={describedBy}
							/>
						{/snippet}
					</Field>

					<Field id="ends_at" label="Ends" error={problem('ends_at')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="ends_at"
								type="time"
								required
								aria-describedby={describedBy}
							/>
						{/snippet}
					</Field>

					<Field id="subject_id" label="Subject" error={problem('subject_id')}>
						{#snippet children({ id, describedBy, invalid })}
							<Select {id} {invalid} name="subject_id" aria-describedby={describedBy}>
								<option value="">No subject</option>
								{#each data.subjects as subject (subject.id)}
									<option value={subject.id}>{subject.name}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>

					<Field id="teacher_name" label="Teacher" error={problem('teacher_name')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="teacher_name"
								placeholder="Optional"
								maxlength={120}
								aria-describedby={describedBy}
							/>
						{/snippet}
					</Field>

					<Field id="room" label="Room" error={problem('room')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="room"
								placeholder="Optional"
								maxlength={60}
								aria-describedby={describedBy}
							/>
						{/snippet}
					</Field>
				</div>

				{#snippet footer()}
					<Button type="submit" loading={adding} disabled={adding}>
						<Icon icon={PlusSignIcon} class="size-4" />
						Add period
					</Button>
				{/snippet}
			</Sheet>
		</form>
	</section>

	<!-- --------------------------------------------------------------- the week -->
	<section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
		{#each DAYS as day (day.value)}
			<div class="rounded-card bg-surface-raised p-3 shadow-card">
				<h3 class="px-1 pb-2 text-sm font-medium">{day.label}</h3>

				{#if week[day.value].length === 0}
					<p class="px-1 py-2 text-xs text-muted">No periods.</p>
				{:else}
					<ul class="space-y-2">
						{#each week[day.value] as period (period.id)}
							<li class="rounded-control border border-border bg-surface p-3">
								<p class="numeral text-sm font-medium">{period.starts_at}–{period.ends_at}</p>
								{#if period.subject_id && subjects.get(period.subject_id)}
									<p class="mt-1 text-sm">{subjects.get(period.subject_id)}</p>
								{/if}
								{#if period.teacher_name}
									<p class="mt-1 flex items-center gap-1.5 text-xs text-muted">
										<Icon icon={UserIcon} class="size-3.5" />
										{period.teacher_name}
									</p>
								{/if}
								{#if period.room}
									<p class="mt-0.5 text-xs text-muted">Room {period.room}</p>
								{/if}

								<form
									method="POST"
									action="?/remove"
									class="mt-2"
									use:enhance={() => {
										removing = period.id;
										return async ({ result, update }) => {
											await update();
											removing = null;
											if (result.type === 'success') toast.success('The period has been removed.');
										};
									}}
								>
									<input type="hidden" name="period_id" value={period.id} />
									<Button
										type="submit"
										variant="ghost"
										size="sm"
										loading={removing === period.id}
										disabled={removing === period.id}
										aria-label="Remove the {period.starts_at} period"
									>
										<Icon icon={Delete02Icon} class="size-4" />
										Remove
									</Button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/each}
	</section>
{/if}
