<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		ArrowLeft01Icon,
		BookOpen01Icon,
		Delete02Icon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Card,
		EmptyState,
		Field,
		Icon,
		Input,
		Numeral,
		PageHeader,
		Select,
		Sheet,
		Textarea
	} from '$lib/components';
	import {
		HIFZ_KINDS,
		HIFZ_LIMITS,
		HIFZ_RATINGS,
		kindLabel,
		kindTone,
		logHifzSchema,
		passage,
		ratingLabel,
		ratingTone,
		type HifzEntry
	} from '$lib/hifz';
	import { appendPage, canLoadMore, type Paged } from '$lib/paging';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const student = $derived(data.student);
	const summary = $derived(data.summary);

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const entryKey = (entry: HifzEntry) => entry.id;
	let log = $derived(data.log as Paged<HifzEntry>);

	// The counts by kind, always all three, so an unrecited kind reads as 0 not a gap.
	const counts = $derived(HIFZ_KINDS.map((kind) => ({ kind, value: summary.counts[kind] ?? 0 })));

	// A fresh log defaults to today; the teacher usually records the day it happened.
	const today = new Date().toISOString().slice(0, 10);

	let loggingOpen = $state(false);
	let logging = $state(false);
	let loadingMore = $state(false);
	let removing = $state<string | null>(null);
	let confirming = $state<string | null>(null);
</script>

<svelte:head><title>Hifz — {student.full_name} — Muallim</title></svelte:head>

<a
	href={resolve('/manage/hifz')}
	class="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
>
	<Icon icon={ArrowLeft01Icon} class="size-4" />
	All students
</a>

<div class="mt-4">
	<PageHeader title={student.full_name} description="Hifz record">
		{#snippet meta()}
			<span class="numeral text-muted">Admission no. {student.admission_no}</span>
		{/snippet}
		{#snippet actions()}
			<Button onclick={() => (loggingOpen = !loggingOpen)}>
				<Icon icon={PlusSignIcon} class="size-4" />
				{loggingOpen ? 'Close' : 'Log recitation'}
			</Button>
		{/snippet}
	</PageHeader>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ----------------------------------------------------------------- summary -->
<section class="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
	<Card class="p-5">
		<h2 class="text-sm font-medium text-muted">Current Sabaq</h2>
		{#if summary.current_sabaq}
			<p class="mt-2 text-2xl font-semibold tracking-tight text-pretty">
				{passage(summary.current_sabaq)}
			</p>
			<p class="numeral mt-1 text-sm text-muted">
				{summary.current_sabaq.on_date} · {ratingLabel(summary.current_sabaq.rating)}
			</p>
		{:else}
			<p class="mt-2 text-muted">No Sabaq recorded yet.</p>
		{/if}
	</Card>

	<Card class="p-5">
		<h2 class="text-sm font-medium text-muted">
			Last <Numeral value={data.summaryDays} /> days
		</h2>
		<dl class="mt-3 grid grid-cols-3 gap-2">
			{#each counts as { kind, value } (kind)}
				<div class="rounded-control bg-surface-sunken px-3 py-2.5 text-center">
					<dd class="text-xl font-semibold tracking-tight">
						<Numeral {value} />
					</dd>
					<dt class="mt-0.5 text-xs text-muted">{kindLabel(kind)}</dt>
				</div>
			{/each}
		</dl>
	</Card>
</section>

<!-- ------------------------------------------------------------------- log it -->
{#if loggingOpen}
	<form
		method="POST"
		action="?/log"
		class="mt-6"
		use:enhance={validated(
			logHifzSchema,
			(next) => (errors = next),
			() => {
				logging = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: true });
					logging = false;
					if (result.type !== 'success') return;
					const logged = result.data?.logged as HifzEntry | undefined;
					if (logged) {
						loggingOpen = false;
						toast.success('Recitation logged.');
					}
				};
			}
		)}
	>
		<Sheet open={loggingOpen} onClose={() => (loggingOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Log a recitation</h2>
				<p class="mt-0.5 text-sm text-muted">
					What was recited, when, and how it went. Sabaq is the new lesson, Sabqi the recent
					revision, Manzil the ground already held.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="on_date" label="Date" error={problem('on_date')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="on_date"
							value={today}
							aria-describedby={describedBy}
							{...HIFZ_LIMITS.onDate}
						/>
					{/snippet}
				</Field>

				<Field id="kind" label="Kind" error={problem('kind')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="kind" value="sabaq" aria-describedby={describedBy}>
							{#each HIFZ_KINDS as kind (kind)}
								<option value={kind}>{kindLabel(kind)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="surah" label="Surah (1–114)" error={problem('surah')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="surah"
							inputmode="numeric"
							placeholder="2"
							aria-describedby={describedBy}
							{...HIFZ_LIMITS.surah}
						/>
					{/snippet}
				</Field>

				<Field id="rating" label="Rating" error={problem('rating')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="rating" value="good" aria-describedby={describedBy}>
							{#each HIFZ_RATINGS as rating (rating)}
								<option value={rating}>{ratingLabel(rating)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="ayah_from" label="From ayah" error={problem('ayah_from')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="ayah_from"
							inputmode="numeric"
							placeholder="1"
							aria-describedby={describedBy}
							{...HIFZ_LIMITS.ayah}
						/>
					{/snippet}
				</Field>

				<Field id="ayah_to" label="To ayah" error={problem('ayah_to')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="ayah_to"
							inputmode="numeric"
							placeholder="20"
							aria-describedby={describedBy}
							{...HIFZ_LIMITS.ayah}
						/>
					{/snippet}
				</Field>

				<div class="sm:col-span-2">
					<Field id="note" label="Note" error={problem('note')}>
						{#snippet children({ id, describedBy, invalid })}
							<Textarea
								{id}
								{invalid}
								name="note"
								rows={2}
								placeholder="Optional — a remark for the record."
								aria-describedby={describedBy}
								{...HIFZ_LIMITS.note}
							/>
						{/snippet}
					</Field>
				</div>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={logging} disabled={logging}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Log recitation
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- --------------------------------------------------------------------- log -->
<section class="mt-8">
	<h2 class="text-lg font-semibold">Log</h2>

	{#if log.rows.length === 0}
		<div class="mt-4">
			<EmptyState
				icon={BookOpen01Icon}
				title="Nothing logged yet"
				description="Log this student’s first recitation and it will appear here, newest first."
			/>
		</div>
	{:else}
		<ul class="mt-4 space-y-3">
			{#each log.rows as entry (entry.id)}
				<li class="rounded-card border border-border bg-surface-raised p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-medium">{passage(entry)}</span>
								<Badge tone={kindTone(entry.kind)}>{kindLabel(entry.kind)}</Badge>
								<Badge tone={ratingTone(entry.rating)}>{ratingLabel(entry.rating)}</Badge>
							</div>
							<p class="numeral mt-1 text-sm text-muted">{entry.on_date}</p>
							{#if entry.note}
								<p class="mt-2 text-sm text-pretty">{entry.note}</p>
							{/if}
						</div>

						{#if confirming === entry.id}
							<form
								method="POST"
								action="?/remove"
								class="flex shrink-0 items-center gap-2"
								use:enhance={() => {
									removing = entry.id;
									return async ({ result }) => {
										removing = null;
										confirming = null;
										if (result.type !== 'success') return applyAction(result);
										log = { ...log, rows: log.rows.filter((e) => e.id !== entry.id) };
										toast.success('Entry removed.');
									};
								}}
							>
								<input type="hidden" name="entry_id" value={entry.id} />
								<Button
									type="submit"
									variant="danger"
									size="sm"
									loading={removing === entry.id}
									disabled={removing === entry.id}
								>
									Remove
								</Button>
								<Button type="button" variant="ghost" size="sm" onclick={() => (confirming = null)}>
									Keep
								</Button>
							</form>
						{:else}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => (confirming = entry.id)}
								aria-label="Remove entry"
							>
								<Icon icon={Delete02Icon} class="size-4" />
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>

		{#if canLoadMore(log)}
			<form
				method="POST"
				action="?/more"
				class="mt-4 flex justify-center"
				use:enhance={() => {
					loadingMore = true;
					return async ({ result }) => {
						loadingMore = false;
						if (result.type !== 'success') return applyAction(result);
						const next = result.data?.more as Paged<HifzEntry> | undefined;
						if (next) log = appendPage(log, next, entryKey);
					};
				}}
			>
				<input type="hidden" name="cursor" value={log.cursor} />
				<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
					<Icon icon={ArrowDown01Icon} class="size-4" />
					Load more
				</Button>
			</form>
		{/if}
	{/if}
</section>
