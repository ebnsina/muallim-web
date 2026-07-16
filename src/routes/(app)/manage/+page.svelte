<script lang="ts">
	import {
		BookOpen01Icon,
		Coins01Icon,
		Megaphone01Icon,
		School01Icon,
		TaskDaily01Icon,
		UserGroupIcon,
		UserMultiple02Icon
	} from '@hugeicons/core-free-icons';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import { Card, Icon, Numeral, PageHeader } from '$lib/components';
	import { formatMoney } from '$lib/money';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const o = $derived(data.overview);

	// The headline counts. Each is a number the school could count for itself — no
	// invented score sits among them.
	const stats = $derived([
		{ label: 'Active students', value: o.students, icon: UserMultiple02Icon, tone: 'accent' },
		{ label: 'Staff', value: o.staff, icon: UserGroupIcon, tone: 'neutral' },
		{ label: 'Classes', value: o.classes, icon: School01Icon, tone: 'neutral' },
		{ label: 'Subjects', value: o.subjects, icon: BookOpen01Icon, tone: 'neutral' }
	] as const);

	const att = $derived(o.attendance_today);

	// Present / absent / late / excused, marked so the eye lands on today's absences.
	const attendance = $derived([
		{ label: 'Present', value: att.present, tone: 'success' },
		{ label: 'Absent', value: att.absent, tone: 'danger' },
		{ label: 'Late', value: att.late, tone: 'warning' },
		{ label: 'Excused', value: att.excused, tone: 'neutral' }
	] as const);

	/*
		Outstanding fees, one line per currency muallim-api reports — the map is
		currency → minor units, so each is formatted through `Intl` with the taka sign
		for BDT. A workspace with nothing owed gets an honest ৳0, not a blank.
	*/
	const owed = $derived(Object.entries(o.outstanding_fees));

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
</script>

<svelte:head><title>Institution — Muallim</title></svelte:head>

<PageHeader
	title="Institution"
	description="Where your school stands today: who is enrolled, who is in, and what is owed."
/>

{#snippet stat(label: string, value: number, icon: IconSvgElement, tone: string)}
	<Card class="p-5">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="text-sm text-muted">{label}</p>
				<p class="mt-2 text-3xl font-semibold tracking-tight">
					<Numeral {value} />
				</p>
			</div>
			<span
				class={['flex size-9 shrink-0 items-center justify-center rounded-control', TILE[tone]]}
			>
				<Icon {icon} class="size-5" />
			</span>
		</div>
	</Card>
{/snippet}

<section class="mt-8">
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each stats as s (s.label)}
			{@render stat(s.label, s.value, s.icon, s.tone)}
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
				<Numeral value={att.total} /> marked
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

		{#if att.total === 0}
			<p class="mt-4 text-sm text-muted">No attendance has been taken today.</p>
		{/if}
	</Card>

	<!-- Outstanding fees + notices -->
	<div class="grid gap-4">
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

		<Card class="p-5">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<Icon icon={Megaphone01Icon} class="size-4 text-muted" />
					<h2 class="text-sm font-medium">Notices</h2>
				</div>
				<p class="text-2xl font-semibold tracking-tight">
					<Numeral value={o.notices} />
				</p>
			</div>
		</Card>
	</div>
</section>
