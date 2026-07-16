<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowLeft01Icon, Award01Icon, PrinterIcon } from '@hugeicons/core-free-icons';
	import { Badge, Button, Icon } from '$lib/components';
	import { formatGpa, formatPercent, passTone } from '$lib/exams';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const card = $derived(data.reportCard);
	const subjects = $derived(card.subjects ?? []);
	const studentName = $derived(data.student?.full_name ?? 'Student');
</script>

<svelte:head><title>Report card — {studentName} — Muallim</title></svelte:head>

<div class="no-print">
	<a
		href={resolve(`/manage/exams/${data.exam?.id ?? ''}`)}
		class="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
	>
		<Icon icon={ArrowLeft01Icon} class="size-4" />
		Back to exam
	</a>
</div>

<article
	class="report-card mt-4 rounded-card border border-border bg-surface-raised p-6 shadow-card sm:p-8"
>
	<header class="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
		<div class="min-w-0">
			<div class="flex items-center gap-2 text-muted">
				<Icon icon={Award01Icon} class="size-5" />
				<span class="text-sm font-medium">Report card</span>
			</div>
			<h1 class="mt-2 text-2xl font-semibold tracking-tight">{studentName}</h1>
			<p class="mt-1 text-sm text-muted">
				{#if data.student}<span class="numeral">Admission no. {data.student.admission_no}</span
					>{/if}
				{#if data.exam}<span class="ml-2">· {data.exam.name}</span>{/if}
			</p>
		</div>
		<div class="no-print">
			<Button variant="secondary" size="sm" onclick={() => window.print()}>
				<Icon icon={PrinterIcon} class="size-4" />
				Print
			</Button>
		</div>
	</header>

	<div class="mt-6 overflow-x-auto">
		<table class="w-full border-collapse text-sm">
			<caption class="sr-only"
				>Marks by subject, with percent, letter grade, and grade point.</caption
			>
			<thead>
				<tr class="border-b border-border text-left">
					<th scope="col" class="py-2 pr-4 font-medium">Subject</th>
					<th scope="col" class="py-2 pr-4 text-right font-medium">Marks</th>
					<th scope="col" class="py-2 pr-4 text-right font-medium">Percent</th>
					<th scope="col" class="py-2 pr-4 font-medium">Grade</th>
					<th scope="col" class="py-2 pr-4 text-right font-medium">Point</th>
					<th scope="col" class="py-2 font-medium">Result</th>
				</tr>
			</thead>
			<tbody>
				{#each subjects as subject (subject.subject_id)}
					<tr class="border-b border-border last:border-0">
						<th scope="row" class="py-2.5 pr-4 text-left font-medium">{subject.subject_name}</th>
						<td class="numeral py-2.5 pr-4 text-right">
							{subject.obtained} / {subject.full_marks}
						</td>
						<td class="numeral py-2.5 pr-4 text-right">{formatPercent(subject.percent)}</td>
						<td class="py-2.5 pr-4 font-semibold">{subject.letter}</td>
						<td class="numeral py-2.5 pr-4 text-right">{subject.gpa_point.toFixed(2)}</td>
						<td class="py-2.5">
							<Badge tone={passTone(subject.is_pass)}>{subject.is_pass ? 'Pass' : 'Fail'}</Badge>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- ------------------------------------------------------------------ totals -->
	<dl class="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-control bg-surface-sunken px-4 py-3">
			<dt class="text-xs text-muted">Total marks</dt>
			<dd class="numeral mt-1 text-2xl font-semibold tracking-tight">
				{card.total_obtained} / {card.total_full}
			</dd>
		</div>
		<div class="rounded-control bg-surface-sunken px-4 py-3">
			<dt class="text-xs text-muted">Average</dt>
			<dd class="numeral mt-1 text-2xl font-semibold tracking-tight">
				{formatPercent(card.average_percent)}
			</dd>
		</div>
		<div class="rounded-control bg-surface-sunken px-4 py-3">
			<dt class="text-xs text-muted">GPA</dt>
			<dd class="mt-1 text-2xl font-semibold tracking-tight">
				<span class="numeral">{formatGpa(card.gpa)}</span>
				<span class="ml-1 text-lg text-muted">{card.overall_letter}</span>
			</dd>
		</div>
		<div class="rounded-control bg-surface-sunken px-4 py-3">
			<dt class="text-xs text-muted">Result</dt>
			<dd class="mt-2">
				<Badge tone={passTone(card.passed)}>{card.passed ? 'Passed' : 'Not passed'}</Badge>
			</dd>
		</div>
	</dl>
</article>

<style>
	/* Print the card alone: the section rail and the page chrome are for the screen. */
	@media print {
		:global(nav[aria-label='Institution management']) {
			display: none;
		}
		.no-print {
			display: none !important;
		}
		.report-card {
			border: none;
			box-shadow: none;
			padding: 0;
		}
	}
</style>
