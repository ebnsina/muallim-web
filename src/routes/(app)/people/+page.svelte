<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		Alert02Icon,
		ArrowDown01Icon,
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
	import { appendPage, canLoadMore, removeRow, replaceRow, type Paged } from '$lib/paging';
	import {
		invitationTone,
		isOutstanding,
		memberTone,
		roleHint,
		roleLabel,
		type Invitation,
		type Member
	} from '$lib/people';
	import { LIMITS, ROLES, invitationSchema, memberRoleSchema, type Role } from '$lib/schemas';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const memberKey = (member: Member) => member.user_id;
	const invitationKey = (invitation: Invitation) => invitation.id;

	/*
		The rows on screen. Writable $derived: the server's first page seeds them, "Load
		more" appends the next, and every write updates the row where it stands — because
		re-reading the list would throw a reader three pages in back to the first.
	*/
	let members = $derived(data.members as Paged<Member>);
	let invitations = $derived(data.invitations as Paged<Invitation>);

	/*
		What each picker is showing. Seeded from the rows and reassigned as a whole —
		a refused change (your own role, the last owner) puts the old one back, because
		a control left displaying a change the API rejected is a lie about the workspace.
	*/
	let roles = $derived(
		Object.fromEntries(members.rows.map((m) => [m.user_id, m.role])) as Record<string, Role>
	);

	let saving = $state<string | null>(null);
	let confirming = $state<string | null>(null);
	let removing = $state<string | null>(null);
	let withdrawing = $state<string | null>(null);
	let inviting = $state(false);
	let inviteOpen = $state(false);
	let loadingMembers = $state(false);
	let loadingInvitations = $state(false);

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

		{#if members.rows.length === 0}
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
						Every member: their name, address, role, when they joined, and whether they may sign in.
					</caption>

					<thead>
						<tr class="border-b border-border bg-surface-sunken text-left">
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Name</th>
							<th scope="col" class="px-4 py-3 font-medium">Email</th>
							<th scope="col" class="w-44 px-4 py-3 font-medium">Role</th>
							<th scope="col" class="px-4 py-3 font-medium">Status</th>
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Joined</th>
							<!-- Wide enough for the question the button turns into: asking must not
							     widen the table under the reader. -->
							<th scope="col" class="w-52 px-4 py-3 text-right font-medium">
								<span class="sr-only">Remove</span>
							</th>
						</tr>
					</thead>

					<tbody>
						{#each members.rows as member (member.user_id)}
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

												return async ({ result }) => {
													saving = null;

													// Refused. `member` is the row the server last sent, so its role is
													// the one that still stands.
													if (result.type !== 'success') {
														roles = { ...roles, [member.user_id]: member.role };
														await applyAction(result);
														return;
													}

													// The row where it stands, not a re-read: the pages already loaded stay.
													members = replaceRow(members, memberKey, member.user_id, {
														...member,
														role: chosen
													});
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

								<td class="text-muted numeral px-4 py-3 whitespace-nowrap">
									{when.format(new Date(member.joined_at))}
								</td>

								<td class="px-4 py-3 text-right whitespace-nowrap">
									{#if confirming === member.user_id}
										<form
											method="POST"
											action="?/remove"
											class="flex items-center justify-end gap-2"
											use:enhance={() => {
												removing = member.user_id;
												return async ({ result }) => {
													removing = null;
													confirming = null;

													if (result.type !== 'success') {
														await applyAction(result);
														return;
													}

													members = removeRow(members, memberKey, member.user_id);
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

			<!-- No total: muallim-api runs no COUNT(*), so nothing here may claim one. The
			     button is the only thing that knows there is more, and it goes when there is not. -->
			{#if canLoadMore(members)}
				<form
					method="POST"
					action="?/moreMembers"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingMembers = true;
						return async ({ result }) => {
							loadingMembers = false;

							// Not `update()`: re-running the load would drop every page but the first.
							if (result.type !== 'success') return applyAction(result);

							const next = result.data?.moreMembers as Paged<Member> | undefined;
							if (next) members = appendPage(members, next, memberKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={members.cursor} />
					<Button
						type="submit"
						variant="secondary"
						loading={loadingMembers}
						disabled={loadingMembers}
					>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more members
					</Button>
				</form>
			{/if}

			<p class="text-muted mt-3 text-xs">
				Removing someone ends their membership here. Their Muallim account survives, and they can be
				invited back.
			</p>
		{/if}
	</section>

	<!-- ------------------------------------------------------------ invitations -->
	<section class="mt-12">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="text-lg font-semibold">Invitations</h2>
			<Button size="sm" onclick={() => (inviteOpen = true)}>
				<Icon icon={UserAdd01Icon} class="size-4" />
				Invite someone
			</Button>
		</div>

		<div class="mt-4">
			{#if invitations.rows.length === 0}
				<EmptyState
					icon={Mail01Icon}
					title="Nothing outstanding"
					description="Invitations you send appear here until they are accepted, withdrawn, or expire."
				/>
			{:else}
				<div>
					<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
						<table class="w-full border-collapse text-sm">
							<caption class="sr-only">
								Every invitation: the address, the role it offers, how it stands, and when it
								lapses.
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
								{#each invitations.rows as invitation (invitation.id)}
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
														return async ({ result }) => {
															withdrawing = null;

															if (result.type !== 'success') {
																await applyAction(result);
																return;
															}

															// Not deleted — muallim-api stamps `revoked_at`, and the row reads so.
															invitations = replaceRow(invitations, invitationKey, invitation.id, {
																...invitation,
																status: 'revoked'
															});
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

					{#if canLoadMore(invitations)}
						<form
							method="POST"
							action="?/moreInvitations"
							class="mt-4 flex justify-center"
							use:enhance={() => {
								loadingInvitations = true;
								return async ({ result }) => {
									loadingInvitations = false;

									if (result.type !== 'success') return applyAction(result);

									const next = result.data?.moreInvitations as Paged<Invitation> | undefined;
									if (next) invitations = appendPage(invitations, next, invitationKey);
								};
							}}
						>
							<input type="hidden" name="cursor" value={invitations.cursor} />
							<Button
								type="submit"
								variant="secondary"
								loading={loadingInvitations}
								disabled={loadingInvitations}
							>
								<Icon icon={ArrowDown01Icon} class="size-4" />
								Load more invitations
							</Button>
						</form>
					{/if}
				</div>
			{/if}
		</div>

		{#if inviteOpen}
			<form
				method="POST"
				action="?/invite"
				use:enhance={validated(
					invitationSchema,
					(next) => (errors = next),
					() => {
						inviting = true;
						return async ({ result, update }) => {
							// Applies the result and clears the fields; `invalidateAll: false` is what
							// keeps the pages already loaded from being thrown away underneath.
							await update({ invalidateAll: false });
							inviting = false;

							if (result.type !== 'success') return;
							inviteOpen = false;

							// The API sent the row back, so a newest-first list takes it at the head.
							const invited = result.data?.invited as Invitation | undefined;
							if (invited) {
								invitations = { ...invitations, rows: [invited, ...invitations.rows] };
							}
							toast.success('Invitation sent. The link goes to their inbox.');
						};
					}
				)}
			>
				<Sheet open={inviteOpen} onClose={() => (inviteOpen = false)}>
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
		{/if}
	</section>
</Page>
