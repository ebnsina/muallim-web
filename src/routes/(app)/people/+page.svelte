<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Alert02Icon,
		CheckmarkCircle02Icon,
		Clock01Icon,
		Mail01Icon,
		UnavailableIcon,
		UserAdd01Icon,
		UserMultiple02Icon,
		UserRemove01Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		EmptyState,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import { invitationTone, isOutstanding, memberTone, roleHint, roleLabel } from '$lib/people';
	import { LIMITS, ROLES, invitationSchema, memberRoleSchema, type Role } from '$lib/schemas';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	/*
		What each picker is showing. Seeded from the server and reassigned as a whole —
		a refused change (your own role, the last owner) puts the old one back, because
		a control left displaying a change the API rejected is a lie about the workspace.
	*/
	let roles = $derived(
		Object.fromEntries(data.members.map((m) => [m.user_id, m.role])) as Record<string, Role>
	);

	let saving = $state<string | null>(null);
	let confirming = $state<string | null>(null);
	let removing = $state<string | null>(null);
	let withdrawing = $state<string | null>(null);
	let inviting = $state(false);

	// The role the invite form is asking for, so its hint can say what it means.
	let inviteRole = $state<Role>('student');
</script>

<svelte:head><title>People — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader
		title="People"
		description="Everyone in this workspace, what they may do, and who has been asked to join."
	/>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<!-- ---------------------------------------------------------------- members -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold">Members</h2>

		{#if data.members.length === 0}
			<div class="mt-4">
				<EmptyState
					icon={UserMultiple02Icon}
					title="Nobody here yet"
					description="Invite someone below and they will appear here once they accept."
				/>
			</div>
		{:else}
			<div class="mt-4 overflow-x-auto rounded-card bg-surface-raised shadow-card">
				<table class="w-full border-collapse text-sm">
					<caption class="sr-only">
						Every member: their name, address, role, and whether they may sign in.
					</caption>

					<thead>
						<tr class="border-b border-border bg-surface-sunken text-left">
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Name</th>
							<th scope="col" class="px-4 py-3 font-medium">Email</th>
							<th scope="col" class="w-44 px-4 py-3 font-medium">Role</th>
							<th scope="col" class="px-4 py-3 font-medium">Status</th>
							<!-- Wide enough for the question the button turns into: asking must not
							     widen the table under the reader. -->
							<th scope="col" class="w-52 px-4 py-3 text-right font-medium">
								<span class="sr-only">Remove</span>
							</th>
						</tr>
					</thead>

					<tbody>
						{#each data.members as member (member.user_id)}
							<tr class="border-b border-border last:border-0 hover:bg-surface-sunken">
								<th scope="row" class="px-4 py-3 text-left font-medium whitespace-nowrap">
									{member.name}
								</th>

								<td class="px-4 py-3">
									<span class="flex flex-wrap items-center gap-2">
										<span class="text-muted">{member.email}</span>
										{#if !member.email_verified}
											<Badge tone="warning" icon={Alert02Icon}>Unverified</Badge>
										{/if}
									</span>
								</td>

								<td class="px-4 py-3">
									<!-- The picker is the form. muallim-api decides whether the change stands. -->
									<form
										method="POST"
										action="?/role"
										use:enhance={validated(
											memberRoleSchema,
											(next) => (errors = next),
											({ formData }) => {
												const chosen = String(formData.get('role')) as Role;
												saving = member.user_id;

												return async ({ result, update }) => {
													await update();
													saving = null;

													// Refused. `member` is the row the server last sent, so its role is
													// the one that still stands.
													if (result.type === 'failure' || result.type === 'error') {
														roles = { ...roles, [member.user_id]: member.role };
														return;
													}
													toast.success(`${member.name}'s role is now ${roleLabel(chosen)}.`);
												};
											}
										)}
									>
										<input type="hidden" name="user_id" value={member.user_id} />
										<Select
											name="role"
											aria-label="Role for {member.name}, {member.email}"
											value={roles[member.user_id]}
											disabled={saving === member.user_id}
											onchange={(event) => {
												roles = {
													...roles,
													[member.user_id]: event.currentTarget.value as Role
												};
												event.currentTarget.form?.requestSubmit();
											}}
										>
											{#each ROLES as role (role)}
												<option value={role}>{roleLabel(role)}</option>
											{/each}
										</Select>
									</form>
								</td>

								<td class="px-4 py-3">
									<Badge
										tone={memberTone(member.status)}
										icon={member.status === 'active' ? CheckmarkCircle02Icon : UnavailableIcon}
									>
										{member.status}
									</Badge>
								</td>

								<td class="px-4 py-3 text-right whitespace-nowrap">
									{#if confirming === member.user_id}
										<form
											method="POST"
											action="?/remove"
											class="flex items-center justify-end gap-2"
											use:enhance={() => {
												removing = member.user_id;
												return async ({ result, update }) => {
													await update();
													removing = null;
													confirming = null;

													if (result.type === 'failure' || result.type === 'error') return;
													toast.success(`${member.name} is no longer in this workspace.`);
												};
											}}
										>
											<input type="hidden" name="user_id" value={member.user_id} />

											<Button
												type="submit"
												variant="danger"
												size="sm"
												loading={removing === member.user_id}
												disabled={removing === member.user_id}
												aria-label="Yes, remove {member.name}, {member.email}"
											>
												<Icon icon={UserRemove01Icon} class="size-4" />
												Yes, remove
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
											variant="secondary"
											size="sm"
											onclick={() => (confirming = member.user_id)}
											aria-label="Remove {member.name}, {member.email}"
										>
											<Icon icon={UserRemove01Icon} class="size-4" />
											Remove
										</Button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<p class="text-muted mt-3 text-xs">
				Removing someone ends their membership here. Their Muallim account survives, and they can be
				invited back.
			</p>
		{/if}
	</section>

	<!-- ------------------------------------------------------------ invitations -->
	<section class="mt-12">
		<h2 class="text-lg font-semibold">Invitations</h2>

		<div class="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
			{#if data.invitations.length === 0}
				<EmptyState
					icon={Mail01Icon}
					title="Nothing outstanding"
					description="Invitations you send appear here until they are accepted, withdrawn, or expire."
				/>
			{:else}
				<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
					<table class="w-full border-collapse text-sm">
						<caption class="sr-only">
							Every invitation: the address, the role it offers, how it stands, and when it lapses.
						</caption>

						<thead>
							<tr class="border-b border-border bg-surface-sunken text-left">
								<th scope="col" class="px-4 py-3 font-medium">Email</th>
								<th scope="col" class="px-4 py-3 font-medium">Role</th>
								<th scope="col" class="px-4 py-3 font-medium">Status</th>
								<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Expires</th>
								<th scope="col" class="w-48 px-4 py-3 text-right font-medium">
									<span class="sr-only">Withdraw</span>
								</th>
							</tr>
						</thead>

						<tbody>
							{#each data.invitations as invitation (invitation.id)}
								<tr class="border-b border-border last:border-0 hover:bg-surface-sunken">
									<th scope="row" class="px-4 py-3 text-left font-normal">{invitation.email}</th>

									<td class="px-4 py-3">
										<Badge tone="neutral">{roleLabel(invitation.role)}</Badge>
									</td>

									<td class="px-4 py-3">
										<Badge
											tone={invitationTone(invitation.status)}
											icon={invitation.status === 'pending'
												? Clock01Icon
												: invitation.status === 'accepted'
													? CheckmarkCircle02Icon
													: UnavailableIcon}
										>
											{invitation.status}
										</Badge>
									</td>

									<td class="text-muted numeral px-4 py-3 whitespace-nowrap">
										{when.format(new Date(invitation.expires_at))}
									</td>

									<td class="px-4 py-3 text-right whitespace-nowrap">
										{#if isOutstanding(invitation)}
											<form
												method="POST"
												action="?/withdraw"
												use:enhance={() => {
													withdrawing = invitation.id;
													return async ({ result, update }) => {
														await update();
														withdrawing = null;

														if (result.type === 'failure' || result.type === 'error') return;
														toast.success('Withdrawn. The link in their inbox no longer works.');
													};
												}}
											>
												<input type="hidden" name="id" value={invitation.id} />
												<Button
													type="submit"
													variant="secondary"
													size="sm"
													loading={withdrawing === invitation.id}
													disabled={withdrawing === invitation.id}
													aria-label="Withdraw the invitation to {invitation.email}"
												>
													<Icon icon={UnavailableIcon} class="size-4" />
													Withdraw
												</Button>
											</form>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<form
				method="POST"
				action="?/invite"
				use:enhance={validated(
					invitationSchema,
					(next) => (errors = next),
					() => {
						inviting = true;
						return async ({ result, update }) => {
							await update();
							inviting = false;

							if (result.type === 'failure' || result.type === 'error') return;
							toast.success('Invitation sent. The link goes to their inbox.');
						};
					}
				)}
			>
				<Sheet>
					{#snippet header()}
						<h3 class="font-medium">Invite someone</h3>
						<p class="text-muted mt-0.5 text-sm">
							The link is emailed to the address. It is never shown here, which is what makes
							accepting it proof that they hold that inbox.
						</p>
					{/snippet}

					<div class="space-y-5">
						<Field id="email" label="Email address" error={problem('email')}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="email"
									autocomplete="email"
									placeholder="teacher@school.edu"
									aria-describedby={describedBy}
									{...LIMITS.inviteEmail}
								/>
							{/snippet}
						</Field>

						<Field id="role" label="Role" error={problem('role')} hint={roleHint(inviteRole)}>
							{#snippet children({ id, describedBy, invalid })}
								<Select
									{id}
									{invalid}
									name="role"
									aria-describedby={describedBy}
									bind:value={inviteRole}
									{...LIMITS.memberRole}
								>
									{#each ROLES as role (role)}
										<option value={role}>{roleLabel(role)}</option>
									{/each}
								</Select>
							{/snippet}
						</Field>
					</div>

					{#snippet footer()}
						<Button type="submit" loading={inviting} disabled={inviting}>
							<Icon icon={UserAdd01Icon} class="size-4" />
							Send invitation
						</Button>
					{/snippet}
				</Sheet>
			</form>
		</div>
	</section>
</Page>
