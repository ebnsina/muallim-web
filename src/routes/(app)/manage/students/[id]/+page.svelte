<script lang="ts">
	import { untrack } from 'svelte';
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowLeft01Icon,
		Call02Icon,
		Cancel01Icon,
		Delete02Icon,
		FloppyDiskIcon,
		Mail01Icon,
		StarIcon,
		UserAdd01Icon,
		UserLock01Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Checkbox,
		EmptyState,
		Field,
		Icon,
		Input,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import {
		LIMITS,
		STUDENT_STATUSES,
		guardianAccountSchema,
		guardianSchema,
		updateStudentSchema
	} from '$lib/schemas';
	import { statusLabel, statusTone, type Guardian, type Student } from '$lib/students';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Writable $derived: the server seeds them, and a saved edit or a guardian change
	// updates the row in place rather than re-reading the record.
	let student = $derived(data.student as Student);
	let guardians = $derived(data.guardians as Guardian[]);

	let editErrors = $state<FieldErrors>({});
	let guardianErrors = $state<FieldErrors>({});
	const editProblem = (field: string) => editErrors[field] ?? form?.errors?.[field];
	const guardianProblem = (field: string) => guardianErrors[field] ?? form?.errors?.[field];

	// The edit form's pickers. Seeded from the record, resynced when the route moves to
	// another student, and the section is dropped whenever it stops belonging to the class.
	let editClass = $state(untrack(() => data.student.grade_level_id ?? ''));
	let editSection = $state(untrack(() => data.student.section_id ?? ''));
	let syncedId = untrack(() => data.student.id);
	$effect(() => {
		if (data.student.id !== syncedId) {
			syncedId = data.student.id;
			editClass = data.student.grade_level_id ?? '';
			editSection = data.student.section_id ?? '';
		}
	});

	const editSections = $derived(editClass ? (data.sectionsByClass[editClass] ?? []) : []);
	$effect(() => {
		if (editSection !== '' && !editSections.some((section) => section.id === editSection)) {
			editSection = '';
		}
	});

	let saving = $state(false);
	let addingGuardian = $state(false);
	let removing = $state<string | null>(null);
	let confirming = $state<string | null>(null);
	let confirmRemove = $state(false);
	let removingStudent = $state(false);

	// ------------------------------------------------------- guardian sign-in
	let linkingGuardian = $state<Guardian | null>(null);
	let linking = $state(false);
	let linkErrors = $state<FieldErrors>({});
	const linkProblem = (field: string) => linkErrors[field] ?? form?.errors?.[field];

	// The guardian's own address is the best guess at which person they are, so the
	// picker opens on it. It stays a guess — the school confirms it before saving.
	let linkUser = $state('');
	function openLink(guardian: Guardian) {
		const match = guardian.email
			? data.members.find((m) => m.email.toLowerCase() === guardian.email?.toLowerCase())
			: undefined;
		linkUser = match?.user_id ?? '';
		linkErrors = {};
		linkingGuardian = guardian;
	}

	const chosenMember = $derived(data.members.find((m) => m.user_id === linkUser));
</script>

<svelte:head><title>{student.full_name} — Muallim</title></svelte:head>

<a
	href={resolve('/manage/students')}
	class="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
>
	<Icon icon={ArrowLeft01Icon} class="size-4" />
	All students
</a>

<div class="mt-4">
	<PageHeader title={student.full_name}>
		{#snippet meta()}
			<span class="numeral text-muted">Admission no. {student.admission_no}</span>
			<Badge tone={statusTone(student.status)}>{statusLabel(student.status)}</Badge>
		{/snippet}
	</PageHeader>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
	<!-- ------------------------------------------------------------ edit record -->
	<form
		method="POST"
		action="?/update"
		use:enhance={validated(
			updateStudentSchema,
			(next) => (editErrors = next),
			() => {
				saving = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					saving = false;

					if (result.type !== 'success') return;

					const updated = result.data?.updated as Student | undefined;
					if (updated) {
						student = updated;
						toast.success('The student’s details have been saved.');
					}
				};
			}
		)}
	>
		<Sheet>
			{#snippet header()}
				<h2 class="font-medium">Details</h2>
				<p class="mt-0.5 text-sm text-muted">
					Their name, standing, and where they sit. Leaving a placement blank means the student is
					not yet placed.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="full_name" label="Full name" error={editProblem('full_name')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="full_name"
							value={student.full_name}
							aria-describedby={describedBy}
							{...LIMITS.studentName}
						/>
					{/snippet}
				</Field>

				<Field id="status" label="Status" error={editProblem('status')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="status"
							value={student.status}
							aria-describedby={describedBy}
						>
							{#each STUDENT_STATUSES as status (status)}
								<option value={status}>{statusLabel(status)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="grade_level_id" label="Class" error={editProblem('grade_level_id')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="grade_level_id"
							aria-describedby={describedBy}
							bind:value={editClass}
						>
							<option value="">Not placed</option>
							{#each data.classes as klass (klass.id)}
								<option value={klass.id}>{klass.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="section_id" label="Section" error={editProblem('section_id')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="section_id"
							aria-describedby={describedBy}
							bind:value={editSection}
							disabled={editSections.length === 0}
						>
							<option value="">{editClass ? 'No section' : 'Choose a class first'}</option>
							{#each editSections as section (section.id)}
								<option value={section.id}>{section.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="roll" label="Roll number" error={editProblem('roll')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="roll"
							inputmode="numeric"
							value={student.roll || ''}
							aria-describedby={describedBy}
							{...LIMITS.roll}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={saving} disabled={saving}>
					<Icon icon={FloppyDiskIcon} class="size-4" />
					Save changes
				</Button>
			{/snippet}
		</Sheet>
	</form>

	<!-- ------------------------------------------------------------- guardians -->
	<section>
		<h2 class="text-lg font-semibold">Guardians</h2>
		<p class="mt-1 text-sm text-muted">Who the school reaches about this student.</p>

		{#if guardians.length === 0}
			<div class="mt-4">
				<EmptyState
					icon={UserAdd01Icon}
					title="No guardians yet"
					description="Add a parent or guardian below so the school has someone to contact."
				/>
			</div>
		{:else}
			<ul class="mt-4 space-y-3">
				{#each guardians as guardian (guardian.id)}
					<li class="rounded-card border border-border bg-surface-raised p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<span class="font-medium">{guardian.full_name}</span>
									{#if guardian.is_primary}
										<Badge tone="accent" icon={StarIcon}>Primary</Badge>
									{/if}
									{#if guardian.relation}
										<span class="text-sm text-muted">{guardian.relation}</span>
									{/if}
								</div>

								{#if guardian.phone || guardian.email}
									<div class="mt-2 flex flex-col gap-1 text-sm text-muted">
										{#if guardian.phone}
											<a
												href="tel:{guardian.phone}"
												class="numeral inline-flex w-fit items-center gap-1.5 underline-offset-4 hover:text-text hover:underline"
											>
												<Icon icon={Call02Icon} class="size-3.5" />
												{guardian.phone}
											</a>
										{/if}
										{#if guardian.email}
											<a
												href="mailto:{guardian.email}"
												class="inline-flex w-fit items-center gap-1.5 underline-offset-4 hover:text-text hover:underline"
											>
												<Icon icon={Mail01Icon} class="size-3.5" />
												{guardian.email}
											</a>
										{/if}
									</div>
								{/if}
							</div>

							{#if confirming === guardian.id}
								<form
									method="POST"
									action="?/removeGuardian"
									class="flex shrink-0 items-center gap-2"
									use:enhance={() => {
										removing = guardian.id;
										return async ({ result }) => {
											removing = null;
											confirming = null;

											if (result.type !== 'success') return applyAction(result);

											guardians = guardians.filter((g) => g.id !== guardian.id);
											toast.success(`${guardian.full_name} is no longer a guardian.`);
										};
									}}
								>
									<input type="hidden" name="guardian_id" value={guardian.id} />
									<Button
										type="submit"
										variant="danger"
										size="sm"
										loading={removing === guardian.id}
										disabled={removing === guardian.id}
										aria-label="Yes, remove {guardian.full_name}"
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
								<div class="flex shrink-0 items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => openLink(guardian)}
										aria-label="Give {guardian.full_name} a sign-in"
									>
										<Icon icon={UserLock01Icon} class="size-4" />
										Sign-in
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => (confirming = guardian.id)}
										aria-label="Remove {guardian.full_name}"
									>
										<Icon icon={Delete02Icon} class="size-4" />
									</Button>
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}

		<!-- Add a guardian -->
		<form
			method="POST"
			action="?/addGuardian"
			class="mt-4"
			use:enhance={validated(
				guardianSchema,
				(next) => (guardianErrors = next),
				() => {
					addingGuardian = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						addingGuardian = false;

						if (result.type !== 'success') return;

						const added = result.data?.added as Guardian | undefined;
						if (added) {
							// A new primary demotes the rest — muallim-api keeps at most one, so the
							// list must reflect that rather than showing two.
							const rest = added.is_primary
								? guardians.map((g) => ({ ...g, is_primary: false }))
								: guardians;
							guardians = added.is_primary ? [added, ...rest] : [...rest, added];
							toast.success(`${added.full_name} has been added.`);
						}
					};
				}
			)}
		>
			<Sheet>
				{#snippet header()}
					<h3 class="font-medium">Add a guardian</h3>
				{/snippet}

				<div class="space-y-5">
					<Field id="guardian_name" label="Full name" error={guardianProblem('full_name')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="full_name"
								placeholder="Abdul Karim"
								aria-describedby={describedBy}
								{...LIMITS.guardianName}
							/>
						{/snippet}
					</Field>

					<Field id="relation" label="Relation" error={guardianProblem('relation')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="relation"
								placeholder="Father, mother, guardian…"
								aria-describedby={describedBy}
								{...LIMITS.guardianRelation}
							/>
						{/snippet}
					</Field>

					<Field id="phone" label="Phone" error={guardianProblem('phone')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="phone"
								type="tel"
								autocomplete="tel"
								placeholder="+8801XXXXXXXXX"
								aria-describedby={describedBy}
								{...LIMITS.guardianPhone}
							/>
						{/snippet}
					</Field>

					<Field id="guardian_email" label="Email" error={guardianProblem('email')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="email"
								autocomplete="email"
								placeholder="Optional"
								aria-describedby={describedBy}
								{...LIMITS.guardianEmail}
							/>
						{/snippet}
					</Field>

					<label class="flex items-center gap-2.5 text-sm">
						<Checkbox name="is_primary" />
						The first person the school should call
					</label>
				</div>

				{#snippet footer()}
					<Button type="submit" loading={addingGuardian} disabled={addingGuardian}>
						<Icon icon={UserAdd01Icon} class="size-4" />
						Add guardian
					</Button>
				{/snippet}
			</Sheet>
		</form>
	</section>
</div>

<!-- --------------------------------------------------- give a guardian a sign-in -->
{#if linkingGuardian}
	{@const guardian = linkingGuardian}
	<form
		method="POST"
		action="?/linkAccount"
		use:enhance={validated(
			guardianAccountSchema,
			(next) => (linkErrors = next),
			() => {
				linking = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false, reset: false });
					linking = false;

					if (result.type !== 'success') return;

					linkingGuardian = null;
					toast.success(`${guardian.full_name} can now sign in and read this student’s pages.`);
				};
			}
		)}
	>
		<Sheet open={linkingGuardian !== null} onClose={() => (linkingGuardian = null)}>
			{#snippet header()}
				<h2 class="font-medium">Give {guardian.full_name} a sign-in</h2>
				<p class="mt-0.5 text-sm text-muted">
					Choose the person in this workspace who already has an account.
				</p>
			{/snippet}

			<input type="hidden" name="guardian_id" value={guardian.id} />

			{#if data.members.length === 0}
				<!-- The list is empty either because nobody has joined or because this reader may
				     not see it. Both leave the same nothing to pick from, so say the useful half. -->
				<Alert tone="warning">
					Nobody in this workspace can be picked yet. Invite {guardian.full_name} from the People page
					first, then come back here.
				</Alert>
			{:else}
				<div class="space-y-5">
					<Field
						id="guardian_user"
						label="Who signs in"
						hint="Only people who already have an account here can be chosen."
						error={linkProblem('user_id')}
					>
						{#snippet children({ id, describedBy, invalid })}
							<Select
								{id}
								{invalid}
								name="user_id"
								bind:value={linkUser}
								aria-describedby={describedBy}
							>
								<option value="">Choose a person…</option>
								{#each data.members as member (member.user_id)}
									<option value={member.user_id}>{member.name} — {member.email}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>

					<!-- Saying it plainly, and only once something is picked: this hands a real person
					     a real view of a real child, and the name is the part worth checking. -->
					{#if chosenMember}
						<Alert tone="warning">
							{chosenMember.name} will be able to sign in and read {student.full_name}’s attendance,
							fees and progress. Only do this if they are {guardian.full_name}.
						</Alert>
					{/if}
				</div>
			{/if}

			{#snippet footer()}
				<Button type="button" variant="ghost" onclick={() => (linkingGuardian = null)}
					>Cancel</Button
				>
				<Button type="submit" loading={linking} disabled={linking || data.members.length === 0}>
					<Icon icon={UserLock01Icon} class="size-4" />
					Give access
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- danger zone -->
<section class="mt-10 rounded-card border border-danger-border bg-danger-surface/40 p-5">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="min-w-0">
			<h2 class="font-medium text-danger-text">Remove student</h2>
			<p class="mt-0.5 text-sm text-muted">
				Take {student.full_name} off the roster. Their guardians are unlinked with them.
			</p>
		</div>

		{#if confirmRemove}
			<form
				method="POST"
				action="?/remove"
				class="flex shrink-0 items-center gap-2"
				use:enhance={() => {
					removingStudent = true;
					return async ({ result }) => {
						// On success the action redirects to the roster; only a failure lands here.
						removingStudent = false;
						confirmRemove = false;
						await applyAction(result);
					};
				}}
			>
				<Button type="submit" variant="danger" loading={removingStudent} disabled={removingStudent}>
					<Icon icon={Delete02Icon} class="size-4" />
					Yes, remove
				</Button>
				<Button type="button" variant="ghost" onclick={() => (confirmRemove = false)}>
					<Icon icon={Cancel01Icon} class="size-4" />
					Cancel
				</Button>
			</form>
		{:else}
			<Button type="button" variant="danger" onclick={() => (confirmRemove = true)}>
				<Icon icon={Delete02Icon} class="size-4" />
				Remove student
			</Button>
		{/if}
	</div>
</section>
