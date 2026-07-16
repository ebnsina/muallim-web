<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import {
		Calendar03Icon,
		CheckmarkCircle02Icon,
		FloppyDiskIcon,
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
		Numeral,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import {
		ATTENDANCE_STATUSES,
		historySchema,
		statusLabel,
		statusTone,
		type RegisterEntry
	} from '$lib/attendance';
	import type { Section } from '$lib/students';
	import { toast } from '$lib/toast.svelte';
	import { parseForm, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const register = $derived((data.register ?? []) as RegisterEntry[]);

	// The register filter's pickers. Seeded from the URL, resynced when it moves, and the
	// section drops whenever it stops belonging to the class — the two never disagree.
	let selectClass = $state(untrack(() => data.classId));
	let selectSection = $state(untrack(() => data.sectionId));
	let selectDate = $state(untrack(() => data.date));

	const sections = $derived<Section[]>(
		selectClass ? (data.sectionsByClass[selectClass] ?? []) : []
	);
	$effect(() => {
		if (selectSection !== '' && !sections.some((section) => section.id === selectSection)) {
			selectSection = '';
		}
	});

	let saving = $state(false);

	// The history lookup is a GET, validated in the browser before it changes the URL.
	let historyErrors = $state<FieldErrors>({});
	const historyProblem = (field: string) => historyErrors[field];
	function checkHistory(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		const result = parseForm(historySchema, new FormData(event.currentTarget));
		if (!result.ok) {
			event.preventDefault();
			historyErrors = result.errors;
		} else {
			historyErrors = {};
		}
	}

	function longDate(iso: string): string {
		const parsed = new Date(`${iso}T00:00:00`);
		return Number.isNaN(parsed.getTime())
			? iso
			: parsed.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
	}
</script>

<svelte:head><title>Attendance — Muallim</title></svelte:head>

<PageHeader
	title="Attendance"
	description="Take a section’s register for the day, and look back over one student’s attendance."
/>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- --------------------------------------------------------------- register -->
<section class="mt-8">
	<Sheet>
		{#snippet header()}
			<h2 class="font-medium">Take the register</h2>
			<p class="mt-0.5 text-sm text-muted">
				Choose a class, a section, and a day. Everyone starts present; change only those who are
				not.
			</p>
		{/snippet}

		<!-- The filter: a GET so a marked day is a shareable link. Changing any picker reloads. -->
		<form method="GET" class="grid gap-5 sm:grid-cols-3">
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

			<Field id="date" label="Date">
				{#snippet children({ id })}
					<Input
						{id}
						name="date"
						type="date"
						bind:value={selectDate}
						onchange={(event) => event.currentTarget.form?.requestSubmit()}
					/>
				{/snippet}
			</Field>
			<noscript><Button type="submit" variant="secondary">Load register</Button></noscript>
		</form>

		<!-- The roster, once a section is chosen. -->
		{#if !data.sectionId}
			<div class="mt-6">
				<EmptyState
					icon={Calendar03Icon}
					title="Pick a section to mark"
					description="Choose a class and section above and its register for the day appears here."
				/>
			</div>
		{:else if register.length === 0}
			<div class="mt-6">
				<EmptyState
					icon={UserMultiple02Icon}
					title="No students in this section"
					description="Admit students into this section and they will appear on the register."
				/>
			</div>
		{:else}
			<form
				method="POST"
				action="?/mark"
				class="mt-6"
				use:enhance={() => {
					saving = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						saving = false;
						if (result.type !== 'success') return;
						const marked = result.data?.marked as number | undefined;
						if (marked !== undefined) {
							toast.success(`The register is saved — ${marked} marked.`);
						}
					};
				}}
			>
				<input type="hidden" name="section_id" value={data.sectionId} />
				<input type="hidden" name="on_date" value={data.date} />

				<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
					<table class="w-full border-collapse text-sm">
						<caption class="sr-only"
							>Every student in the section, and their status for the day.</caption
						>
						<thead>
							<tr class="border-b border-border bg-surface-sunken text-left">
								<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Admission no.</th>
								<th scope="col" class="px-4 py-3 font-medium">Name</th>
								<th scope="col" class="px-4 py-3 font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{#each register as entry (entry.student_id)}
								<tr class="border-b border-border last:border-0">
									<td class="numeral px-4 py-3 whitespace-nowrap text-muted"
										>{entry.admission_no}</td
									>
									<th scope="row" class="px-4 py-3 text-left font-medium">{entry.full_name}</th>
									<td class="px-4 py-3">
										<input type="hidden" name="student_id" value={entry.student_id} />
										<Select name="status" value={entry.status} class="max-w-40">
											{#each ATTENDANCE_STATUSES as status (status)}
												<option value={status}>{statusLabel(status)}</option>
											{/each}
										</Select>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="mt-4 flex justify-end">
					<Button type="submit" loading={saving} disabled={saving}>
						<Icon icon={FloppyDiskIcon} class="size-4" />
						Save register
					</Button>
				</div>
			</form>
		{/if}
	</Sheet>
</section>

<!-- --------------------------------------------------------------- history -->
<section class="mt-8">
	<Sheet>
		{#snippet header()}
			<h2 class="font-medium">Student history</h2>
			<p class="mt-0.5 text-sm text-muted">
				Pick a student from the section above and a window of dates to see how they attended.
			</p>
		{/snippet}

		{#if register.length === 0}
			<EmptyState
				icon={UserMultiple02Icon}
				title="Choose a section first"
				description="A student’s history is looked up from the section on the register above."
			/>
		{:else}
			<form method="GET" class="grid gap-5 sm:grid-cols-3" onsubmit={checkHistory}>
				<!-- The register filter travels along so the page keeps its context on reload. -->
				<input type="hidden" name="class" value={data.classId} />
				<input type="hidden" name="section" value={data.sectionId} />
				<input type="hidden" name="date" value={data.date} />

				<div class="sm:col-span-3">
					<Field id="student" label="Student" error={historyProblem('student')}>
						{#snippet children({ id, describedBy, invalid })}
							<Select
								{id}
								{invalid}
								name="student"
								value={data.history?.student ?? ''}
								aria-describedby={describedBy}
							>
								<option value="">Choose a student</option>
								{#each register as entry (entry.student_id)}
									<option value={entry.student_id}>{entry.full_name}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>
				</div>

				<Field id="from" label="From" error={historyProblem('from')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="from"
							type="date"
							value={data.history?.from ?? ''}
							required
							aria-describedby={describedBy}
						/>
					{/snippet}
				</Field>

				<Field id="to" label="To" error={historyProblem('to')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="to"
							type="date"
							value={data.history?.to ?? ''}
							required
							aria-describedby={describedBy}
						/>
					{/snippet}
				</Field>

				<div class="flex items-end">
					<Button type="submit" variant="secondary">
						<Icon icon={CheckmarkCircle02Icon} class="size-4" />
						Show history
					</Button>
				</div>
			</form>

			{#if data.history?.summary}
				{@const s = data.history.summary}
				<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
					{#each [{ label: 'Present', value: s.present, tone: 'text-success-text' }, { label: 'Absent', value: s.absent, tone: 'text-danger-text' }, { label: 'Late', value: s.late, tone: 'text-warning-text' }, { label: 'Excused', value: s.excused, tone: 'text-text' }, { label: 'Total', value: s.total, tone: 'text-text' }] as tile (tile.label)}
						<div class="rounded-control bg-surface-sunken px-3 py-3">
							<p class={['text-2xl font-semibold tracking-tight', tile.tone]}>
								<Numeral value={tile.value} />
							</p>
							<p class="mt-0.5 text-xs text-muted">{tile.label}</p>
						</div>
					{/each}
				</div>

				{#if data.history.days.length === 0}
					<p class="mt-4 text-sm text-muted">No attendance was recorded in this window.</p>
				{:else}
					<ul class="mt-4 divide-y divide-border rounded-card bg-surface-raised shadow-card">
						{#each data.history.days as day (day.on_date)}
							<li class="flex items-center justify-between px-4 py-3">
								<span class="numeral text-sm">{longDate(day.on_date)}</span>
								<Badge tone={statusTone(day.status)}>{statusLabel(day.status)}</Badge>
							</li>
						{/each}
					</ul>
				{/if}
			{/if}
		{/if}
	</Sheet>
</section>
