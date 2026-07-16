<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Page, PageHeader, Card, Badge, EmptyState } from '$lib/components';
	import { formatMoney } from '$lib/money';
	import { statusLabel, statusTone, type AttendanceStatus } from '$lib/attendance';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const selected = $derived(data.children.find((c) => c.id === data.selectedId) ?? null);
	const outstanding = $derived(Object.entries(data.ledger?.outstanding ?? {}));

	function pick(id: string) {
		goto(`${resolve('/portal')}?child=${id}`, { keepFocus: true, noScroll: true });
	}
</script>

<Page>
	<PageHeader
		title="Family portal"
		description="Your child's day at school — attendance, fees, and memorisation."
	/>

	{#if data.children.length === 0}
		<EmptyState
			title="No student linked yet"
			description="Your account is not yet tied to a student. Ask the school office to connect you."
		/>
	{:else}
		{#if data.children.length > 1}
			<div class="mb-6 flex flex-wrap gap-2">
				{#each data.children as child (child.id)}
					<button
						type="button"
						onclick={() => pick(child.id)}
						aria-current={child.id === data.selectedId ? 'true' : undefined}
						class={[
							'rounded-pill border px-4 py-2 text-sm font-medium transition-colors',
							child.id === data.selectedId
								? 'border-transparent bg-surface-active text-text'
								: 'border-border text-muted hover:bg-surface-hover hover:text-text'
						]}
					>
						{child.full_name}
					</button>
				{/each}
			</div>
		{/if}

		{#if selected}
			<div class="mb-6">
				<h2 class="text-xl font-semibold">{selected.full_name}</h2>
				<p class="text-sm text-muted">Admission no. {selected.admission_no}</p>
			</div>

			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Attendance -->
				<Card>
					<h3 class="mb-1 text-sm font-medium">Attendance</h3>
					<p class="mb-4 text-xs text-muted">The last 30 days.</p>
					{#if data.attendance}
						{@const s = data.attendance.summary}
						<div class="grid grid-cols-5 gap-2 text-center">
							{#each [['Present', s.present], ['Absent', s.absent], ['Late', s.late], ['Excused', s.excused], ['Total', s.total]] as [label, n] (label)}
								<div class="rounded-control bg-surface-sunken px-2 py-3">
									<div class="font-mono text-lg font-semibold">{n}</div>
									<div class="text-[0.65rem] tracking-wide text-muted uppercase">{label}</div>
								</div>
							{/each}
						</div>
						{#if (data.attendance.days ?? []).length > 0}
							<ul class="mt-4 space-y-1.5">
								{#each (data.attendance.days ?? []).slice(0, 8) as day (day.on_date)}
									<li class="flex items-center justify-between text-sm">
										<span class="text-muted">{day.on_date}</span>
										<Badge tone={statusTone(day.status as AttendanceStatus)}>
											{statusLabel(day.status as AttendanceStatus)}
										</Badge>
									</li>
								{/each}
							</ul>
						{/if}
					{:else}
						<p class="text-sm text-muted">No attendance recorded.</p>
					{/if}
				</Card>

				<!-- Fees -->
				<Card>
					<h3 class="mb-1 text-sm font-medium">Fees</h3>
					<p class="mb-4 text-xs text-muted">What is due, and what has been paid.</p>
					{#if outstanding.length > 0}
						<div class="mb-4">
							<div class="text-xs tracking-wide text-muted uppercase">Outstanding</div>
							{#each outstanding as [currency, amountMinor] (currency)}
								<div class="font-mono text-2xl font-semibold">
									{formatMoney({ amount_minor: amountMinor, currency })}
								</div>
							{/each}
						</div>
					{:else}
						<p class="mb-4 text-sm text-success">Nothing outstanding.</p>
					{/if}
					{#if data.ledger && (data.ledger.invoices ?? []).length > 0}
						<ul class="space-y-1.5">
							{#each (data.ledger.invoices ?? []).slice(0, 8) as inv (inv.id)}
								<li class="flex items-center justify-between text-sm">
									<span class="truncate text-muted">{inv.title}</span>
									<span class="flex items-center gap-2">
										<span class="font-mono">
											{formatMoney({ amount_minor: inv.amount, currency: inv.currency })}
										</span>
										<Badge tone={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status}</Badge>
									</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-muted">No invoices.</p>
					{/if}
				</Card>

				<!-- Hifz -->
				<Card>
					<h3 class="mb-1 text-sm font-medium">Hifz</h3>
					<p class="mb-4 text-xs text-muted">Quran memorisation, last 30 days.</p>
					{#if data.hifz?.current_sabaq}
						{@const c = data.hifz.current_sabaq}
						<div class="mb-4 rounded-control bg-surface-sunken px-3 py-3">
							<div class="text-xs tracking-wide text-muted uppercase">Current Sabaq</div>
							<div class="font-medium">{c.surah} · Ayah {c.ayah_from}–{c.ayah_to}</div>
						</div>
					{/if}
					{#if data.hifz && Object.keys(data.hifz.counts).length > 0}
						<div class="flex flex-wrap gap-2">
							{#each Object.entries(data.hifz.counts) as [kind, n] (kind)}
								<Badge tone="neutral">{kind}: {n}</Badge>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted">No recitation logged.</p>
					{/if}
				</Card>
			</div>
		{/if}
	{/if}
</Page>
