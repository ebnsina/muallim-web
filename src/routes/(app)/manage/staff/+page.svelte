<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		Cancel01Icon,
		UserAdd01Icon,
		UserGroupIcon
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
	import {
		STAFF_LIMITS,
		STAFF_ROLES,
		hireStaffSchema,
		roleLabel,
		statusLabel,
		statusTone,
		type Staff
	} from '$lib/staff';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const staffKey = (member: Staff) => member.id;

	// The rows on screen. Seeded by the server's first page; "Load more" appends the
	// next, and hiring one puts it at the head.
	let staff = $derived(data.staff as Paged<Staff>);

	let hireOpen = $state(false);
	let hiring = $state(false);
	let loadingMore = $state(false);
</script>

<svelte:head><title>Staff — Muallim</title></svelte:head>

<PageHeader title="Staff" description="Everyone who runs this institution, and how to hire more.">
	{#snippet actions()}
		<Button onclick={() => (hireOpen = !hireOpen)}>
			<Icon icon={hireOpen ? Cancel01Icon : UserAdd01Icon} class="size-4" />
			{hireOpen ? 'Close' : 'Hire staff'}
		</Button>
	{/snippet}
</PageHeader>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- -------------------------------------------------------------------- hire -->
{#if hireOpen}
	<form
		method="POST"
		action="?/hire"
		class="mt-6"
		use:enhance={validated(
			hireStaffSchema,
			(next) => (errors = next),
			() => {
				hiring = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					hiring = false;

					if (result.type !== 'success') return;

					const hired = result.data?.hired as Staff | undefined;
					if (hired) {
						staff = { ...staff, rows: [hired, ...staff.rows] };
						hireOpen = false;
						toast.success(`${hired.full_name} has been hired.`);
					}
				};
			}
		)}
	>
		<Sheet open={hireOpen} onClose={() => (hireOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Hire a member</h2>
				<p class="mt-0.5 text-sm text-muted">
					A name and a role are all that is needed. A staff number, contact details, and a joining
					date can be set now or later.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="full_name" label="Full name" error={problem('full_name')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="full_name"
							autocomplete="off"
							placeholder="Ayesha Siddiqua"
							aria-describedby={describedBy}
							{...STAFF_LIMITS.fullName}
						/>
					{/snippet}
				</Field>

				<Field id="role" label="Role" error={problem('role')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="role" value="teacher" aria-describedby={describedBy}>
							{#each STAFF_ROLES as role (role)}
								<option value={role}>{roleLabel(role)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="staff_no" label="Staff number" error={problem('staff_no')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="staff_no"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...STAFF_LIMITS.staffNo}
						/>
					{/snippet}
				</Field>

				<Field id="joined_on" label="Joining date" error={problem('joined_on')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="joined_on"
							aria-describedby={describedBy}
							{...STAFF_LIMITS.joinedOn}
						/>
					{/snippet}
				</Field>

				<Field id="email" label="Email" error={problem('email')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="email"
							autocomplete="email"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...STAFF_LIMITS.email}
						/>
					{/snippet}
				</Field>

				<Field id="phone" label="Phone" error={problem('phone')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="phone"
							type="tel"
							autocomplete="tel"
							placeholder="+8801XXXXXXXXX"
							aria-describedby={describedBy}
							{...STAFF_LIMITS.phone}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={hiring} disabled={hiring}>
					<Icon icon={UserAdd01Icon} class="size-4" />
					Hire member
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------------ filter -->
<form method="GET" class="mt-8 flex flex-wrap items-end gap-3">
	<div class="w-full max-w-xs">
		<Field id="role-filter" label="Filter by role">
			{#snippet children({ id })}
				<Select
					{id}
					name="role"
					value={data.role}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				>
					<option value="">All roles</option>
					{#each STAFF_ROLES as role (role)}
						<option value={role}>{roleLabel(role)}</option>
					{/each}
				</Select>
			{/snippet}
		</Field>
	</div>
	<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
</form>

<!-- ------------------------------------------------------------------ roster -->
<section class="mt-4">
	{#if staff.rows.length === 0}
		<EmptyState
			icon={UserGroupIcon}
			title={data.role ? 'No staff in this role' : 'No staff yet'}
			description={data.role
				? 'Choose another role, or hire someone into this one.'
				: 'Hire your first member and they will appear here.'}
		/>
	{:else}
		<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
			<table class="w-full border-collapse text-sm">
				<caption class="sr-only">
					Every member of staff: their number, name, role, contact, and status.
				</caption>

				<thead>
					<tr class="border-b border-border bg-surface-sunken text-left">
						<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Staff no.</th>
						<th scope="col" class="px-4 py-3 font-medium">Name</th>
						<th scope="col" class="px-4 py-3 font-medium">Role</th>
						<th scope="col" class="px-4 py-3 font-medium">Contact</th>
						<th scope="col" class="px-4 py-3 font-medium">Status</th>
					</tr>
				</thead>

				<tbody>
					{#each staff.rows as member (member.id)}
						<tr class="border-b border-border last:border-0 hover:bg-surface-sunken">
							<td class="numeral px-4 py-3 whitespace-nowrap text-muted"
								>{member.staff_no || '—'}</td
							>
							<th scope="row" class="px-4 py-3 text-left font-medium">
								<a
									href={resolve(`/manage/staff/${member.id}`)}
									class="rounded-control underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								>
									{member.full_name}
								</a>
							</th>
							<td class="px-4 py-3 text-muted">{roleLabel(member.role)}</td>
							<td class="px-4 py-3 text-muted">
								{member.email || member.phone || '—'}
							</td>
							<td class="px-4 py-3">
								<Badge tone={statusTone(member.status)}>{statusLabel(member.status)}</Badge>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if canLoadMore(staff)}
			<form
				method="POST"
				action="?/more"
				class="mt-4 flex justify-center"
				use:enhance={() => {
					loadingMore = true;
					return async ({ result }) => {
						loadingMore = false;
						if (result.type !== 'success') return applyAction(result);

						const next = result.data?.more as Paged<Staff> | undefined;
						if (next) staff = appendPage(staff, next, staffKey);
					};
				}}
			>
				<input type="hidden" name="cursor" value={staff.cursor} />
				<input type="hidden" name="role" value={data.role} />
				<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
					<Icon icon={ArrowDown01Icon} class="size-4" />
					Load more staff
				</Button>
			</form>
		{/if}
	{/if}
</section>
