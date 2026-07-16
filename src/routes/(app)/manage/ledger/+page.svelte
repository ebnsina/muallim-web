<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		ArrowDown01Icon,
		Cancel01Icon,
		MoneyReceive01Icon,
		MoneySend01Icon,
		Notebook01Icon,
		PlusSignIcon,
		Tag01Icon,
		Wallet01Icon
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
		Sheet,
		Textarea
	} from '$lib/components';
	import {
		KINDS,
		LEDGER_LIMITS,
		categorySchema,
		entrySchema,
		kindLabel,
		kindTone,
		type Category,
		type Entry,
		type Total
	} from '$lib/ledger';
	import { formatMoney } from '$lib/money';
	import { appendPage, canLoadMore, type Paged } from '$lib/paging';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const entryKey = (entry: Entry) => entry.id;

	// The rows on screen, seeded by the server and mutated in place as categories are
	// created and entries recorded.
	let categories = $derived(data.categories as Category[]);
	let entries = $derived(data.entries as Paged<Entry>);
	const totals = $derived(data.totals as Total[]);

	const categoryMap = $derived(new Map(categories.map((c) => [c.id, c])));
	const categoryName = (id: string) => categoryMap.get(id)?.name ?? 'Uncategorised';
	const categoryKind = (id: string) => categoryMap.get(id)?.kind ?? 'expense';

	// Per-form field errors, kept apart so one form's mistake does not light another.
	let categoryErrors = $state<FieldErrors>({});
	let entryErrors = $state<FieldErrors>({});

	let newCategoryOpen = $state(false);
	let recordOpen = $state(false);
	let creatingCategory = $state(false);
	let recording = $state(false);
	let loadingMore = $state(false);

	// The categories an entry may be booked against, split so a picker can group them.
	const incomeCategories = $derived(categories.filter((c) => c.kind === 'income'));
	const expenseCategories = $derived(categories.filter((c) => c.kind === 'expense'));

	// Today, as `YYYY-MM-DD`, to prefill the date box — most entries are booked the day
	// the money moved.
	const today = new Date().toISOString().slice(0, 10);
</script>

<svelte:head><title>Accounts — Muallim</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div class="min-w-0">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Accounts</h1>
		<p class="mt-2 max-w-2xl text-muted">
			This school’s own income and expense books, kept apart from the fees a student is billed.
		</p>
	</div>
	<div class="flex shrink-0 items-center gap-3">
		<Button variant="secondary" onclick={() => (newCategoryOpen = !newCategoryOpen)}>
			<Icon icon={newCategoryOpen ? Cancel01Icon : Tag01Icon} class="size-4" />
			{newCategoryOpen ? 'Close' : 'New category'}
		</Button>
		<Button onclick={() => (recordOpen = !recordOpen)} disabled={categories.length === 0}>
			<Icon icon={recordOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{recordOpen ? 'Close' : 'Record entry'}
		</Button>
	</div>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ------------------------------------------------------------- summary -->
<section class="mt-8">
	{#if totals.length === 0}
		<div class="rounded-card border border-border bg-surface-raised p-5">
			<div class="flex items-center gap-2.5">
				<Icon icon={Wallet01Icon} class="size-4 text-muted" />
				<h2 class="text-sm font-medium">Summary</h2>
			</div>
			<p class="mt-3 text-2xl font-semibold tracking-tight">
				{formatMoney({ amount_minor: 0, currency: 'BDT' })}
			</p>
			<p class="mt-1 text-sm text-muted">Nothing booked yet.</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each totals as total (total.currency)}
				<div class="rounded-card border border-border bg-surface-raised p-5">
					<div class="flex items-center justify-between gap-2">
						<h2 class="text-sm font-medium text-muted">{total.currency}</h2>
						<Badge tone={total.net >= 0 ? 'success' : 'danger'}>
							Net {formatMoney({ amount_minor: total.net, currency: total.currency })}
						</Badge>
					</div>
					<dl class="mt-4 space-y-2 text-sm">
						<div class="flex items-center justify-between gap-3">
							<dt class="flex items-center gap-1.5 text-muted">
								<Icon icon={MoneyReceive01Icon} class="size-4 text-success" />
								Income
							</dt>
							<dd class="numeral font-medium">
								{formatMoney({ amount_minor: total.income, currency: total.currency })}
							</dd>
						</div>
						<div class="flex items-center justify-between gap-3">
							<dt class="flex items-center gap-1.5 text-muted">
								<Icon icon={MoneySend01Icon} class="size-4 text-danger" />
								Expense
							</dt>
							<dd class="numeral font-medium">
								{formatMoney({ amount_minor: total.expense, currency: total.currency })}
							</dd>
						</div>
					</dl>
				</div>
			{/each}
		</div>
	{/if}
</section>

<!-- ---------------------------------------------------------- new category -->
{#if newCategoryOpen}
	<form
		method="POST"
		action="?/createCategory"
		class="mt-6"
		use:enhance={validated(
			categorySchema,
			(next) => (categoryErrors = next),
			() => {
				creatingCategory = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingCategory = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdCategory as Category | undefined;
					if (created) {
						categories = [...categories, created];
						newCategoryOpen = false;
						toast.success(`“${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={newCategoryOpen} onClose={() => (newCategoryOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new category</h2>
				<p class="mt-0.5 text-sm text-muted">
					A named bucket, either income or expense. An entry inherits which way the money moves from
					the category it lands in.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="category-name" label="Name" error={categoryErrors.name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="Donations, Salaries…"
							aria-describedby={describedBy}
							{...LEDGER_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<Field id="category-kind" label="Kind" error={categoryErrors.kind}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="kind" value="income" aria-describedby={describedBy}>
							{#each KINDS as k (k)}
								<option value={k}>{kindLabel(k)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creatingCategory} disabled={creatingCategory}>
					<Icon icon={Tag01Icon} class="size-4" />
					Create category
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------ record entry -->
{#if recordOpen}
	<form
		method="POST"
		action="?/recordEntry"
		class="mt-6"
		use:enhance={validated(
			entrySchema,
			(next) => (entryErrors = next),
			() => {
				recording = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					recording = false;
					if (result.type !== 'success') return;

					const recorded = result.data?.recordedEntry as Entry | undefined;
					if (recorded) {
						entries = { ...entries, rows: [recorded, ...entries.rows] };
						recordOpen = false;
						toast.success('The entry has been recorded.');
					}
				};
			}
		)}
	>
		<Sheet open={recordOpen} onClose={() => (recordOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Record an entry</h2>
				<p class="mt-0.5 text-sm text-muted">
					An amount booked against a category on a day. Amounts are in taka.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="entry-category" label="Category" error={entryErrors.category_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="category_id" value="" aria-describedby={describedBy}>
							<option value="" disabled>Choose a category</option>
							{#if incomeCategories.length}
								<optgroup label="Income">
									{#each incomeCategories as c (c.id)}
										<option value={c.id}>{c.name}</option>
									{/each}
								</optgroup>
							{/if}
							{#if expenseCategories.length}
								<optgroup label="Expense">
									{#each expenseCategories as c (c.id)}
										<option value={c.id}>{c.name}</option>
									{/each}
								</optgroup>
							{/if}
						</Select>
					{/snippet}
				</Field>

				<Field id="entry-amount" label="Amount (৳)" error={entryErrors.amount}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="amount"
							inputmode="decimal"
							placeholder="1200"
							aria-describedby={describedBy}
							{...LEDGER_LIMITS.amount}
						/>
					{/snippet}
				</Field>

				<Field id="entry-date" label="Date" error={entryErrors.occurred_on}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="occurred_on"
							value={today}
							aria-describedby={describedBy}
							{...LEDGER_LIMITS.occurredOn}
						/>
					{/snippet}
				</Field>

				<Field id="entry-description" label="Description" error={entryErrors.description}>
					{#snippet children({ id, describedBy, invalid })}
						<Textarea
							{id}
							{invalid}
							name="description"
							rows={1}
							placeholder="Optional — where this came from"
							aria-describedby={describedBy}
							{...LEDGER_LIMITS.description}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={recording} disabled={recording}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Record entry
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- categories -->
<section class="mt-10">
	<h2 class="text-lg font-semibold">Categories</h2>
	<p class="mt-1 text-sm text-muted">The buckets an entry is booked against.</p>

	{#if categories.length === 0}
		<div class="mt-4">
			<EmptyState
				icon={Tag01Icon}
				title="No categories yet"
				description="Create a category above and it will appear here, ready to book entries against."
			/>
		</div>
	{:else}
		<ul class="mt-4 flex flex-wrap gap-2">
			{#each categories as category (category.id)}
				<li
					class="flex items-center gap-2 rounded-card border border-border bg-surface-raised px-3 py-2"
				>
					<span class="font-medium">{category.name}</span>
					<Badge tone={kindTone(category.kind)}>{kindLabel(category.kind)}</Badge>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<!-- ------------------------------------------------------------- entries -->
<section class="mt-10">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-lg font-semibold">Entries</h2>
			<p class="mt-1 text-sm text-muted">Every booking, newest first.</p>
		</div>

		<form method="GET" class="flex flex-wrap items-end gap-3">
			<div class="w-40">
				<Field id="kind-filter" label="Kind">
					{#snippet children({ id })}
						<Select
							{id}
							name="kind"
							value={data.kind}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">Either kind</option>
							{#each KINDS as k (k)}
								<option value={k}>{kindLabel(k)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<div class="w-44">
				<Field id="category-filter" label="Category">
					{#snippet children({ id })}
						<Select
							{id}
							name="category"
							value={data.categoryId}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">All categories</option>
							{#each categories as c (c.id)}
								<option value={c.id}>{c.name}</option>
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
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
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
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						/>
					{/snippet}
				</Field>
			</div>
			<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
		</form>
	</div>

	<div class="mt-4">
		{#if data.entriesError && entries.rows.length === 0}
			<Alert tone="warning" role="alert">{data.entriesError}</Alert>
		{:else if entries.rows.length === 0}
			<EmptyState
				icon={Notebook01Icon}
				title="No entries"
				description={data.kind || data.categoryId || data.from || data.to
					? 'Nothing matches this filter. Try another kind, category or date range.'
					: 'Record an entry above and it will appear here.'}
			/>
		{:else}
			<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
				<table class="w-full border-collapse text-sm">
					<caption class="sr-only"
						>Every entry: the date, the category, its kind, and the amount.</caption
					>
					<thead>
						<tr class="border-b border-border bg-surface-sunken text-left">
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Date</th>
							<th scope="col" class="px-4 py-3 font-medium">Category</th>
							<th scope="col" class="px-4 py-3 font-medium">Kind</th>
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Amount</th>
						</tr>
					</thead>
					<tbody>
						{#each entries.rows as entry (entry.id)}
							{@const kind = categoryKind(entry.category_id)}
							<tr class="border-b border-border last:border-0">
								<td class="px-4 py-3 whitespace-nowrap text-muted">{entry.occurred_on}</td>
								<td class="px-4 py-3 font-medium">
									{categoryName(entry.category_id)}
									{#if entry.description}
										<span class="block text-xs font-normal text-muted">{entry.description}</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<Badge tone={kindTone(kind)}>{kindLabel(kind)}</Badge>
								</td>
								<td
									class="numeral px-4 py-3 whitespace-nowrap font-medium"
									class:text-success={kind === 'income'}
									class:text-danger={kind === 'expense'}
								>
									{kind === 'expense' ? '−' : '+'}{formatMoney({
										amount_minor: entry.amount,
										currency: entry.currency
									})}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if canLoadMore(entries)}
				<form
					method="POST"
					action="?/more"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingMore = true;
						return async ({ result }) => {
							loadingMore = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.more as Paged<Entry> | undefined;
							if (next) entries = appendPage(entries, next, entryKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={entries.cursor} />
					<input type="hidden" name="kind" value={data.kind} />
					<input type="hidden" name="category" value={data.categoryId} />
					<input type="hidden" name="from" value={data.from} />
					<input type="hidden" name="to" value={data.to} />
					<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more entries
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</section>
