<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		ArrowDown01Icon,
		Cancel01Icon,
		CheckmarkCircle02Icon,
		DocumentValidationIcon,
		RemoveCircleIcon,
		UserAdd01Icon
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
		Sheet,
		Textarea
	} from '$lib/components';
	import {
		ADMISSION_LIMITS,
		ADMISSION_STATUSES,
		admitAdmissionSchema,
		statusLabel,
		statusTone,
		submitAdmissionSchema,
		type Application
	} from '$lib/admissions';
	import { appendPage, canLoadMore, replaceRow, type Paged } from '$lib/paging';
	import type { Student } from '$lib/students';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const applicationKey = (application: Application) => application.id;

	// The rows on screen. Seeded by the server's first page; "Load more" appends the
	// next, and a decision or admission replaces a row in place.
	let applications = $derived(data.applications as Paged<Application>);

	// The class an applicant named, by id. The list comes from the page's class load.
	const classMap = $derived(new Map(data.classes.map((klass) => [klass.id, klass.name])));

	// The new student's admission number, by application id — so an admitted row can show
	// the roster entry it produced without a re-read.
	let admittedNos = $state<Record<string, string>>({});

	const submitDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
	const submitted = (application: Application) =>
		submitDate.format(new Date(application.submitted_at));

	let submitErrors = $state<FieldErrors>({});
	let admitErrors = $state<FieldErrors>({});

	let submitOpen = $state(false);
	let submitting = $state(false);
	let loadingMore = $state(false);

	// Which pending row is being decided, so its two buttons can show a spinner.
	let deciding = $state<string | null>(null);

	// The application the admit slide-over is open for, or null. Its class chooses the
	// section picker's options.
	let admitFor = $state<Application | null>(null);
	let admitting = $state(false);
	const admitSections = $derived(
		admitFor?.grade_level_id ? (data.sectionsByClass[admitFor.grade_level_id] ?? []) : []
	);

	function openAdmit(application: Application) {
		admitErrors = {};
		admitFor = application;
	}
</script>

<svelte:head><title>Admissions — Muallim</title></svelte:head>

<PageHeader
	title="Admissions"
	description="Applications to this institution, and the path from applied to admitted."
>
	{#snippet actions()}
		<Button onclick={() => (submitOpen = !submitOpen)}>
			<Icon icon={submitOpen ? Cancel01Icon : DocumentValidationIcon} class="size-4" />
			{submitOpen ? 'Close' : 'New application'}
		</Button>
	{/snippet}
</PageHeader>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ------------------------------------------------------------------ submit -->
{#if submitOpen}
	<form
		method="POST"
		action="?/submit"
		class="mt-6"
		use:enhance={validated(
			submitAdmissionSchema,
			(next) => (submitErrors = next),
			() => {
				submitting = true;
				return async ({ result, update }) => {
					// `invalidateAll: false` keeps the pages already loaded from being dropped.
					await update({ invalidateAll: false });
					submitting = false;
					if (result.type !== 'success') return;

					const created = result.data?.submitted as Application | undefined;
					if (created) {
						applications = { ...applications, rows: [created, ...applications.rows] };
						submitOpen = false;
						toast.success(`${created.applicant_name}’s application has been submitted.`);
					}
				};
			}
		)}
	>
		<Sheet open={submitOpen} onClose={() => (submitOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new application</h2>
				<p class="mt-0.5 text-sm text-muted">
					Only the applicant’s name is needed. The guardian’s details, the class applied for, and a
					note can come later.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="applicant_name" label="Applicant’s name" error={submitErrors.applicant_name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="applicant_name"
							autocomplete="off"
							placeholder="Fatima Rahman"
							aria-describedby={describedBy}
							{...ADMISSION_LIMITS.applicantName}
						/>
					{/snippet}
				</Field>

				<Field id="grade_level_id" label="Class applied for" error={submitErrors.grade_level_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="grade_level_id" aria-describedby={describedBy}>
							<option value="">Not decided yet</option>
							{#each data.classes as klass (klass.id)}
								<option value={klass.id}>{klass.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="guardian_name" label="Guardian’s name" error={submitErrors.guardian_name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="guardian_name"
							autocomplete="off"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...ADMISSION_LIMITS.guardianName}
						/>
					{/snippet}
				</Field>

				<Field id="dob" label="Date of birth" error={submitErrors.dob}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="dob"
							aria-describedby={describedBy}
							{...ADMISSION_LIMITS.dob}
						/>
					{/snippet}
				</Field>

				<Field id="guardian_phone" label="Guardian’s phone" error={submitErrors.guardian_phone}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="guardian_phone"
							inputmode="tel"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...ADMISSION_LIMITS.guardianPhone}
						/>
					{/snippet}
				</Field>

				<Field id="guardian_email" label="Guardian’s email" error={submitErrors.guardian_email}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="guardian_email"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...ADMISSION_LIMITS.guardianEmail}
						/>
					{/snippet}
				</Field>

				<div class="sm:col-span-2">
					<Field id="note" label="Note" error={submitErrors.note}>
						{#snippet children({ id, describedBy, invalid })}
							<Textarea
								{id}
								{invalid}
								name="note"
								placeholder="Anything the office should know."
								aria-describedby={describedBy}
								{...ADMISSION_LIMITS.note}
							/>
						{/snippet}
					</Field>
				</div>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={submitting} disabled={submitting}>
					<Icon icon={DocumentValidationIcon} class="size-4" />
					Submit application
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- -------------------------------------------------------------------- admit -->
{#if admitFor}
	{@const application = admitFor}
	<form
		method="POST"
		action="?/admit"
		class="mt-6"
		use:enhance={validated(
			admitAdmissionSchema,
			(next) => (admitErrors = next),
			() => {
				admitting = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					admitting = false;
					if (result.type !== 'success') return;

					const outcome = result.data?.admitted as
						{ application: Application; student: Student } | undefined;
					if (outcome) {
						applications = replaceRow(
							applications,
							applicationKey,
							outcome.application.id,
							outcome.application
						);
						admittedNos = {
							...admittedNos,
							[outcome.application.id]: outcome.student.admission_no
						};
						admitFor = null;
						toast.success(`Admitted ${outcome.application.applicant_name}.`);
					}
				};
			}
		)}
	>
		<input type="hidden" name="id" value={application.id} />
		<Sheet open={admitFor !== null} onClose={() => (admitFor = null)}>
			{#snippet header()}
				<h2 class="font-medium">Admit {application.applicant_name}</h2>
				<p class="mt-0.5 text-sm text-muted">
					This creates the student{application.guardian_name ? ' and their guardian' : ''}. An
					admission number is required; the section and roll place them.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="admission_no" label="Admission number" error={admitErrors.admission_no}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="admission_no"
							placeholder="2026-0148"
							aria-describedby={describedBy}
							{...ADMISSION_LIMITS.admissionNo}
						/>
					{/snippet}
				</Field>

				<Field id="roll" label="Roll number" error={admitErrors.roll}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="roll"
							inputmode="numeric"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...ADMISSION_LIMITS.roll}
						/>
					{/snippet}
				</Field>

				<div class="sm:col-span-2">
					<Field id="section_id" label="Section" error={admitErrors.section_id}>
						{#snippet children({ id, describedBy, invalid })}
							<Select
								{id}
								{invalid}
								name="section_id"
								aria-describedby={describedBy}
								disabled={admitSections.length === 0}
							>
								<option value="">
									{application.grade_level_id ? 'No section' : 'No class applied for'}
								</option>
								{#each admitSections as section (section.id)}
									<option value={section.id}>{section.name}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>
				</div>
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
		<Field id="status-filter" label="Filter by status">
			{#snippet children({ id })}
				<Select
					{id}
					name="status"
					value={data.status}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				>
					<option value="">All applications</option>
					{#each ADMISSION_STATUSES as s (s)}
						<option value={s}>{statusLabel(s)}</option>
					{/each}
				</Select>
			{/snippet}
		</Field>
	</div>
	<!-- A working control without JS: the button submits the same GET. -->
	<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
</form>

<!-- --------------------------------------------------------------- applications -->
<section class="mt-4">
	{#if applications.rows.length === 0}
		<EmptyState
			icon={DocumentValidationIcon}
			title={data.status ? 'No applications with this status' : 'No applications yet'}
			description={data.status
				? 'Choose another status, or submit an application.'
				: 'Submit the first application and it will appear here.'}
		/>
	{:else}
		<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
			<table class="w-full border-collapse text-sm">
				<caption class="sr-only">
					Every application: the applicant, the guardian, the class applied for, its status, when it
					was submitted, and what can be done with it.
				</caption>

				<thead>
					<tr class="border-b border-border bg-surface-sunken text-left">
						<th scope="col" class="px-4 py-3 font-medium">Applicant</th>
						<th scope="col" class="px-4 py-3 font-medium">Guardian</th>
						<th scope="col" class="px-4 py-3 font-medium">Class</th>
						<th scope="col" class="px-4 py-3 font-medium">Status</th>
						<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Submitted</th>
						<th scope="col" class="px-4 py-3 font-medium"><span class="sr-only">Actions</span></th>
					</tr>
				</thead>

				<tbody>
					{#each applications.rows as application (application.id)}
						<tr class="border-b border-border last:border-0 hover:bg-surface-sunken">
							<th scope="row" class="px-4 py-3 text-left font-medium">
								{application.applicant_name}
							</th>
							<td class="px-4 py-3 text-muted">
								{#if application.guardian_name}
									{application.guardian_name}
									{#if application.guardian_phone}
										<span class="numeral block text-xs">{application.guardian_phone}</span>
									{/if}
								{:else}
									—
								{/if}
							</td>
							<td class="px-4 py-3 text-muted">
								{application.grade_level_id
									? (classMap.get(application.grade_level_id) ?? '—')
									: '—'}
							</td>
							<td class="px-4 py-3">
								<Badge tone={statusTone(application.status)}
									>{statusLabel(application.status)}</Badge
								>
								{#if application.status === 'admitted' && admittedNos[application.id]}
									<span class="numeral block text-xs text-muted">
										No. {admittedNos[application.id]}
									</span>
								{/if}
							</td>
							<td class="numeral px-4 py-3 whitespace-nowrap text-muted">
								{submitted(application)}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-1">
									{#if application.status === 'pending'}
										<form
											method="POST"
											action="?/accept"
											use:enhance={() => {
												deciding = application.id;
												return async ({ result }) => {
													deciding = null;
													if (result.type !== 'success') return applyAction(result);
													const decided = result.data?.decided as Application | undefined;
													if (decided) {
														applications = replaceRow(
															applications,
															applicationKey,
															application.id,
															decided
														);
														toast.success(`${application.applicant_name}’s application accepted.`);
													}
												};
											}}
										>
											<input type="hidden" name="id" value={application.id} />
											<Button
												type="submit"
												size="sm"
												variant="ghost"
												loading={deciding === application.id}
												disabled={deciding === application.id}
											>
												<Icon icon={CheckmarkCircle02Icon} class="size-4" />
												Accept
											</Button>
										</form>
										<form
											method="POST"
											action="?/reject"
											use:enhance={() => {
												deciding = application.id;
												return async ({ result }) => {
													deciding = null;
													if (result.type !== 'success') return applyAction(result);
													const decided = result.data?.decided as Application | undefined;
													if (decided) {
														applications = replaceRow(
															applications,
															applicationKey,
															application.id,
															decided
														);
														toast.success(`${application.applicant_name}’s application rejected.`);
													}
												};
											}}
										>
											<input type="hidden" name="id" value={application.id} />
											<Button
												type="submit"
												size="sm"
												variant="ghost"
												loading={deciding === application.id}
												disabled={deciding === application.id}
												aria-label="Reject {application.applicant_name}’s application"
											>
												<Icon icon={RemoveCircleIcon} class="size-4" />
											</Button>
										</form>
									{:else if application.status === 'accepted'}
										<Button size="sm" variant="ghost" onclick={() => openAdmit(application)}>
											<Icon icon={UserAdd01Icon} class="size-4" />
											Admit
										</Button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- No total: muallim-api runs no COUNT(*), so nothing here claims one. The button
		     is the only thing that knows there is more, and it goes when there is not. -->
		{#if canLoadMore(applications)}
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
						const next = result.data?.more as Paged<Application> | undefined;
						if (next) applications = appendPage(applications, next, applicationKey);
					};
				}}
			>
				<input type="hidden" name="cursor" value={applications.cursor} />
				<input type="hidden" name="status" value={data.status} />
				<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
					<Icon icon={ArrowDown01Icon} class="size-4" />
					Load more applications
				</Button>
			</form>
		{/if}
	{/if}
</section>
