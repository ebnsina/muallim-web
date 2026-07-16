<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		Calendar01Icon,
		Cancel01Icon,
		CheckmarkCircle02Icon,
		PlusSignIcon,
		School01Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		EmptyState,
		Field,
		Icon,
		Input,
		Label,
		Radio,
		Sheet
	} from '$lib/components';
	import {
		INSTITUTION_TYPES,
		YEAR_LIMITS,
		institutionLabel,
		institutionTypeSchema,
		termCreateSchema,
		yearCreateSchema,
		type InstitutionType,
		type Term,
		type Year
	} from '$lib/academics-years';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The rows on screen, seeded by the server and mutated in place as years are opened,
	// made current, and removed.
	let years = $derived(data.years as Year[]);
	let termsByYear = $derived(data.termsByYear as Record<string, Term[]>);
	let institutionType = $derived(data.institutionType as InstitutionType);

	const currentYear = $derived(years.find((year) => year.is_current));

	// Per-form field errors, kept apart so one form's mistake does not light another.
	let yearErrors = $state<FieldErrors>({});
	let termErrors = $state<FieldErrors>({});
	let typeErrors = $state<FieldErrors>({});

	let newYearOpen = $state(false);
	let termForYear = $state<string | null>(null);
	let creatingYear = $state(false);
	let creatingTerm = $state(false);
	let savingType = $state(false);

	// Every destructive or state-changing act asks once, in place: the row's buttons
	// become the question, so nothing is confirmed away from the thing it happens to.
	let confirmingDelete = $state<string | null>(null);
	let confirmingCurrent = $state<string | null>(null);
	let confirmingTerm = $state<string | null>(null);
	let deletingYear = $state<string | null>(null);
	let settingCurrent = $state<string | null>(null);
	let deletingTerm = $state<string | null>(null);

	const termYear = $derived(years.find((year) => year.id === termForYear));

	const dates = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	/** A YYYY-MM-DD from the API, read as a day. */
	const day = (iso: string) => (iso ? dates.format(new Date(`${iso}T00:00:00`)) : '');

	const span = (starts: string, ends: string) => `${day(starts)} – ${day(ends)}`;
</script>

<svelte:head><title>Academic years — Muallim</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div class="min-w-0">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Academic years</h1>
		<p class="mt-2 max-w-2xl text-muted">
			The years this institution runs, and the terms inside each one. Attendance, exams and fees are
			all recorded against the current year.
		</p>
	</div>
	<div class="shrink-0">
		<Button onclick={() => (newYearOpen = !newYearOpen)}>
			<Icon icon={newYearOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{newYearOpen ? 'Close' : 'New year'}
		</Button>
	</div>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ---------------------------------------------------------- institution type -->
<section class="mt-8">
	{#if data.institutionTypeError}
		<Alert tone="warning" role="alert">{data.institutionTypeError} Please try again.</Alert>
	{/if}

	<form
		method="POST"
		action="?/setInstitutionType"
		use:enhance={validated(
			institutionTypeSchema,
			(next) => (typeErrors = next),
			() => {
				savingType = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					savingType = false;
					if (result.type !== 'success') return;

					const saved = result.data?.institutionType as InstitutionType | undefined;
					if (saved) {
						institutionType = saved;
						toast.success('Saved.');
					}
				};
			}
		)}
	>
		<Sheet>
			{#snippet header()}
				<div class="flex items-center gap-2">
					<Icon icon={School01Icon} class="size-4 text-muted" />
					<h2 class="font-medium">What kind of institution is this?</h2>
				</div>
				<p class="mt-0.5 text-sm text-muted">
					This shapes the grading scales and report cards on offer. Change it whenever you like.
				</p>
			{/snippet}

			<fieldset>
				<legend class="sr-only">Institution type</legend>
				<div class="grid gap-3 sm:grid-cols-4">
					{#each INSTITUTION_TYPES as type (type)}
						<div class="flex items-center gap-2">
							<Radio
								id="type-{type}"
								name="type"
								value={type}
								checked={institutionType === type}
								onchange={() => (institutionType = type)}
							/>
							<Label for="type-{type}">{institutionLabel(type)}</Label>
						</div>
					{/each}
				</div>
			</fieldset>

			{#if typeErrors.type}
				<p class="mt-2 text-xs font-medium text-danger-text" role="alert">{typeErrors.type}</p>
			{/if}

			{#snippet footer()}
				<Button type="submit" variant="secondary" loading={savingType} disabled={savingType}>
					Save
				</Button>
			{/snippet}
		</Sheet>
	</form>
</section>

<!-- ------------------------------------------------------------- new year -->
{#if newYearOpen}
	<form
		method="POST"
		action="?/createYear"
		use:enhance={validated(
			yearCreateSchema,
			(next) => (yearErrors = next),
			() => {
				creatingYear = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingYear = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdYear as Year | undefined;
					if (created) {
						years = [created, ...years];
						termsByYear = { ...termsByYear, [created.id]: [] };
						newYearOpen = false;
						toast.success(`“${created.name}” is open.`);
					}
				};
			}
		)}
	>
		<Sheet open={newYearOpen} onClose={() => (newYearOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new academic year</h2>
				<p class="mt-0.5 text-sm text-muted">
					A name and the span it covers. You can make it the current year once it exists.
				</p>
			{/snippet}

			<div class="grid gap-5">
				{#if yearErrors.form}
					<Alert tone="danger" role="alert">{yearErrors.form}</Alert>
				{/if}

				<Field id="year-name" label="Name" error={yearErrors.name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="2026"
							aria-describedby={describedBy}
							{...YEAR_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<div class="grid gap-5 sm:grid-cols-2">
					<Field id="year-starts" label="Starts on" error={yearErrors.starts_on}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="starts_on"
								aria-describedby={describedBy}
								{...YEAR_LIMITS.date}
							/>
						{/snippet}
					</Field>

					<Field id="year-ends" label="Ends on" error={yearErrors.ends_on}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="ends_on"
								aria-describedby={describedBy}
								{...YEAR_LIMITS.date}
							/>
						{/snippet}
					</Field>
				</div>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creatingYear} disabled={creatingYear}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Open year
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- new term -->
{#if termForYear}
	<form
		method="POST"
		action="?/createTerm"
		use:enhance={validated(
			termCreateSchema,
			(next) => (termErrors = next),
			() => {
				creatingTerm = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingTerm = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdTerm as Term | undefined;
					const yearId = result.data?.yearId as string | undefined;
					if (created && yearId) {
						termsByYear = {
							...termsByYear,
							[yearId]: [...(termsByYear[yearId] ?? []), created]
						};
						termForYear = null;
						toast.success(`“${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={termForYear !== null} onClose={() => (termForYear = null)}>
			{#snippet header()}
				<h2 class="font-medium">A new term</h2>
				<p class="mt-0.5 text-sm text-muted">
					A stretch of {termYear?.name ?? 'the year'} — a semester, a quarter, whatever this institution
					calls it.
				</p>
			{/snippet}

			<input type="hidden" name="year_id" value={termForYear} />

			<div class="grid gap-5">
				{#if termErrors.form}
					<Alert tone="danger" role="alert">{termErrors.form}</Alert>
				{/if}

				<Field id="term-name" label="Name" error={termErrors.name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="First term"
							aria-describedby={describedBy}
							{...YEAR_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<div class="grid gap-5 sm:grid-cols-2">
					<Field id="term-starts" label="Starts on" error={termErrors.starts_on}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="starts_on"
								aria-describedby={describedBy}
								{...YEAR_LIMITS.date}
							/>
						{/snippet}
					</Field>

					<Field id="term-ends" label="Ends on" error={termErrors.ends_on}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="ends_on"
								aria-describedby={describedBy}
								{...YEAR_LIMITS.date}
							/>
						{/snippet}
					</Field>
				</div>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creatingTerm} disabled={creatingTerm}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Add term
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- the years -->
<section class="mt-10">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-lg font-semibold">Years</h2>
			<p class="mt-1 text-sm text-muted">
				{#if currentYear}
					{currentYear.name} is the current year.
				{:else if years.length > 0}
					No year is current yet. Choose one below.
				{:else}
					Every year this institution has opened.
				{/if}
			</p>
		</div>
	</div>

	<div class="mt-4">
		{#if years.length === 0}
			<EmptyState
				icon={Calendar01Icon}
				title="No academic years yet"
				description="Open a year with the button above — give it a name and the span it covers. Everything else this school records hangs off one."
			/>
		{:else}
			<ul class="grid gap-4">
				{#each years as year (year.id)}
					{@const terms = termsByYear[year.id] ?? []}
					<li class="rounded-card border border-border bg-surface-raised p-5">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-medium">{year.name}</p>
									{#if year.is_current}
										<Badge tone="success">Current year</Badge>
									{/if}
								</div>
								<p class="numeral mt-0.5 text-sm text-muted">
									{span(year.starts_on, year.ends_on)}
								</p>
							</div>

							<div class="flex flex-wrap items-center gap-2">
								{#if !year.is_current}
									{#if confirmingCurrent === year.id}
										<form
											method="POST"
											action="?/setCurrent"
											class="flex items-center gap-2"
											use:enhance={() => {
												settingCurrent = year.id;
												return async ({ result }) => {
													settingCurrent = null;
													confirmingCurrent = null;
													if (result.type !== 'success') return applyAction(result);
													const made = result.data?.currentYear as Year | undefined;
													if (made) {
														// The API keeps at most one current year, so the mark moves rather
														// than multiplies.
														years = years.map((y) => ({ ...y, is_current: y.id === made.id }));
														toast.success(`“${made.name}” is now the current year.`);
													}
												};
											}}
										>
											<input type="hidden" name="id" value={year.id} />
											<p class="text-sm text-muted">
												Make {year.name} the current year{currentYear
													? `, instead of ${currentYear.name}?`
													: '?'}
											</p>
											<Button
												type="submit"
												size="sm"
												loading={settingCurrent === year.id}
												disabled={settingCurrent === year.id}
											>
												Yes, make it current
											</Button>
											<Button
												type="button"
												size="sm"
												variant="ghost"
												onclick={() => (confirmingCurrent = null)}
											>
												Cancel
											</Button>
										</form>
									{:else}
										<Button
											size="sm"
											variant="secondary"
											onclick={() => {
												confirmingCurrent = year.id;
												confirmingDelete = null;
											}}
										>
											<Icon icon={CheckmarkCircle02Icon} class="size-4" />
											Make current
										</Button>
									{/if}
								{/if}

								<Button size="sm" variant="ghost" onclick={() => (termForYear = year.id)}>
									<Icon icon={PlusSignIcon} class="size-4" />
									Add term
								</Button>

								{#if confirmingDelete === year.id}
									<form
										method="POST"
										action="?/deleteYear"
										class="flex items-center gap-2"
										use:enhance={() => {
											deletingYear = year.id;
											return async ({ result }) => {
												deletingYear = null;
												confirmingDelete = null;
												if (result.type !== 'success') return applyAction(result);
												years = years.filter((y) => y.id !== year.id);
												toast.success(`“${year.name}” has been removed.`);
											};
										}}
									>
										<input type="hidden" name="id" value={year.id} />
										<p class="text-sm text-muted">
											Remove {year.name} and its {terms.length === 1
												? '1 term'
												: `${terms.length} terms`}? This cannot be undone.
										</p>
										<Button
											type="submit"
											size="sm"
											variant="danger"
											loading={deletingYear === year.id}
											disabled={deletingYear === year.id}
										>
											Yes, remove it
										</Button>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											onclick={() => (confirmingDelete = null)}
										>
											Cancel
										</Button>
									</form>
								{:else}
									<Button
										size="sm"
										variant="ghost"
										onclick={() => {
											confirmingDelete = year.id;
											confirmingCurrent = null;
										}}
									>
										Remove
									</Button>
								{/if}
							</div>
						</div>

						<!-- the year's terms -->
						<div class="mt-4 border-t border-border pt-4">
							{#if terms.length === 0}
								<p class="text-sm text-muted">
									No terms yet. Add one and this year can be broken into stretches.
								</p>
							{:else}
								<ul class="grid gap-2 sm:grid-cols-2">
									{#each terms as term (term.id)}
										<li
											class="flex items-center justify-between gap-3 rounded-card bg-surface-sunken px-3 py-2"
										>
											<div class="min-w-0">
												<p class="truncate text-sm font-medium">{term.name}</p>
												<p class="numeral mt-0.5 text-xs text-muted">
													{span(term.starts_on, term.ends_on)}
												</p>
											</div>

											{#if confirmingTerm === term.id}
												<form
													method="POST"
													action="?/deleteTerm"
													class="flex shrink-0 items-center gap-1"
													use:enhance={() => {
														deletingTerm = term.id;
														return async ({ result }) => {
															deletingTerm = null;
															confirmingTerm = null;
															if (result.type !== 'success') return applyAction(result);
															termsByYear = {
																...termsByYear,
																[year.id]: (termsByYear[year.id] ?? []).filter(
																	(t) => t.id !== term.id
																)
															};
															toast.success(`“${term.name}” has been removed.`);
														};
													}}
												>
													<input type="hidden" name="id" value={term.id} />
													<input type="hidden" name="year_id" value={year.id} />
													<Button
														type="submit"
														size="sm"
														variant="danger"
														loading={deletingTerm === term.id}
														disabled={deletingTerm === term.id}
													>
														Remove
													</Button>
													<Button
														type="button"
														size="sm"
														variant="ghost"
														onclick={() => (confirmingTerm = null)}
													>
														Keep
													</Button>
												</form>
											{:else}
												<Button
													size="sm"
													variant="ghost"
													class="shrink-0"
													onclick={() => (confirmingTerm = term.id)}
												>
													Remove
												</Button>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
