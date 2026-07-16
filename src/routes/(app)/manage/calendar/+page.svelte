<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		ArrowDown01Icon,
		Calendar03Icon,
		Cancel01Icon,
		Delete02Icon,
		FloppyDiskIcon,
		PencilEdit02Icon,
		PlusSignIcon
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
		EVENT_KINDS,
		EVENT_LIMITS,
		createEventSchema,
		editEventSchema,
		kindLabel,
		kindTone,
		type CalendarEvent,
		type EventKind
	} from '$lib/calendar';
	import { appendPage, canLoadMore, removeRow, type Paged } from '$lib/paging';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const eventKey = (event: CalendarEvent) => event.id;

	// The rows on screen. Seeded by the server's first page; "Load more" appends the
	// next, and a fresh event goes to the head.
	let events = $derived(data.events as Paged<CalendarEvent>);

	let addOpen = $state(false);
	let adding = $state(false);
	let loadingMore = $state(false);
	let removing = $state<string | null>(null);

	// The picked kind seeds the form's select, so a re-open keeps the last choice.
	let kind = $state<EventKind>('holiday');

	// ------------------------------------------------------------------- edit
	let editing = $state<CalendarEvent | null>(null);
	let saving = $state(false);
	let editErrors = $state<FieldErrors>({});

	// The action bags its refusal by event, so a bad date marks the row it is about.
	const editProblem = (field: string) =>
		editErrors[field] ?? (form?.editId === editing?.id ? form?.errors?.[field] : undefined);

	// The sheet's own kind, seeded from the event so the select opens on what it is.
	let editKind = $state<EventKind>('holiday');
	function openEdit(event: CalendarEvent) {
		editKind = event.kind as EventKind;
		editErrors = {};
		editing = event;
	}

	// A single day reads as one date; a span reads as a range. Both are ISO dates.
	function whenLabel(event: CalendarEvent): string {
		const start = formatDate(event.starts_on);
		if (!event.ends_on || event.ends_on === event.starts_on) return start;
		return `${start} — ${formatDate(event.ends_on)}`;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
	}
</script>

<svelte:head><title>Calendar — Muallim</title></svelte:head>

<PageHeader
	title="Academic calendar"
	description="Holidays, exams, term markers and the events in between — the year at a glance."
>
	{#snippet actions()}
		<Button onclick={() => (addOpen = !addOpen)}>
			<Icon icon={addOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{addOpen ? 'Close' : 'Add event'}
		</Button>
	{/snippet}
</PageHeader>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- --------------------------------------------------------------------- add -->
{#if addOpen}
	<form
		method="POST"
		action="?/create"
		class="mt-6"
		use:enhance={validated(
			createEventSchema,
			(next) => (errors = next),
			() => {
				adding = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false, reset: false });
					adding = false;

					if (result.type !== 'success') return;

					const created = result.data?.created as CalendarEvent | undefined;
					if (created) {
						events = { ...events, rows: [created, ...events.rows] };
						addOpen = false;
						toast.success(`“${created.title}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={addOpen} onClose={() => (addOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Add an event</h2>
				<p class="mt-0.5 text-sm text-muted">
					A title, a kind, and a start date. An end date makes it a span; a note is optional.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<div class="sm:col-span-2">
					<Field id="title" label="Title" error={problem('title')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="title"
								placeholder="Eid-ul-Fitr holiday"
								aria-describedby={describedBy}
								{...EVENT_LIMITS.title}
							/>
						{/snippet}
					</Field>
				</div>

				<Field id="kind" label="Kind" error={problem('kind')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="kind" bind:value={kind} aria-describedby={describedBy}>
							{#each EVENT_KINDS as option (option)}
								<option value={option}>{kindLabel(option)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<div class="hidden sm:block"></div>

				<Field id="starts_on" label="Start date" error={problem('starts_on')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="starts_on"
							aria-describedby={describedBy}
							{...EVENT_LIMITS.date}
						/>
					{/snippet}
				</Field>

				<Field id="ends_on" label="End date" error={problem('ends_on')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="ends_on"
							aria-describedby={describedBy}
							{...EVENT_LIMITS.endDate}
						/>
					{/snippet}
				</Field>

				<div class="sm:col-span-2">
					<Field id="description" label="Description" error={problem('description')}>
						{#snippet children({ id, describedBy, invalid })}
							<Textarea
								{id}
								{invalid}
								name="description"
								rows={3}
								placeholder="Optional — what the day is for."
								aria-describedby={describedBy}
								{...EVENT_LIMITS.description}
							/>
						{/snippet}
					</Field>
				</div>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={adding} disabled={adding}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Add event
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------------ filter -->
<form method="GET" class="mt-8 flex flex-wrap items-end gap-3">
	<div class="w-full max-w-xs">
		<Field id="kind-filter" label="Filter by kind">
			{#snippet children({ id })}
				<Select
					{id}
					name="kind"
					value={data.kind}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				>
					<option value="">All kinds</option>
					{#each EVENT_KINDS as option (option)}
						<option value={option}>{kindLabel(option)}</option>
					{/each}
				</Select>
			{/snippet}
		</Field>
	</div>
	<div class="w-40">
		<Field id="from-filter" label="From">
			{#snippet children({ id })}
				<Input
					{id}
					type="date"
					name="from"
					value={data.from}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				/>
			{/snippet}
		</Field>
	</div>
	<div class="w-40">
		<Field id="to-filter" label="To">
			{#snippet children({ id })}
				<Input
					{id}
					type="date"
					name="to"
					value={data.to}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				/>
			{/snippet}
		</Field>
	</div>
	<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
</form>

<!-- ---------------------------------------------------------------- calendar -->
<section class="mt-4">
	{#if events.rows.length === 0}
		<EmptyState
			icon={Calendar03Icon}
			title={data.kind || data.from || data.to ? 'Nothing on the calendar' : 'No events yet'}
			description={data.kind || data.from || data.to
				? 'Nothing matches this filter. Try another kind or a wider date range.'
				: 'Add your first holiday, exam or event and it will appear here.'}
		/>
	{:else}
		<ul class="space-y-3">
			{#each events.rows as event (event.id)}
				<li class="rounded-card border border-border bg-surface-raised p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<Badge tone={kindTone(event.kind)}>{kindLabel(event.kind)}</Badge>
								<h3 class="font-medium">{event.title}</h3>
							</div>
							<p class="numeral mt-1 text-sm text-muted">{whenLabel(event)}</p>
							{#if event.description}
								<p class="mt-2 text-sm whitespace-pre-line text-muted">{event.description}</p>
							{/if}
						</div>

						<div class="flex shrink-0 items-center gap-1">
							<Button
								size="sm"
								variant="ghost"
								onclick={() => openEdit(event)}
								aria-label="Edit {event.title}"
							>
								<Icon icon={PencilEdit02Icon} class="size-4" />
								Edit
							</Button>

							<form
								method="POST"
								action="?/delete"
								use:enhance={() => {
									removing = event.id;
									return async ({ result }) => {
										removing = null;
										if (result.type !== 'success') return applyAction(result);
										events = removeRow(events, eventKey, event.id);
										toast.success(`“${event.title}” has been removed.`);
									};
								}}
							>
								<input type="hidden" name="id" value={event.id} />
								<Button
									type="submit"
									size="sm"
									variant="ghost"
									loading={removing === event.id}
									disabled={removing === event.id}
									aria-label="Delete {event.title}"
								>
									<Icon icon={Delete02Icon} class="size-4" />
									Delete
								</Button>
							</form>
						</div>
					</div>
				</li>
			{/each}
		</ul>

		{#if canLoadMore(events)}
			<form
				method="POST"
				action="?/more"
				class="mt-4 flex justify-center"
				use:enhance={() => {
					loadingMore = true;
					return async ({ result }) => {
						loadingMore = false;
						if (result.type !== 'success') return applyAction(result);

						const next = result.data?.more as Paged<CalendarEvent> | undefined;
						if (next) events = appendPage(events, next, eventKey);
					};
				}}
			>
				<input type="hidden" name="cursor" value={events.cursor} />
				<input type="hidden" name="kind" value={data.kind} />
				<input type="hidden" name="from" value={data.from} />
				<input type="hidden" name="to" value={data.to} />
				<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
					<Icon icon={ArrowDown01Icon} class="size-4" />
					Load more events
				</Button>
			</form>
		{/if}
	{/if}
</section>

<!-- -------------------------------------------------------------------- edit -->
{#if editing}
	{@const event = editing}
	<form
		method="POST"
		action="?/edit"
		use:enhance={validated(
			editEventSchema,
			(next) => (editErrors = next),
			() => {
				saving = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false, reset: false });
					saving = false;

					if (result.type !== 'success') return;

					const edited = result.data?.edited as CalendarEvent | undefined;
					if (edited) {
						// The row updates in place: the calendar's order is the API's, and an edit
						// that moved the date does not get to jump the queue on the strength of a guess.
						events = {
							...events,
							rows: events.rows.map((row) => (row.id === edited.id ? edited : row))
						};
						editing = null;
						toast.success(`“${edited.title}” has been saved.`);
					}
				};
			}
		)}
	>
		<Sheet open={editing !== null} onClose={() => (editing = null)}>
			{#snippet header()}
				<h2 class="font-medium">Edit event</h2>
				<p class="mt-0.5 text-sm text-muted">
					Change what this day is, when it falls, or its note.
				</p>
			{/snippet}

			<input type="hidden" name="id" value={event.id} />

			<div class="grid gap-5 sm:grid-cols-2">
				<div class="sm:col-span-2">
					<Field id="edit-title" label="Title" error={editProblem('title')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="title"
								value={event.title}
								aria-describedby={describedBy}
								{...EVENT_LIMITS.title}
							/>
						{/snippet}
					</Field>
				</div>

				<Field id="edit-kind" label="Kind" error={editProblem('kind')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="kind" bind:value={editKind} aria-describedby={describedBy}>
							{#each EVENT_KINDS as option (option)}
								<option value={option}>{kindLabel(option)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<div class="hidden sm:block"></div>

				<Field id="edit-starts_on" label="Start date" error={editProblem('starts_on')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="starts_on"
							value={event.starts_on}
							aria-describedby={describedBy}
							{...EVENT_LIMITS.date}
						/>
					{/snippet}
				</Field>

				<Field
					id="edit-ends_on"
					label="End date"
					hint="An end date can be changed, but not taken off once set."
					error={editProblem('ends_on')}
				>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="ends_on"
							value={event.ends_on ?? ''}
							aria-describedby={describedBy}
							{...EVENT_LIMITS.endDate}
						/>
					{/snippet}
				</Field>

				<div class="sm:col-span-2">
					<Field id="edit-description" label="Description" error={editProblem('description')}>
						{#snippet children({ id, describedBy, invalid })}
							<Textarea
								{id}
								{invalid}
								name="description"
								rows={3}
								value={event.description ?? ''}
								aria-describedby={describedBy}
								{...EVENT_LIMITS.description}
							/>
						{/snippet}
					</Field>
				</div>
			</div>

			{#snippet footer()}
				<Button type="button" variant="ghost" onclick={() => (editing = null)}>Cancel</Button>
				<Button type="submit" loading={saving} disabled={saving}>
					<Icon icon={FloppyDiskIcon} class="size-4" />
					Save changes
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}
