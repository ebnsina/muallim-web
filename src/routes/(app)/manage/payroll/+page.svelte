<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		ArrowDown01Icon,
		Cancel01Icon,
		CheckmarkCircle02Icon,
		Coins01Icon,
		Invoice01Icon,
		MoneyBag01Icon,
		MoneySend01Icon,
		UserGroupIcon,
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
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import { formatMoney } from '$lib/money';
	import { appendPage, canLoadMore, replaceRow, type Paged } from '$lib/paging';
	import {
		PAYROLL_LIMITS,
		PAYSLIP_STATUSES,
		generateBatchSchema,
		payPayslipSchema,
		payslipStatusLabel,
		payslipStatusTone,
		setSalarySchema,
		type Payslip,
		type SalaryStructure
	} from '$lib/payroll';
	import type { Staff } from '$lib/staff';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const payslipKey = (slip: Payslip) => slip.id;

	// The rows on screen, seeded by the server and mutated in place as payslips are
	// generated and paid.
	let payslips = $derived(data.payslips as Paged<Payslip>);
	let salary = $derived(data.salary as SalaryStructure | null);

	const staff = $derived(data.staff as Staff[]);
	const staffMap = $derived(new Map(staff.map((s) => [s.id, s.full_name])));
	const staffName = (id: string) => staffMap.get(id) ?? 'Unknown member';

	// Per-form field errors, kept apart so one form's mistake does not light another.
	let salaryErrors = $state<FieldErrors>({});
	let generateErrors = $state<FieldErrors>({});
	let payErrors = $state<FieldErrors>({});

	let generateOpen = $state(false);
	let generating = $state(false);
	let savingSalary = $state(false);
	let loadingMore = $state(false);

	// Which draft is being paid — one inline form open at a time.
	let payingId = $state<string | null>(null);
	let paying = $state(false);

	// The salary form's live figures, so net updates as an admin types. Seeded from the
	// stored structure in major units, or blank when there is none yet.
	const asMajor = (minor: number | undefined) => (minor === undefined ? '' : String(minor / 100));
	let basicInput = $state('');
	let allowancesInput = $state('');
	let deductionsInput = $state('');

	// Reseed the boxes whenever the member in focus — and so their structure — changes.
	$effect(() => {
		basicInput = asMajor(salary?.basic_amount);
		allowancesInput = asMajor(salary?.allowances_amount);
		deductionsInput = asMajor(salary?.deductions_amount);
	});

	const num = (raw: string) => {
		const n = Number(raw);
		return Number.isFinite(n) ? n : 0;
	};
	const previewNetMinor = $derived(
		Math.round((num(basicInput) + num(allowancesInput) - num(deductionsInput)) * 100)
	);

	const salaryCurrency = $derived(salary?.currency ?? 'BDT');
</script>

<svelte:head><title>Payroll — Muallim</title></svelte:head>

<PageHeader
	title="Payroll"
	description="What this school pays each member, and the payslips it runs a month at a time."
>
	{#snippet actions()}
		<Button onclick={() => (generateOpen = !generateOpen)}>
			<Icon icon={generateOpen ? Cancel01Icon : MoneyBag01Icon} class="size-4" />
			{generateOpen ? 'Close' : 'Generate payslips'}
		</Button>
	{/snippet}
</PageHeader>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- ------------------------------------------------------- generate payslips -->
{#if generateOpen}
	<form
		method="POST"
		action="?/generate"
		class="mt-6"
		use:enhance={validated(
			generateBatchSchema,
			(next) => (generateErrors = next),
			() => {
				generating = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: true });
					generating = false;
					if (result.type !== 'success') return;

					const count = result.data?.generated as number | undefined;
					if (count !== undefined) {
						generateOpen = false;
						toast.success(
							count === 0
								? 'Nobody new to pay — those payslips were already generated.'
								: `Generated ${count} ${count === 1 ? 'payslip' : 'payslips'}.`
						);
					}
				};
			}
		)}
	>
		<Sheet open={generateOpen} onClose={() => (generateOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">Generate payslips</h2>
				<p class="mt-0.5 text-sm text-muted">
					One month at a time. Name a member, or leave it for the whole workspace. Re-running a
					month pays nobody twice — a member with no salary set is refused.
				</p>
			{/snippet}

			<div class="grid gap-5 sm:grid-cols-2">
				<Field id="gen-period" label="Period" error={generateErrors.period}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="period"
							aria-describedby={describedBy}
							{...PAYROLL_LIMITS.period}
						/>
					{/snippet}
				</Field>

				<Field id="gen-staff" label="Staff member" error={generateErrors.staff_id}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="staff_id"
							value={data.staffId}
							aria-describedby={describedBy}
						>
							<option value="">Everyone</option>
							{#each staff as s (s.id)}
								<option value={s.id}>{s.full_name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={generating} disabled={generating}>
					<Icon icon={MoneySend01Icon} class="size-4" />
					Generate payslips
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- --------------------------------------------------------------- salary -->
<section class="mt-10">
	<h2 class="text-lg font-semibold">Salary</h2>
	<p class="mt-1 text-sm text-muted">
		The basic pay, allowances and deductions each member is paid by. Amounts are in taka.
	</p>

	<form method="GET" class="mt-4 flex flex-wrap items-end gap-3">
		<div class="w-full max-w-xs">
			<Field id="salary-staff" label="Staff member">
				{#snippet children({ id })}
					<Select
						{id}
						name="staff"
						value={data.staffId}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
					>
						<option value="">Choose a member…</option>
						{#each staff as s (s.id)}
							<option value={s.id}>{s.full_name}</option>
						{/each}
					</Select>
				{/snippet}
			</Field>
		</div>
		<noscript><Button type="submit" variant="secondary">Show</Button></noscript>
	</form>

	{#if !data.staffId}
		<div class="mt-4">
			<EmptyState
				icon={UserGroupIcon}
				title="Pick a member"
				description="Choose a staff member above to view or set their salary."
			/>
		</div>
	{:else}
		<form
			method="POST"
			action="?/setSalary"
			class="mt-4"
			use:enhance={validated(
				setSalarySchema,
				(next) => (salaryErrors = next),
				() => {
					savingSalary = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						savingSalary = false;
						if (result.type !== 'success') return;

						const saved = result.data?.savedSalary as SalaryStructure | undefined;
						if (saved) {
							salary = saved;
							toast.success(`${staffName(data.staffId)}’s salary has been saved.`);
						}
					};
				}
			)}
		>
			<Sheet>
				{#snippet header()}
					<div class="flex items-center gap-2.5">
						<Icon icon={Wallet01Icon} class="size-4 text-muted" />
						<h3 class="font-medium">{staffName(data.staffId)}’s salary</h3>
					</div>
					<p class="mt-0.5 text-sm text-muted">
						{salary
							? 'Setting it again replaces the current structure in place.'
							: 'No salary set yet. Fill it in and it becomes the structure payslips are run from.'}
					</p>
				{/snippet}

				<input type="hidden" name="staff_id" value={data.staffId} />

				<div class="grid gap-5 sm:grid-cols-2">
					<Field id="basic_amount" label="Basic (৳)" error={salaryErrors.basic_amount}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="basic_amount"
								inputmode="decimal"
								placeholder="30000"
								bind:value={basicInput}
								aria-describedby={describedBy}
								{...PAYROLL_LIMITS.amount}
							/>
						{/snippet}
					</Field>

					<Field id="currency" label="Currency" error={salaryErrors.currency}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="currency"
								value={salaryCurrency}
								aria-describedby={describedBy}
								{...PAYROLL_LIMITS.currency}
							/>
						{/snippet}
					</Field>

					<Field
						id="allowances_amount"
						label="Allowances (৳)"
						error={salaryErrors.allowances_amount}
					>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="allowances_amount"
								inputmode="decimal"
								placeholder="0"
								bind:value={allowancesInput}
								aria-describedby={describedBy}
								{...PAYROLL_LIMITS.optionalAmount}
							/>
						{/snippet}
					</Field>

					<Field
						id="deductions_amount"
						label="Deductions (৳)"
						error={salaryErrors.deductions_amount}
					>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="deductions_amount"
								inputmode="decimal"
								placeholder="0"
								bind:value={deductionsInput}
								aria-describedby={describedBy}
								{...PAYROLL_LIMITS.optionalAmount}
							/>
						{/snippet}
					</Field>

					<Field id="effective_from" label="Effective from" error={salaryErrors.effective_from}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="effective_from"
								value={salary?.effective_from ?? ''}
								aria-describedby={describedBy}
								{...PAYROLL_LIMITS.effectiveFrom}
							/>
						{/snippet}
					</Field>
				</div>

				<div class="mt-5 rounded-card border border-border bg-surface-sunken/50 px-4 py-3">
					<p class="text-sm text-muted">Net pay</p>
					<p class="numeral mt-0.5 text-2xl font-semibold tracking-tight">
						{formatMoney({ amount_minor: previewNetMinor, currency: salaryCurrency })}
					</p>
					<p class="mt-1 text-xs text-muted">Basic plus allowances, less deductions.</p>
				</div>

				{#snippet footer()}
					<Button type="submit" loading={savingSalary} disabled={savingSalary}>
						<Icon icon={Wallet01Icon} class="size-4" />
						{salary ? 'Update salary' : 'Set salary'}
					</Button>
				{/snippet}
			</Sheet>
		</form>
	{/if}
</section>

<!-- --------------------------------------------------------------- payslips -->
<section class="mt-10">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h2 class="text-lg font-semibold">Payslips</h2>
			<p class="mt-1 text-sm text-muted">Every payslip run, and how to mark it paid.</p>
		</div>

		<form method="GET" class="flex flex-wrap items-end gap-3">
			<div class="w-44">
				<Field id="staff-filter" label="Staff member">
					{#snippet children({ id })}
						<Select
							{id}
							name="staff"
							value={data.staffId}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">All staff</option>
							{#each staff as s (s.id)}
								<option value={s.id}>{s.full_name}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<div class="w-32">
				<Field id="period-filter" label="Period">
					{#snippet children({ id })}
						<Input {id} name="period" value={data.period} placeholder="2026-07" maxlength={7} />
					{/snippet}
				</Field>
			</div>
			<div class="w-36">
				<Field id="status-filter" label="Status">
					{#snippet children({ id })}
						<Select
							{id}
							name="status"
							value={data.status}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="">Any status</option>
							{#each PAYSLIP_STATUSES as s (s)}
								<option value={s}>{payslipStatusLabel(s)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<Button type="submit" variant="secondary">Apply</Button>
		</form>
	</div>

	<div class="mt-4">
		{#if data.payslipsError && payslips.rows.length === 0}
			<Alert tone="warning" role="alert">{data.payslipsError}</Alert>
		{:else if payslips.rows.length === 0}
			<EmptyState
				icon={Invoice01Icon}
				title="No payslips"
				description={data.status || data.staffId || data.period
					? 'Nothing matches this filter. Try another member, period or status.'
					: 'Generate payslips for a period above and they will appear here.'}
			/>
		{:else}
			<div class="overflow-x-auto rounded-card bg-surface-raised shadow-card">
				<table class="w-full border-collapse text-sm">
					<caption class="sr-only"
						>Every payslip: the member, the period, gross, deductions, net, and its status.</caption
					>
					<thead>
						<tr class="border-b border-border bg-surface-sunken text-left">
							<th scope="col" class="px-4 py-3 font-medium">Member</th>
							<th scope="col" class="px-4 py-3 font-medium">Period</th>
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Gross</th>
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Deductions</th>
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Net</th>
							<th scope="col" class="px-4 py-3 font-medium">Status</th>
							<th scope="col" class="px-4 py-3 font-medium"><span class="sr-only">Actions</span></th
							>
						</tr>
					</thead>
					<tbody>
						{#each payslips.rows as slip (slip.id)}
							<tr class="border-b border-border last:border-0">
								<td class="px-4 py-3 font-medium">{staffName(slip.staff_id)}</td>
								<td class="numeral px-4 py-3 text-muted">{slip.period}</td>
								<td class="numeral px-4 py-3 whitespace-nowrap">
									{formatMoney({ amount_minor: slip.gross_amount, currency: slip.currency })}
								</td>
								<td class="numeral px-4 py-3 whitespace-nowrap text-muted">
									{formatMoney({ amount_minor: slip.deductions_amount, currency: slip.currency })}
								</td>
								<td class="numeral px-4 py-3 font-medium whitespace-nowrap">
									{formatMoney({ amount_minor: slip.net_amount, currency: slip.currency })}
								</td>
								<td class="px-4 py-3">
									<Badge tone={payslipStatusTone(slip.status)}
										>{payslipStatusLabel(slip.status)}</Badge
									>
								</td>
								<td class="px-4 py-3">
									{#if slip.status === 'draft'}
										<div class="flex items-center justify-end">
											<Button
												size="sm"
												variant="ghost"
												onclick={() => (payingId = payingId === slip.id ? null : slip.id)}
											>
												<Icon icon={Coins01Icon} class="size-4" />
												Mark paid
											</Button>
										</div>
									{:else if slip.paid_at}
										<span class="block text-right text-xs text-muted"
											>Paid{slip.method ? ` · ${slip.method}` : ''}</span
										>
									{/if}
								</td>
							</tr>

							{#if payingId === slip.id}
								<tr class="border-b border-border bg-surface-sunken/40">
									<td colspan="7" class="px-4 py-4">
										<form
											method="POST"
											action="?/pay"
											class="flex flex-wrap items-end gap-3"
											use:enhance={validated(
												payPayslipSchema,
												(next) => (payErrors = next),
												() => {
													paying = true;
													return async ({ result, update }) => {
														await update({ invalidateAll: false });
														paying = false;
														if (result.type !== 'success') return;
														const paid = result.data?.paidPayslip as Payslip | undefined;
														if (paid) {
															payslips = replaceRow(payslips, payslipKey, slip.id, paid);
															payingId = null;
															toast.success('The payslip has been marked paid.');
														}
													};
												}
											)}
										>
											<input type="hidden" name="id" value={slip.id} />
											<div class="w-48">
												<Field id="pay-method-{slip.id}" label="Method" error={payErrors.method}>
													{#snippet children({ id, describedBy, invalid })}
														<Input
															{id}
															{invalid}
															name="method"
															placeholder="Bank transfer, bKash…"
															aria-describedby={describedBy}
															{...PAYROLL_LIMITS.method}
														/>
													{/snippet}
												</Field>
											</div>
											<Button type="submit" size="sm" loading={paying} disabled={paying}>
												<Icon icon={CheckmarkCircle02Icon} class="size-4" />
												Mark paid
											</Button>
										</form>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			{#if canLoadMore(payslips)}
				<form
					method="POST"
					action="?/more"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingMore = true;
						return async ({ result }) => {
							loadingMore = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.more as Paged<Payslip> | undefined;
							if (next) payslips = appendPage(payslips, next, payslipKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={payslips.cursor} />
					<input type="hidden" name="status" value={data.status} />
					<input type="hidden" name="staff" value={data.staffId} />
					<input type="hidden" name="period" value={data.period} />
					<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more payslips
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</section>
