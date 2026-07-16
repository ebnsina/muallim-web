<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		ArrowDown01Icon,
		Cancel01Icon,
		CheckmarkCircle02Icon,
		Coins01Icon,
		Delete02Icon,
		Invoice01Icon,
		MoneyReceive01Icon,
		PlusSignIcon,
		RemoveCircleIcon,
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
		Sheet
	} from '$lib/components';
	import {
		FEE_LIMITS,
		RECURRENCES,
		adhocInvoiceSchema,
		feeStructureSchema,
		invoiceStatusLabel,
		invoiceStatusTone,
		issueFeesSchema,
		payInvoiceSchema,
		recurrenceLabel,
		type FeeStructure,
		type Invoice
	} from '$lib/fees';
	import { formatMoney } from '$lib/money';
	import { appendPage, canLoadMore, replaceRow, type Paged } from '$lib/paging';
	import type { Student } from '$lib/students';
	import { INVOICE_STATUSES } from '$lib/fees';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const invoiceKey = (invoice: Invoice) => invoice.id;

	// The rows on screen, seeded by the server and mutated in place as fees are raised,
	// paid, waived and cancelled.
	let structures = $derived(data.structures as FeeStructure[]);
	let invoices = $derived(data.invoices as Paged<Invoice>);

	const students = $derived(data.students as Student[]);
	const studentMap = $derived(new Map(students.map((s) => [s.id, s.full_name])));
	const classMap = $derived(new Map(data.classes.map((klass) => [klass.id, klass.name])));

	const studentName = (id: string) => studentMap.get(id) ?? 'Unknown student';

	// Per-form field errors, kept apart so one form's mistake does not light another.
	let structureErrors = $state<FieldErrors>({});
	let issueErrors = $state<FieldErrors>({});
	let invoiceErrors = $state<FieldErrors>({});
	let payErrors = $state<FieldErrors>({});

	let newFeeOpen = $state(false);
	let raiseOpen = $state(false);
	let creatingFee = $state(false);
	let raising = $state(false);
	let loadingMore = $state(false);

	// Which structure is being issued, and which invoice is being paid — each opens one
	// inline form at a time.
	let issuingId = $state<string | null>(null);
	let issuing = $state(false);
	let payingId = $state<string | null>(null);
	let paying = $state(false);
	let acting = $state<string | null>(null);

	const owed = $derived(data.ledger ? Object.entries(data.ledger.outstanding) : []);

	// The remaining balance on an invoice, in major units, to prefill the pay box.
	const remainingMajor = (invoice: Invoice) =>
		Math.max(0, invoice.amount - invoice.paid_amount) / 100;
</script>

<svelte:head><title>Fees — Muallim</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div class="min-w-0">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Fees</h1>
		<p class="mt-2 max-w-2xl text-muted">
			The charges this school bills by, the invoices it raises, and what each student owes.
		</p>
	</div>
	<div class="flex shrink-0 items-center gap-3">
		<Button variant="secondary" onclick={() => (newFeeOpen = !newFeeOpen)}>
			<Icon icon={newFeeOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{newFeeOpen ? 'Close' : 'New fee'}
		</Button>
		<Button onclick={() => (raiseOpen = !raiseOpen)}>
			<Icon icon={raiseOpen ? Cancel01Icon : Invoice01Icon} class="size-4" />
			{raiseOpen ? 'Close' : 'Raise invoice'}
		</Button>
	</div>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ---------------------------------------------------------------- new fee -->
{#if newFeeOpen}
	<form
		method="POST"
		action="?/createStructure"
		class="mt-6"
		use:enhance={validated(
			feeStructureSchema,
			(next) => (structureErrors = next),
			() => {
				creatingFee = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingFee = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdStructure as FeeStructure | undefined;
					if (created) {
						structures = [created, ...structures];
						newFeeOpen = false;
						toast.success(`“${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={newFeeOpen} onClose={() => (newFeeOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new fee</h2>
				<p class="mt-0.5 text-sm text-muted">
					A named, recurring charge. Tie it to a class, or leave it for every class. Amounts are in
					taka.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="name" label="Name" error={structureErrors.name}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							placeholder="Monthly tuition"
							aria-describedby={describedBy}
							{...FEE_LIMITS.name}
						/>
					{/snippet}
				</Field>

				<Field id="amount" label="Amount (৳)" error={structureErrors.amount}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="amount"
							inputmode="decimal"
							placeholder="1200"
							aria-describedby={describedBy}
							{...FEE_LIMITS.amount}
						/>
					{/snippet}
				</Field>

				<Field id="recurrence" label="Billed" error={structureErrors.recurrence}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="recurrence" value="monthly" aria-describedby={describedBy}>
							{#each RECURRENCES as r (r)}
								<option value={r}>{recurrenceLabel(r)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="grade_level_id" label="Class" error={structureErrors.grade_level_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="grade_level_id" aria-describedby={describedBy}>
							<option value="">Every class</option>
							{#each data.classes as klass (klass.id)}
								<option value={klass.id}>{klass.name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="currency" label="Currency" error={structureErrors.currency}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="currency"
							value="BDT"
							aria-describedby={describedBy}
							{...FEE_LIMITS.currency}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creatingFee} disabled={creatingFee}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create fee
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- raise invoice -->
{#if raiseOpen}
	<form
		method="POST"
		action="?/createInvoice"
		class="mt-6"
		use:enhance={validated(
			adhocInvoiceSchema,
			(next) => (invoiceErrors = next),
			() => {
				raising = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					raising = false;
					if (result.type !== 'success') return;

					const created = result.data?.createdInvoice as Invoice | undefined;
					if (created) {
						invoices = { ...invoices, rows: [created, ...invoices.rows] };
						raiseOpen = false;
						toast.success('The invoice has been raised.');
					}
				};
			}
		)}
	>
		<Sheet open={raiseOpen} onClose={() => (raiseOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Raise an invoice</h2>
				<p class="mt-0.5 text-sm text-muted">
					A one-off charge against a single student, with no structure behind it.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="student_id" label="Student" error={invoiceErrors.student_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select {id} {invalid} name="student_id" value="" aria-describedby={describedBy}>
							<option value="" disabled>Choose a student</option>
							{#each students as s (s.id)}
								<option value={s.id}>{s.full_name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field id="invoice_title" label="Title" error={invoiceErrors.title}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="title"
							placeholder="Exam fee"
							aria-describedby={describedBy}
							{...FEE_LIMITS.invoiceTitle}
						/>
					{/snippet}
				</Field>

				<Field id="invoice_amount" label="Amount (৳)" error={invoiceErrors.amount}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="amount"
							inputmode="decimal"
							placeholder="500"
							aria-describedby={describedBy}
							{...FEE_LIMITS.amount}
						/>
					{/snippet}
				</Field>

				<Field id="invoice_currency" label="Currency" error={invoiceErrors.currency}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="currency"
							value="BDT"
							aria-describedby={describedBy}
							{...FEE_LIMITS.currency}
						/>
					{/snippet}
				</Field>

				<Field id="invoice_due" label="Due date" error={invoiceErrors.due_date}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="due_date"
							aria-describedby={describedBy}
							{...FEE_LIMITS.dueDate}
						/>
					{/snippet}
				</Field>

				<Field id="invoice_note" label="Note" error={invoiceErrors.note}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="note"
							placeholder="Optional"
							aria-describedby={describedBy}
							{...FEE_LIMITS.note}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={raising} disabled={raising}>
					<Icon icon={Invoice01Icon} class="size-4" />
					Raise invoice
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ------------------------------------------------------------- structures -->
<section class="mt-10">
	<h2 class="text-lg font-semibold">Fee structures</h2>
	<p class="mt-1 text-sm text-muted">The charges this school bills by, and how to issue them.</p>

	{#if structures.length === 0}
		<div class="mt-4">
			<EmptyState
				icon={Coins01Icon}
				title="No fee structures yet"
				description="Create a fee above and it will appear here, ready to issue for a period."
			/>
		</div>
	{:else}
		<ul class="mt-4 grid gap-3 sm:grid-cols-2">
			{#each structures as structure (structure.id)}
				<li class="rounded-card border border-border bg-surface-raised p-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="font-medium">{structure.name}</p>
							<p class="mt-0.5 text-sm text-muted">
								{formatMoney({ amount_minor: structure.amount, currency: structure.currency })}
								· {recurrenceLabel(structure.recurrence)}
								{#if structure.grade_level_id}
									· {classMap.get(structure.grade_level_id) ?? 'A class'}
								{:else}
									· Every class
								{/if}
							</p>
						</div>
						<div class="flex shrink-0 items-center gap-1">
							<Button
								size="sm"
								variant="ghost"
								onclick={() => (issuingId = issuingId === structure.id ? null : structure.id)}
							>
								<Icon icon={MoneyReceive01Icon} class="size-4" />
								Issue
							</Button>
							<form
								method="POST"
								action="?/deleteStructure"
								use:enhance={() => {
									acting = structure.id;
									return async ({ result }) => {
										acting = null;
										if (result.type !== 'success') return applyAction(result);
										structures = structures.filter((s) => s.id !== structure.id);
										toast.success(`“${structure.name}” has been deleted.`);
									};
								}}
							>
								<input type="hidden" name="id" value={structure.id} />
								<Button
									type="submit"
									size="sm"
									variant="ghost"
									loading={acting === structure.id}
									disabled={acting === structure.id}
									aria-label="Delete {structure.name}"
								>
									<Icon icon={Delete02Icon} class="size-4" />
								</Button>
							</form>
						</div>
					</div>

					{#if issuingId === structure.id}
						<form
							method="POST"
							action="?/issue"
							class="mt-4 border-t border-border pt-4"
							use:enhance={validated(
								issueFeesSchema,
								(next) => (issueErrors = next),
								() => {
									issuing = true;
									return async ({ result, update }) => {
										await update({ invalidateAll: false });
										issuing = false;
										if (result.type !== 'success') return;

										const count = result.data?.issued as number | undefined;
										if (count !== undefined) {
											issuingId = null;
											toast.success(
												count === 0
													? 'Nobody new to bill — those fees were already issued.'
													: `Issued ${count} ${count === 1 ? 'invoice' : 'invoices'}.`
											);
										}
									};
								}
							)}
						>
							<input type="hidden" name="structure_id" value={structure.id} />
							<div class="grid gap-4 sm:grid-cols-3">
								<Field id="period-{structure.id}" label="Period" error={issueErrors.period}>
									{#snippet children({ id, describedBy, invalid })}
										<Input
											{id}
											{invalid}
											name="period"
											placeholder="2026-07"
											aria-describedby={describedBy}
											{...FEE_LIMITS.period}
										/>
									{/snippet}
								</Field>
								<Field
									id="issue-class-{structure.id}"
									label="Class"
									error={issueErrors.grade_level_id}
								>
									{#snippet children({ id, describedBy, invalid })}
										<Select
											{id}
											{invalid}
											name="grade_level_id"
											value={structure.grade_level_id ?? ''}
											aria-describedby={describedBy}
										>
											<option value="">Every class</option>
											{#each data.classes as klass (klass.id)}
												<option value={klass.id}>{klass.name}</option>
											{/each}
										</Select>
									{/snippet}
								</Field>
								<Field id="issue-due-{structure.id}" label="Due date" error={issueErrors.due_date}>
									{#snippet children({ id, describedBy, invalid })}
										<Input
											{id}
											{invalid}
											name="due_date"
											aria-describedby={describedBy}
											{...FEE_LIMITS.dueDate}
										/>
									{/snippet}
								</Field>
							</div>
							<div class="mt-4 flex justify-end">
								<Button type="submit" size="sm" loading={issuing} disabled={issuing}>
									<Icon icon={MoneyReceive01Icon} class="size-4" />
									Issue for period
								</Button>
							</div>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<!-- ------------------------------------------------------------- ledger -->
{#if data.studentId && data.ledger}
	<section class="mt-10 rounded-card border border-border bg-surface-raised p-5">
		<div class="flex items-center gap-2.5">
			<Icon icon={Wallet01Icon} class="size-4 text-muted" />
			<h2 class="text-sm font-medium">{studentName(data.studentId)}’s ledger</h2>
		</div>
		{#if owed.length === 0}
			<p class="mt-3 text-2xl font-semibold tracking-tight">
				{formatMoney({ amount_minor: 0, currency: 'BDT' })}
			</p>
			<p class="mt-1 text-sm text-muted">Nothing outstanding.</p>
		{:else}
			<p class="mt-1 text-sm text-muted">Outstanding</p>
			<ul class="mt-1 space-y-1">
				{#each owed as [currency, amountMinor] (currency)}
					<li class="text-2xl font-semibold tracking-tight">
						{formatMoney({ amount_minor: amountMinor, currency })}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<!-- ------------------------------------------------------------- invoices -->
<section class="mt-10">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-lg font-semibold">Invoices</h2>
			<p class="mt-1 text-sm text-muted">Every charge raised, and how to settle it.</p>
		</div>

		<form method="GET" class="flex flex-wrap items-end gap-3">
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
							{#each INVOICE_STATUSES as s (s)}
								<option value={s}>{invoiceStatusLabel(s)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<noscript><Button type="submit" variant="secondary">Apply</Button></noscript>
		</form>
	</div>

	<div class="mt-4">
		{#if data.invoicesError && invoices.rows.length === 0}
			<Alert tone="warning" role="alert">
				{data.invoicesError} Pick a student above to see their invoices.
			</Alert>
		{:else if invoices.rows.length === 0}
			<EmptyState
				icon={Invoice01Icon}
				title="No invoices"
				description={data.status || data.studentId
					? 'Nothing matches this filter. Try another student or status.'
					: 'Issue a fee or raise an invoice above and it will appear here.'}
			/>
		{:else}
			<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
				<table class="w-full border-collapse text-sm">
					<caption class="sr-only"
						>Every invoice: the student, the charge, the amount, and its status.</caption
					>
					<thead>
						<tr class="border-b border-border bg-surface-sunken text-left">
							<th scope="col" class="px-4 py-3 font-medium">Student</th>
							<th scope="col" class="px-4 py-3 font-medium">Charge</th>
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Amount</th>
							<th scope="col" class="px-4 py-3 font-medium">Status</th>
							<th scope="col" class="px-4 py-3 font-medium"><span class="sr-only">Actions</span></th
							>
						</tr>
					</thead>
					<tbody>
						{#each invoices.rows as invoice (invoice.id)}
							<tr class="border-b border-border last:border-0">
								<td class="px-4 py-3 font-medium">{studentName(invoice.student_id)}</td>
								<td class="px-4 py-3 text-muted">
									{invoice.title}
									{#if invoice.period}<span class="text-xs">· {invoice.period}</span>{/if}
								</td>
								<td class="numeral px-4 py-3 whitespace-nowrap">
									{formatMoney({ amount_minor: invoice.amount, currency: invoice.currency })}
									{#if invoice.paid_amount > 0 && invoice.status !== 'paid'}
										<span class="block text-xs text-muted">
											{formatMoney({
												amount_minor: invoice.paid_amount,
												currency: invoice.currency
											})} paid
										</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<Badge tone={invoiceStatusTone(invoice.status)}
										>{invoiceStatusLabel(invoice.status)}</Badge
									>
								</td>
								<td class="px-4 py-3">
									{#if invoice.status === 'unpaid'}
										<div class="flex items-center justify-end gap-1">
											<Button
												size="sm"
												variant="ghost"
												onclick={() => (payingId = payingId === invoice.id ? null : invoice.id)}
											>
												<Icon icon={Coins01Icon} class="size-4" />
												Pay
											</Button>
											<form
												method="POST"
												action="?/waive"
												use:enhance={() => {
													acting = invoice.id;
													return async ({ result }) => {
														acting = null;
														if (result.type !== 'success') return applyAction(result);
														const changed = result.data?.changedInvoice as Invoice | undefined;
														if (changed) {
															invoices = replaceRow(invoices, invoiceKey, invoice.id, changed);
															toast.success('The invoice has been waived.');
														}
													};
												}}
											>
												<input type="hidden" name="id" value={invoice.id} />
												<Button
													type="submit"
													size="sm"
													variant="ghost"
													loading={acting === invoice.id}
													disabled={acting === invoice.id}
													aria-label="Waive invoice"
												>
													<Icon icon={CheckmarkCircle02Icon} class="size-4" />
												</Button>
											</form>
											<form
												method="POST"
												action="?/cancel"
												use:enhance={() => {
													acting = invoice.id;
													return async ({ result }) => {
														acting = null;
														if (result.type !== 'success') return applyAction(result);
														const changed = result.data?.changedInvoice as Invoice | undefined;
														if (changed) {
															invoices = replaceRow(invoices, invoiceKey, invoice.id, changed);
															toast.success('The invoice has been cancelled.');
														}
													};
												}}
											>
												<input type="hidden" name="id" value={invoice.id} />
												<Button
													type="submit"
													size="sm"
													variant="ghost"
													loading={acting === invoice.id}
													disabled={acting === invoice.id}
													aria-label="Cancel invoice"
												>
													<Icon icon={RemoveCircleIcon} class="size-4" />
												</Button>
											</form>
										</div>
									{:else if invoice.due_date}
										<span class="block text-right text-xs text-muted">Due {invoice.due_date}</span>
									{/if}
								</td>
							</tr>

							{#if payingId === invoice.id}
								<tr class="border-b border-border bg-surface-sunken/40">
									<td colspan="5" class="px-4 py-4">
										<form
											method="POST"
											action="?/pay"
											class="flex flex-wrap items-end gap-3"
											use:enhance={validated(
												payInvoiceSchema,
												(next) => (payErrors = next),
												() => {
													paying = true;
													return async ({ result, update }) => {
														await update({ invalidateAll: false });
														paying = false;
														if (result.type !== 'success') return;
														const paid = result.data?.paidInvoice as Invoice | undefined;
														if (paid) {
															invoices = replaceRow(invoices, invoiceKey, invoice.id, paid);
															payingId = null;
															toast.success('The payment has been recorded.');
														}
													};
												}
											)}
										>
											<input type="hidden" name="id" value={invoice.id} />
											<div class="w-32">
												<Field
													id="pay-amount-{invoice.id}"
													label="Amount (৳)"
													error={payErrors.amount}
												>
													{#snippet children({ id, describedBy, invalid })}
														<Input
															{id}
															{invalid}
															name="amount"
															inputmode="decimal"
															value={remainingMajor(invoice)}
															aria-describedby={describedBy}
															{...FEE_LIMITS.amount}
														/>
													{/snippet}
												</Field>
											</div>
											<div class="w-40">
												<Field id="pay-method-{invoice.id}" label="Method" error={payErrors.method}>
													{#snippet children({ id, describedBy, invalid })}
														<Input
															{id}
															{invalid}
															name="method"
															placeholder="Cash, bKash…"
															aria-describedby={describedBy}
															{...FEE_LIMITS.method}
														/>
													{/snippet}
												</Field>
											</div>
											<Button type="submit" size="sm" loading={paying} disabled={paying}>
												<Icon icon={Coins01Icon} class="size-4" />
												Record payment
											</Button>
										</form>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			{#if canLoadMore(invoices)}
				<form
					method="POST"
					action="?/more"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingMore = true;
						return async ({ result }) => {
							loadingMore = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.more as Paged<Invoice> | undefined;
							if (next) invoices = appendPage(invoices, next, invoiceKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={invoices.cursor} />
					<input type="hidden" name="status" value={data.status} />
					<input type="hidden" name="student" value={data.studentId} />
					<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more invoices
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</section>
