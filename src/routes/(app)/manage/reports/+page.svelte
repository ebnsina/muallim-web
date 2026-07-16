<script lang="ts">
	import {
		BookOpen01Icon,
		Coins01Icon,
		PrinterIcon,
		School01Icon,
		TaskDaily01Icon,
		UserGroupIcon,
		UserMultiple02Icon,
		Wallet01Icon
	} from '@hugeicons/core-free-icons';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import { Badge, Button, Card, Icon, Numeral, PageHeader } from '$lib/components';
	import { formatMoney } from '$lib/money';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const o = $derived(data.overview);

	// The enrolment headline — each a number the school could count for itself.
	const stats = $derived(
		o
			? ([
					{ label: 'Active students', value: o.students, icon: UserMultiple02Icon, tone: 'accent' },
					{ label: 'Staff', value: o.staff, icon: UserGroupIcon, tone: 'neutral' },
					{ label: 'Classes', value: o.classes, icon: School01Icon, tone: 'neutral' },
					{ label: 'Subjects', value: o.subjects, icon: BookOpen01Icon, tone: 'neutral' }
				] as const)
			: []
	);

	// Present / absent / late / excused, marked so the eye lands on today's absences.
	const attendance = $derived(
		o
			? ([
					{ label: 'Present', value: o.attendance_today.present, tone: 'success' },
					{ label: 'Absent', value: o.attendance_today.absent, tone: 'danger' },
					{ label: 'Late', value: o.attendance_today.late, tone: 'warning' },
					{ label: 'Excused', value: o.attendance_today.excused, tone: 'neutral' }
				] as const)
			: []
	);

	// Outstanding fees, one line per currency the API reports — currency → minor units.
	const owed = $derived(o ? Object.entries(o.outstanding_fees) : []);

	// Income / expense / net per currency, or nothing to show.
	const totals = $derived(data.totals ?? []);

	const TILE: Record<string, string> = {
		accent: 'bg-accent-surface text-accent-text',
		success: 'bg-success-surface text-success-text',
		warning: 'bg-warning-surface text-warning-text',
		danger: 'bg-danger-surface text-danger-text',
		neutral: 'bg-surface-sunken text-muted'
	};

	const TEXT: Record<string, string> = {
		success: 'text-success-text',
		danger: 'text-danger-text',
		warning: 'text-warning-text',
		neutral: 'text-text'
	};

	function print() {
		window.print();
	}
</script>

<svelte:head><title>Institution report — Muallim</title></svelte:head>

<div class="report">
	<PageHeader
		title="Institution report"
		description="A printable snapshot of where your school stands."
	>
		{#snippet meta()}
			<Badge tone="neutral">Generated {data.generatedOn}</Badge>
		{/snippet}
		{#snippet actions()}
			<Button variant="secondary" onclick={print} class="no-print">
				<Icon icon={PrinterIcon} class="size-4" />
				Print / Save as PDF
			</Button>
		{/snippet}
	</PageHeader>

	{#if !o}
		<Card class="mt-8 p-5">
			<p class="text-sm text-muted">{data.overviewError ?? 'The report could not be loaded.'}</p>
		</Card>
	{:else}
		<!-- Enrolment snapshot -->
		<section class="mt-8">
			<h2 class="text-sm font-medium text-muted">Enrolment snapshot</h2>
			<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each stats as s (s.label)}
					<Card class="p-5">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-sm text-muted">{s.label}</p>
								<p class="mt-2 text-3xl font-semibold tracking-tight">
									<Numeral value={s.value} />
								</p>
							</div>
							<span
								class={[
									'flex size-9 shrink-0 items-center justify-center rounded-control',
									TILE[s.tone]
								]}
							>
								<Icon icon={s.icon as IconSvgElement} class="size-5" />
							</span>
						</div>
					</Card>
				{/each}
			</div>
		</section>

		<section class="mt-6 grid gap-4 lg:grid-cols-2">
			<!-- Today's attendance -->
			<Card class="p-5">
				<div class="flex items-center gap-2.5">
					<Icon icon={TaskDaily01Icon} class="size-4 text-muted" />
					<h2 class="text-sm font-medium">Today’s attendance</h2>
					<span class="ml-auto text-sm text-muted">
						<Numeral value={o.attendance_today.total} /> marked
					</span>
				</div>

				<dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
					{#each attendance as a (a.label)}
						<div class="rounded-control bg-surface-sunken px-3 py-3">
							<dd class={['text-2xl font-semibold tracking-tight', TEXT[a.tone]]}>
								<Numeral value={a.value} />
							</dd>
							<dt class="mt-0.5 text-xs text-muted">{a.label}</dt>
						</div>
					{/each}
				</dl>

				{#if o.attendance_today.total === 0}
					<p class="mt-4 text-sm text-muted">No attendance has been taken today.</p>
				{/if}
			</Card>

			<!-- Outstanding fees -->
			<Card class="p-5">
				<div class="flex items-center gap-2.5">
					<Icon icon={Coins01Icon} class="size-4 text-muted" />
					<h2 class="text-sm font-medium">Outstanding fees</h2>
				</div>

				{#if owed.length === 0}
					<p class="mt-3 text-2xl font-semibold tracking-tight">
						{formatMoney({ amount_minor: 0, currency: 'BDT' })}
					</p>
					<p class="mt-1 text-sm text-muted">Nothing is owed.</p>
				{:else}
					<ul class="mt-3 space-y-1.5">
						{#each owed as [currency, amountMinor] (currency)}
							<li class="text-2xl font-semibold tracking-tight">
								{formatMoney({ amount_minor: amountMinor, currency })}
							</li>
						{/each}
					</ul>
				{/if}
			</Card>
		</section>

		<!-- Finance summary -->
		<section class="mt-6">
			<Card class="p-5">
				<div class="flex items-center gap-2.5">
					<Icon icon={Wallet01Icon} class="size-4 text-muted" />
					<h2 class="text-sm font-medium">Finance summary</h2>
				</div>

				{#if totals.length === 0}
					<p class="mt-3 text-sm text-muted">
						{data.ledgerError ?? 'No ledger entries yet.'}
					</p>
				{:else}
					<div class="mt-4 space-y-4">
						{#each totals as t (t.currency)}
							<div class="grid gap-3 sm:grid-cols-3">
								<div class="rounded-control bg-surface-sunken px-3 py-3">
									<dd class={['text-2xl font-semibold tracking-tight', TEXT.success]}>
										{formatMoney({ amount_minor: t.income, currency: t.currency })}
									</dd>
									<dt class="mt-0.5 text-xs text-muted">Income</dt>
								</div>
								<div class="rounded-control bg-surface-sunken px-3 py-3">
									<dd class={['text-2xl font-semibold tracking-tight', TEXT.danger]}>
										{formatMoney({ amount_minor: t.expense, currency: t.currency })}
									</dd>
									<dt class="mt-0.5 text-xs text-muted">Expense</dt>
								</div>
								<div class="rounded-control bg-surface-sunken px-3 py-3">
									<dd
										class={[
											'text-2xl font-semibold tracking-tight',
											t.net < 0 ? TEXT.danger : TEXT.neutral
										]}
									>
										{formatMoney({ amount_minor: t.net, currency: t.currency })}
									</dd>
									<dt class="mt-0.5 text-xs text-muted">Net ({t.currency})</dt>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		</section>
	{/if}
</div>

<!--
	The report prints on paper the school hands to a board or a parent, so print strips
	the app to the report: the global shell (sidebar, header) lives outside this
	component, so the page hides its own chrome — the Print button — and flattens every
	card to plain ink on white, no shadow or sunken fill that a printer renders as gray.
-->
<style>
	@media print {
		:global(body) {
			background: #fff;
		}

		.no-print {
			display: none !important;
		}

		.report :global(.rounded-card),
		.report :global(.rounded-control) {
			background: #fff !important;
			box-shadow: none !important;
			border-color: #d4d4d4 !important;
		}
	}
</style>
