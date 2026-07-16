<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowLeft01Icon,
		Cancel01Icon,
		Delete02Icon,
		FloppyDiskIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Field,
		Icon,
		Input,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import {
		STAFF_LIMITS,
		STAFF_ROLES,
		STAFF_STATUSES,
		roleLabel,
		statusLabel,
		statusTone,
		updateStaffSchema,
		type Staff
	} from '$lib/staff';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Writable $derived: the server seeds it, and a saved edit updates the row in place.
	let member = $derived(data.staff as Staff);

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	let saving = $state(false);
	let confirmRemove = $state(false);
	let removing = $state(false);
</script>

<svelte:head><title>{member.full_name} — Muallim</title></svelte:head>

<a
	href={resolve('/manage/staff')}
	class="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
>
	<Icon icon={ArrowLeft01Icon} class="size-4" />
	All staff
</a>

<div class="mt-4">
	<PageHeader title={member.full_name}>
		{#snippet meta()}
			{#if member.staff_no}
				<span class="numeral text-muted">Staff no. {member.staff_no}</span>
			{/if}
			<span class="text-muted">{roleLabel(member.role)}</span>
			<Badge tone={statusTone(member.status)}>{statusLabel(member.status)}</Badge>
		{/snippet}
	</PageHeader>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<div class="mt-8 max-w-2xl">
	<!-- ---------------------------------------------------------- edit record -->
	<form
		method="POST"
		action="?/update"
		use:enhance={validated(
			updateStaffSchema,
			(next) => (errors = next),
			() => {
				saving = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					saving = false;

					if (result.type !== 'success') return;

					const updated = result.data?.updated as Staff | undefined;
					if (updated) {
						member = updated;
						toast.success('The member’s details have been saved.');
					}
				};
			}
		)}
	>
		<Sheet>
			{#snippet header()}
				<h2 class="font-medium">Details</h2>
				<p class="mt-0.5 text-sm text-muted">Their name, role, standing, and how to reach them.</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="full_name" label="Full name" error={problem('full_name')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="full_name"
							value={member.full_name}
							aria-describedby={describedBy}
							{...STAFF_LIMITS.fullName}
						/>
					{/snippet}
				</Field>

				<Field id="role" label="Role" error={problem('role')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="role" value={member.role} aria-describedby={describedBy}>
							{#each STAFF_ROLES as role (role)}
								<option value={role}>{roleLabel(role)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="status" label="Status" error={problem('status')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="status"
							value={member.status}
							aria-describedby={describedBy}
						>
							{#each STAFF_STATUSES as status (status)}
								<option value={status}>{statusLabel(status)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="joined_on" label="Joining date" error={problem('joined_on')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="joined_on"
							value={member.joined_on || ''}
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
							value={member.email || ''}
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
							value={member.phone || ''}
							aria-describedby={describedBy}
							{...STAFF_LIMITS.phone}
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
</div>

<!-- ----------------------------------------------------------- danger zone -->
<section class="mt-10 max-w-2xl rounded-card border border-danger-border bg-danger-surface/40 p-5">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="min-w-0">
			<h2 class="font-medium text-danger-text">Remove member</h2>
			<p class="mt-0.5 text-sm text-muted">Take {member.full_name} off the staff roster.</p>
		</div>

		{#if confirmRemove}
			<form
				method="POST"
				action="?/remove"
				class="flex shrink-0 items-center gap-2"
				use:enhance={() => {
					removing = true;
					return async ({ result }) => {
						// On success the action redirects to the roster; only a failure lands here.
						removing = false;
						confirmRemove = false;
						await applyAction(result);
					};
				}}
			>
				<Button type="submit" variant="danger" loading={removing} disabled={removing}>
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
				Remove member
			</Button>
		{/if}
	</div>
</section>
