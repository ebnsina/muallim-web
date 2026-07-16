<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		ArrowDown01Icon,
		BedIcon,
		Building03Icon,
		Call02Icon,
		Cancel01Icon,
		Door01Icon,
		Logout03Icon,
		PlusSignIcon,
		UserIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		EmptyState,
		Field,
		Icon,
		Input,
		Select,
		Sheet
	} from '$lib/components';
	import {
		ALLOCATION_STATUSES,
		HOSTEL_LIMITS,
		addRoomSchema,
		allocateSchema,
		allocationStatusLabel,
		allocationStatusTone,
		createBuildingSchema,
		isRoomFull,
		type Allocation,
		type Building,
		type Room
	} from '$lib/hostel';
	import { appendPage, canLoadMore, replaceRow, type Paged } from '$lib/paging';
	import type { Student } from '$lib/students';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const buildingKey = (building: Building) => building.id;
	const allocationKey = (allocation: Allocation) => allocation.id;

	// The rows on screen, seeded by the server and mutated in place as buildings, rooms
	// and allocations are added and vacated.
	let buildings = $derived(data.buildings as Paged<Building>);
	let allocations = $derived(data.allocations as Paged<Allocation>);
	let rooms = $derived((data.rooms ?? []) as Room[]);

	const students = $derived(data.students as Student[]);
	const studentMap = $derived(new Map(students.map((s) => [s.id, s.full_name])));
	const studentName = (id: string) => studentMap.get(id) ?? 'Unknown student';

	const roomMap = $derived(new Map(rooms.map((r) => [r.id, r.room_no])));
	const roomName = (id: string) => roomMap.get(id) ?? 'A room';

	const selectedBuilding = $derived(buildings.rows.find((b) => b.id === data.buildingId) ?? null);

	// Selecting a building keeps the student and status filters, but drops the room filter —
	// a room belongs to one building, so it means nothing under another.
	const buildingHref = (id: string) => {
		const params = new URLSearchParams();
		params.set('building', id);
		if (data.studentId) params.set('student', data.studentId);
		if (data.status) params.set('status', data.status);
		return `?${params}`;
	};

	// Per-form field errors, kept apart so one form's mistake does not light another.
	let buildingErrors = $state<FieldErrors>({});
	let roomErrors = $state<FieldErrors>({});
	let allocateErrors = $state<FieldErrors>({});

	let newBuildingOpen = $state(false);
	let allocateOpen = $state(false);
	let creatingBuilding = $state(false);
	let addingRoom = $state(false);
	let allocating = $state(false);
	let loadingBuildings = $state(false);
	let loadingAllocations = $state(false);
	let vacatingId = $state<string | null>(null);
</script>

<svelte:head><title>Hostel — Muallim</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div class="min-w-0">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Hostel</h1>
		<p class="mt-2 max-w-2xl text-muted">
			The boarding buildings, the rooms in each, and which student sleeps in which bed.
		</p>
	</div>
	<div class="flex shrink-0 items-center gap-3">
		<Button variant="secondary" onclick={() => (newBuildingOpen = !newBuildingOpen)}>
			<Icon icon={newBuildingOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{newBuildingOpen ? 'Close' : 'Add building'}
		</Button>
		<Button onclick={() => (allocateOpen = !allocateOpen)}>
			<Icon icon={allocateOpen ? Cancel01Icon : BedIcon} class="size-4" />
			{allocateOpen ? 'Close' : 'Allocate'}
		</Button>
	</div>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- --------------------------------------------------------------- new building -->
{#if newBuildingOpen}
	<form
		method="POST"
		action="?/createBuilding"
		class="mt-6"
		use:enhance={validated(
			createBuildingSchema,
			(next) => (buildingErrors = next),
			() => {
				creatingBuilding = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingBuilding = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdBuilding as Building | undefined;
					if (created) {
						buildings = { ...buildings, rows: [created, ...buildings.rows] };
						newBuildingOpen = false;
						toast.success(`“${created.name}” has been registered.`);
					}
				};
			}
		)}
	>
		<Sheet open={newBuildingOpen} onClose={() => (newBuildingOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new building</h2>
				<p class="mt-0.5 text-sm text-muted">
					A boarding block. Name it, and note its warden if there is one.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-3">
				<Field id="name" label="Name" error={buildingErrors.name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="North Hall"
							aria-describedby={describedBy}
							{...HOSTEL_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<Field id="warden_name" label="Warden" error={buildingErrors.warden_name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="warden_name"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...HOSTEL_LIMITS.wardenName}
						/>
					{/snippet}
				</Field>

				<Field id="warden_phone" label="Warden phone" error={buildingErrors.warden_phone}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="warden_phone"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...HOSTEL_LIMITS.wardenPhone}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creatingBuilding} disabled={creatingBuilding}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Register building
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------------- allocate -->
{#if allocateOpen}
	<form
		method="POST"
		action="?/allocate"
		class="mt-6"
		use:enhance={validated(
			allocateSchema,
			(next) => (allocateErrors = next),
			() => {
				allocating = true;
				return async ({ result, update }) => {
					// Reload from the server so the room's occupancy reflects the new bed.
					await update({ invalidateAll: true });
					allocating = false;
					if (result.type !== 'success') return;

					const created = result.data?.allocated as Allocation | undefined;
					if (created) {
						allocateOpen = false;
						toast.success(`${studentName(created.student_id)} has been allocated a bed.`);
					}
				};
			}
		)}
	>
		<Sheet open={allocateOpen} onClose={() => (allocateOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Allocate a bed</h2>
				<p class="mt-0.5 text-sm text-muted">
					{#if selectedBuilding}
						A bed in <span class="font-medium">{selectedBuilding.name}</span> for a student. A full room
						and a student who already boards are both refused.
					{:else}
						Select a building below to choose one of its rooms.
					{/if}
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="room_id" label="Room" error={allocateErrors.room_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="room_id"
							value=""
							disabled={rooms.length === 0}
							aria-describedby={describedBy}
						>
							<option value="" disabled>
								{selectedBuilding ? 'Choose a room' : 'Select a building first'}
							</option>
							{#each rooms as room (room.id)}
								<option value={room.id} disabled={isRoomFull(room)}>
									Room {room.room_no} — {room.occupied}/{room.capacity}{isRoomFull(room)
										? ' (full)'
										: ''}
								</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="student_id" label="Student" error={allocateErrors.student_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="student_id" value="" aria-describedby={describedBy}>
							<option value="" disabled>Choose a student</option>
							{#each students as s (s.id)}
								<option value={s.id}>{s.full_name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={allocating} disabled={allocating || rooms.length === 0}>
					<Icon icon={BedIcon} class="size-4" />
					Allocate bed
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------------ buildings -->
<section class="mt-10">
	<h2 class="text-lg font-semibold">Buildings</h2>
	<p class="mt-1 text-sm text-muted">The boarding blocks. Select one to see and add its rooms.</p>

	{#if buildings.rows.length === 0}
		<div class="mt-4">
			<EmptyState
				icon={Building03Icon}
				title="No buildings yet"
				description="Register a building above and it will appear here, ready for its rooms."
			/>
		</div>
	{:else}
		<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each buildings.rows as building (building.id)}
				{@const selected = building.id === data.buildingId}
				<li>
					<a
						href={buildingHref(building.id)}
						aria-current={selected ? 'true' : undefined}
						class="block rounded-card border bg-surface-raised p-4 transition-colors hover:border-accent
							{selected ? 'border-accent ring-1 ring-accent' : 'border-border'}"
					>
						<div class="flex items-start gap-2.5">
							<Icon icon={Building03Icon} class="mt-0.5 size-4 shrink-0 text-muted" />
							<div class="min-w-0">
								<p class="font-medium">{building.name}</p>
								{#if building.warden_name}
									<p class="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
										<Icon icon={UserIcon} class="size-3.5" />
										{building.warden_name}
									</p>
								{/if}
								{#if building.warden_phone}
									<p class="numeral mt-0.5 flex items-center gap-1.5 text-xs text-muted">
										<Icon icon={Call02Icon} class="size-3.5" />
										{building.warden_phone}
									</p>
								{/if}
							</div>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		{#if canLoadMore(buildings)}
			<form
				method="POST"
				action="?/moreBuildings"
				class="mt-4 flex justify-center"
				use:enhance={() => {
					loadingBuildings = true;
					return async ({ result }) => {
						loadingBuildings = false;
						if (result.type !== 'success') return applyAction(result);
						const next = result.data?.moreBuildings as Paged<Building> | undefined;
						if (next) buildings = appendPage(buildings, next, buildingKey);
					};
				}}
			>
				<input type="hidden" name="cursor" value={buildings.cursor} />
				<Button
					type="submit"
					variant="secondary"
					loading={loadingBuildings}
					disabled={loadingBuildings}
				>
					<Icon icon={ArrowDown01Icon} class="size-4" />
					Load more buildings
				</Button>
			</form>
		{/if}
	{/if}
</section>

<!-- ---------------------------------------------------------------------- rooms -->
{#if selectedBuilding}
	<section class="mt-10">
		<h2 class="text-lg font-semibold">Rooms in {selectedBuilding.name}</h2>
		<p class="mt-1 text-sm text-muted">Each room's beds, and how many are taken.</p>

		<!-- add room -->
		<form
			method="POST"
			action="?/addRoom"
			class="mt-4"
			use:enhance={validated(
				addRoomSchema,
				(next) => (roomErrors = next),
				() => {
					addingRoom = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						addingRoom = false;
						if (result.type !== 'success') return;

						const added = result.data?.addedRoom as Room | undefined;
						if (added) {
							rooms = [...rooms, added];
							toast.success(`Room ${added.room_no} has been added.`);
						}
					};
				}
			)}
		>
			<input type="hidden" name="building_id" value={selectedBuilding.id} />
			<Sheet>
				{#snippet header()}
					<h2 class="font-medium">Add a room</h2>
					<p class="mt-0.5 text-sm text-muted">
						A room number and how many beds it holds. It boards nobody until a student is allocated.
					</p>
				{/snippet}

				<div class="grid gap-5 sm:grid-cols-2">
					<Field id="room_no" label="Room number" error={roomErrors.room_no}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="room_no"
								placeholder="101"
								aria-describedby={describedBy}
								{...HOSTEL_LIMITS.roomNo}
							/>
						{/snippet}
					</Field>

					<Field id="capacity" label="Capacity (beds)" error={roomErrors.capacity}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="capacity"
								inputmode="numeric"
								placeholder="4"
								aria-describedby={describedBy}
								{...HOSTEL_LIMITS.capacity}
							/>
						{/snippet}
					</Field>
				</div>

				{#snippet footer()}
					<Button type="submit" loading={addingRoom} disabled={addingRoom}>
						<Icon icon={PlusSignIcon} class="size-4" />
						Add room
					</Button>
				{/snippet}
			</Sheet>
		</form>

		{#if data.roomsError}
			<Alert tone="warning" class="mt-4" role="alert">{data.roomsError}</Alert>
		{:else if rooms.length === 0}
			<div class="mt-4">
				<EmptyState
					icon={Door01Icon}
					title="No rooms yet"
					description="Add a room above and it will appear here, ready to allocate."
				/>
			</div>
		{:else}
			<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each rooms as room (room.id)}
					<li class="rounded-card border border-border bg-surface-raised p-4">
						<div class="flex items-center gap-2">
							<Icon icon={Door01Icon} class="size-4 text-muted" />
							<p class="font-medium">Room {room.room_no}</p>
						</div>
						<p class="numeral mt-2 text-sm text-muted">
							<span class="font-medium text-text">{room.occupied}</span>/{room.capacity} beds taken
						</p>
						{#if isRoomFull(room)}
							<Badge tone="warning" class="mt-2">Full</Badge>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<!-- ---------------------------------------------------------------- allocations -->
<section class="mt-10">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-lg font-semibold">Allocations</h2>
			<p class="mt-1 text-sm text-muted">Every bed given out, and the student in it.</p>
		</div>

		<form method="GET" class="flex flex-wrap items-end gap-3">
			{#if data.buildingId}
				<input type="hidden" name="building" value={data.buildingId} />
			{/if}
			<div class="w-44">
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
			<div class="w-40">
				<Field id="status-filter" label="Status">
					{#snippet children({ id })}
						<Select
							{id}
							name="status"
							value={data.status}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">Any status</option>
							{#each ALLOCATION_STATUSES as s (s)}
								<option value={s}>{allocationStatusLabel(s)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
		</form>
	</div>

	<div class="mt-4">
		{#if data.allocationsError && allocations.rows.length === 0}
			<Alert tone="warning" role="alert">{data.allocationsError}</Alert>
		{:else if allocations.rows.length === 0}
			<EmptyState
				icon={BedIcon}
				title="No allocations"
				description={data.studentId || data.status || data.roomId
					? 'Nothing matches this filter. Try another student or status.'
					: 'Allocate a student a bed above and it will appear here.'}
			/>
		{:else}
			<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
				<table class="w-full border-collapse text-sm">
					<caption class="sr-only">Every allocation: the student, the room, and its status.</caption
					>
					<thead>
						<tr class="border-b border-border bg-surface-sunken text-left">
							<th scope="col" class="px-4 py-3 font-medium">Student</th>
							<th scope="col" class="px-4 py-3 font-medium">Room</th>
							<th scope="col" class="px-4 py-3 font-medium">Status</th>
							<th scope="col" class="px-4 py-3 font-medium"><span class="sr-only">Actions</span></th
							>
						</tr>
					</thead>
					<tbody>
						{#each allocations.rows as allocation (allocation.id)}
							<tr class="border-b border-border last:border-0">
								<td class="px-4 py-3 font-medium">{studentName(allocation.student_id)}</td>
								<td class="px-4 py-3 text-muted">{roomName(allocation.room_id)}</td>
								<td class="px-4 py-3">
									<Badge tone={allocationStatusTone(allocation.status)}>
										{allocationStatusLabel(allocation.status)}
									</Badge>
								</td>
								<td class="px-4 py-3">
									{#if allocation.status === 'active'}
										<div class="flex justify-end">
											<form
												method="POST"
												action="?/vacate"
												use:enhance={() => {
													vacatingId = allocation.id;
													return async ({ result, update }) => {
														// Reload so the freed bed shows in the room's occupancy.
														await update({ invalidateAll: true });
														vacatingId = null;
														if (result.type !== 'success') return applyAction(result);
														const changed = result.data?.vacated as Allocation | undefined;
														if (changed) {
															allocations = replaceRow(
																allocations,
																allocationKey,
																allocation.id,
																changed
															);
															toast.success('The bed has been vacated.');
														}
													};
												}}
											>
												<input type="hidden" name="id" value={allocation.id} />
												<Button
													type="submit"
													size="sm"
													variant="ghost"
													loading={vacatingId === allocation.id}
													disabled={vacatingId === allocation.id}
												>
													<Icon icon={Logout03Icon} class="size-4" />
													Vacate
												</Button>
											</form>
										</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if canLoadMore(allocations)}
				<form
					method="POST"
					action="?/moreAllocations"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingAllocations = true;
						return async ({ result }) => {
							loadingAllocations = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.moreAllocations as Paged<Allocation> | undefined;
							if (next) allocations = appendPage(allocations, next, allocationKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={allocations.cursor} />
					<input type="hidden" name="room" value={data.roomId} />
					<input type="hidden" name="student" value={data.studentId} />
					<input type="hidden" name="status" value={data.status} />
					<Button
						type="submit"
						variant="secondary"
						loading={loadingAllocations}
						disabled={loadingAllocations}
					>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more allocations
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</section>
