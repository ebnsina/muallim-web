<script lang="ts">
	import { untrack } from 'svelte';
	import { applyAction, enhance } from '$app/forms';
	import {
		ArrowDown01Icon,
		Bus01Icon,
		Cancel01Icon,
		Delete02Icon,
		Location01Icon,
		PlusSignIcon,
		Route01Icon,
		UserGroupIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
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
	import { formatMoney } from '$lib/money';
	import { appendPage, canLoadMore, removeRow, type Paged } from '$lib/paging';
	import type { Student } from '$lib/students';
	import {
		TRANSPORT_LIMITS,
		addVehicleSchema,
		assignStudentSchema,
		createRouteSchema,
		vehicleSubtitle,
		type Assignment,
		type Route,
		type Vehicle
	} from '$lib/transport';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const assignmentKey = (a: Assignment) => a.id;

	// The rows on screen, seeded by the server and mutated in place as routes are added,
	// vehicles join a fleet, and students are assigned or taken off.
	let routes = $derived(data.routes as Route[]);
	let vehicles = $derived((data.vehicles ?? []) as Vehicle[]);
	let assignments = $derived(data.assignments as Paged<Assignment>);

	const students = $derived(data.students as Student[]);
	const studentMap = $derived(new Map(students.map((s) => [s.id, s.full_name])));
	const routeMap = $derived(new Map(routes.map((r) => [r.id, r.name])));

	const studentName = (id: string) => studentMap.get(id) ?? 'Unknown student';
	const routeName = (id: string) => routeMap.get(id) ?? 'A route';

	// The route in focus travels in the URL, so a route's fleet is a link.
	const selectedRoute = $derived(routes.find((r) => r.id === data.routeId) ?? null);

	// Per-form field errors, kept apart so one form's mistake does not light another.
	let routeErrors = $state<FieldErrors>({});
	let vehicleErrors = $state<FieldErrors>({});
	let assignErrors = $state<FieldErrors>({});

	let newRouteOpen = $state(false);
	let assignOpen = $state(false);
	let creatingRoute = $state(false);
	let addingVehicle = $state(false);
	let assigning = $state(false);
	let loadingMore = $state(false);
	let removing = $state<string | null>(null);

	// The assign form's route picker defaults to the route in focus, if there is one.
	let assignRoute = $state(untrack(() => data.routeId));
</script>

<svelte:head><title>Transport — Muallim</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<PageHeader
		title="Transport"
		description="The routes this school runs, the vehicles on each, and the students who ride them."
	/>
	<div class="flex shrink-0 items-center gap-3">
		<Button variant="secondary" onclick={() => (newRouteOpen = !newRouteOpen)}>
			<Icon icon={newRouteOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{newRouteOpen ? 'Close' : 'New route'}
		</Button>
		<Button onclick={() => (assignOpen = !assignOpen)}>
			<Icon icon={assignOpen ? Cancel01Icon : UserGroupIcon} class="size-4" />
			{assignOpen ? 'Close' : 'Assign student'}
		</Button>
	</div>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ---------------------------------------------------------------- new route -->
{#if newRouteOpen}
	<form
		method="POST"
		action="?/createRoute"
		class="mt-6"
		use:enhance={validated(
			createRouteSchema,
			(next) => (routeErrors = next),
			() => {
				creatingRoute = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingRoute = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdRoute as Route | undefined;
					if (created) {
						routes = [created, ...routes];
						newRouteOpen = false;
						toast.success(`“${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={newRouteOpen} onClose={() => (newRouteOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new route</h2>
				<p class="mt-0.5 text-sm text-muted">
					A named service with a per-rider fare. Fares are in taka.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="name" label="Name" error={routeErrors.name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="Uttara — Campus"
							aria-describedby={describedBy}
							{...TRANSPORT_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<Field id="fare" label="Fare (৳)" error={routeErrors.fare}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="fare"
							inputmode="decimal"
							placeholder="1500"
							aria-describedby={describedBy}
							{...TRANSPORT_LIMITS.fare}
						/>
					{/snippet}
				</Field>

				<Field id="currency" label="Currency" error={routeErrors.currency}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="currency"
							value="BDT"
							aria-describedby={describedBy}
							{...TRANSPORT_LIMITS.currency}
						/>
					{/snippet}
				</Field>

				<div class="sm:col-span-2">
					<Field id="description" label="Description" error={routeErrors.description}>
						{#snippet children({ id, describedBy, invalid })}
							<Textarea
								{id}
								{invalid}
								name="description"
								rows={2}
								placeholder="Optional — the stops along the way."
								aria-describedby={describedBy}
								{...TRANSPORT_LIMITS.description}
							/>
						{/snippet}
					</Field>
				</div>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creatingRoute} disabled={creatingRoute}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create route
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- assign student -->
{#if assignOpen}
	<form
		method="POST"
		action="?/assign"
		class="mt-6"
		use:enhance={validated(
			assignStudentSchema,
			(next) => (assignErrors = next),
			() => {
				assigning = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					assigning = false;
					if (result.type !== 'success') return;

					const created = result.data?.assigned as Assignment | undefined;
					if (created) {
						// A new assignment only belongs on screen if the current filter would show it.
						if (
							(!data.routeId || data.routeId === created.route_id) &&
							(!data.studentId || data.studentId === created.student_id)
						) {
							assignments = { ...assignments, rows: [created, ...assignments.rows] };
						}
						assignOpen = false;
						toast.success(
							`${studentName(created.student_id)} is on ${routeName(created.route_id)}.`
						);
					}
				};
			}
		)}
	>
		<Sheet open={assignOpen} onClose={() => (assignOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Assign a student</h2>
				<p class="mt-0.5 text-sm text-muted">
					A student rides one route. Assigning one already on a route is refused.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-3">
				<Field id="assign_route" label="Route" error={assignErrors.route_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="route_id"
							bind:value={assignRoute}
							aria-describedby={describedBy}
						>
							<option value="" disabled>Choose a route</option>
							{#each routes as route (route.id)}
								<option value={route.id}>{route.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="assign_student" label="Student" error={assignErrors.student_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="student_id" value="" aria-describedby={describedBy}>
							<option value="" disabled>Choose a student</option>
							{#each students as s (s.id)}
								<option value={s.id}>{s.full_name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="stop_name" label="Stop" error={assignErrors.stop_name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="stop_name"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...TRANSPORT_LIMITS.stopName}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={assigning} disabled={assigning}>
					<Icon icon={UserGroupIcon} class="size-4" />
					Assign student
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- routes -->
<section class="mt-10">
	<h2 class="text-lg font-semibold">Routes</h2>
	<p class="mt-1 text-sm text-muted">Pick a route to see and add its vehicles.</p>

	{#if routes.length === 0}
		<div class="mt-4">
			<EmptyState
				icon={Route01Icon}
				title="No routes yet"
				description="Create a route above and it will appear here, ready for a fleet and its riders."
			/>
		</div>
	{:else}
		<ul class="mt-4 grid gap-3 sm:grid-cols-2">
			{#each routes as route (route.id)}
				{@const active = route.id === data.routeId}
				<li>
					<a
						href={active ? '/manage/transport' : `/manage/transport?route=${route.id}`}
						class="block rounded-card border p-4 transition-colors {active
							? 'border-accent bg-accent/5'
							: 'border-border bg-surface-raised hover:border-accent/50'}"
						aria-current={active ? 'true' : undefined}
					>
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="font-medium">{route.name}</p>
								{#if route.description}
									<p class="mt-0.5 truncate text-sm text-muted">{route.description}</p>
								{/if}
							</div>
							<span class="numeral shrink-0 text-sm font-medium whitespace-nowrap">
								{formatMoney({ amount_minor: route.fare_amount, currency: route.currency })}
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<!-- ------------------------------------------------------------- vehicles -->
{#if selectedRoute}
	<section class="mt-10">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h2 class="text-lg font-semibold">{selectedRoute.name} — fleet</h2>
				<p class="mt-1 text-sm text-muted">The vehicles running this route, and who drives them.</p>
			</div>
		</div>

		<!-- add vehicle -->
		<form
			method="POST"
			action="?/addVehicle"
			class="mt-4"
			use:enhance={validated(
				addVehicleSchema,
				(next) => (vehicleErrors = next),
				() => {
					addingVehicle = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						addingVehicle = false;
						if (result.type !== 'success') return;

						const added = result.data?.addedVehicle as Vehicle | undefined;
						if (added) {
							vehicles = [added, ...vehicles];
							toast.success(`${added.registration_no} has been added.`);
						}
					};
				}
			)}
		>
			<input type="hidden" name="route_id" value={selectedRoute.id} />
			<div class="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<Field id="registration_no" label="Registration" error={vehicleErrors.registration_no}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="registration_no"
							placeholder="DHAKA-METRO-GA-11-2233"
							aria-describedby={describedBy}
							{...TRANSPORT_LIMITS.registration}
						/>
					{/snippet}
				</Field>
				<Field id="capacity" label="Seats" error={vehicleErrors.capacity}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="capacity"
							inputmode="numeric"
							placeholder="40"
							aria-describedby={describedBy}
							{...TRANSPORT_LIMITS.capacity}
						/>
					{/snippet}
				</Field>
				<Field id="driver_name" label="Driver" error={vehicleErrors.driver_name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="driver_name"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...TRANSPORT_LIMITS.driverName}
						/>
					{/snippet}
				</Field>
				<Field id="driver_phone" label="Driver phone" error={vehicleErrors.driver_phone}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="driver_phone"
							inputmode="tel"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...TRANSPORT_LIMITS.driverPhone}
						/>
					{/snippet}
				</Field>
				<Button type="submit" loading={addingVehicle} disabled={addingVehicle}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Add vehicle
				</Button>
			</div>
		</form>

		<div class="mt-6">
			{#if data.vehiclesError}
				<Alert tone="warning" role="alert">{data.vehiclesError}</Alert>
			{:else if vehicles.length === 0}
				<EmptyState
					icon={Bus01Icon}
					title="No vehicles on this route"
					description="Add a vehicle above and it will appear here."
				/>
			{:else}
				<ul class="grid gap-3 sm:grid-cols-2">
					{#each vehicles as vehicle (vehicle.id)}
						<li
							class="flex items-center gap-3 rounded-card border border-border bg-surface-raised p-4"
						>
							<Icon icon={Bus01Icon} class="size-5 shrink-0 text-muted" />
							<div class="min-w-0">
								<p class="numeral font-medium">{vehicle.registration_no}</p>
								<p class="mt-0.5 text-sm text-muted">{vehicleSubtitle(vehicle)}</p>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
{/if}

<!-- ------------------------------------------------------------- assignments -->
<section class="mt-10">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-lg font-semibold">Riders</h2>
			<p class="mt-1 text-sm text-muted">Every student on a route, and where they board.</p>
		</div>

		<form method="GET" class="flex flex-wrap items-end gap-3">
			<div class="w-48">
				<Field id="route-filter" label="Route">
					{#snippet children({ id })}
						<Select
							{id}
							name="route"
							value={data.routeId}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">All routes</option>
							{#each routes as route (route.id)}
								<option value={route.id}>{route.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<div class="w-48">
				<Field id="student-filter" label="Student">
					{#snippet children({ id })}
						<Select
							{id}
							name="student"
							value={data.studentId}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">All students</option>
							{#each students as s (s.id)}
								<option value={s.id}>{s.full_name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
		</form>
	</div>

	<div class="mt-4">
		{#if data.assignmentsError && assignments.rows.length === 0}
			<Alert tone="warning" role="alert">{data.assignmentsError}</Alert>
		{:else if assignments.rows.length === 0}
			<EmptyState
				icon={UserGroupIcon}
				title="No riders"
				description={data.routeId || data.studentId
					? 'Nothing matches this filter. Try another route or student.'
					: 'Assign a student above and they will appear here.'}
			/>
		{:else}
			<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
				<table class="w-full border-collapse text-sm">
					<caption class="sr-only">Every rider: the student, their route, and their stop.</caption>
					<thead>
						<tr class="border-b border-border bg-surface-sunken text-left">
							<th scope="col" class="px-4 py-3 font-medium">Student</th>
							<th scope="col" class="px-4 py-3 font-medium">Route</th>
							<th scope="col" class="px-4 py-3 font-medium">Stop</th>
							<th scope="col" class="px-4 py-3 font-medium"><span class="sr-only">Actions</span></th
							>
						</tr>
					</thead>
					<tbody>
						{#each assignments.rows as assignment (assignment.id)}
							<tr class="border-b border-border last:border-0">
								<td class="px-4 py-3 font-medium">{studentName(assignment.student_id)}</td>
								<td class="px-4 py-3 text-muted">{routeName(assignment.route_id)}</td>
								<td class="px-4 py-3 text-muted">
									{#if assignment.stop_name}
										<span class="inline-flex items-center gap-1.5">
											<Icon icon={Location01Icon} class="size-3.5" />
											{assignment.stop_name}
										</span>
									{:else}
										<span class="text-xs">—</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<div class="flex justify-end">
										<form
											method="POST"
											action="?/unassign"
											use:enhance={() => {
												removing = assignment.id;
												return async ({ result }) => {
													removing = null;
													if (result.type !== 'success') return applyAction(result);
													assignments = removeRow(assignments, assignmentKey, assignment.id);
													toast.success(
														`${studentName(assignment.student_id)} has been taken off the route.`
													);
												};
											}}
										>
											<input type="hidden" name="id" value={assignment.id} />
											<Button
												type="submit"
												size="sm"
												variant="ghost"
												loading={removing === assignment.id}
												disabled={removing === assignment.id}
												aria-label="Remove {studentName(assignment.student_id)} from the route"
											>
												<Icon icon={Delete02Icon} class="size-4" />
												Remove
											</Button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if canLoadMore(assignments)}
				<form
					method="POST"
					action="?/more"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingMore = true;
						return async ({ result }) => {
							loadingMore = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.more as Paged<Assignment> | undefined;
							if (next) assignments = appendPage(assignments, next, assignmentKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={assignments.cursor} />
					<input type="hidden" name="route" value={data.routeId} />
					<input type="hidden" name="student" value={data.studentId} />
					<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more riders
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</section>
