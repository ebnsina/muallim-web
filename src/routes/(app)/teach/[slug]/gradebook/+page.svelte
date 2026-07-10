<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Task01Icon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		EmptyState,
		LessonIcon,
		Page,
		PageHeader,
		Select
	} from '$lib/components';
	import { bandTone, marksByItem, percentOf, UNMARKED } from '$lib/grades';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const crumbs = $derived([
		{ label: 'Teach', href: resolve('/teach') },
		{ label: data.course.title, href: resolve(`/teach/${data.slug}`) },
		{ label: 'Gradebook' }
	]);

	// One map per learner, built once. A `find` inside both loops of a
	// learners × items table is the client-side twin of the N+1 the API refuses.
	const rows = $derived(
		data.learners.map((learner) => ({
			...learner,
			marks: marksByItem(learner.entries ?? [])
		}))
	);

	// The empty option is the built-in default, which has no id.
	const current = $derived(data.scale.builtin ? '' : (data.scale.id ?? ''));
</script>

<svelte:head><title>Gradebook — {data.course.title}</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title="Gradebook" description="Everybody enrolled, marked or not." />

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{:else if form?.saved}
		<Alert tone="success" class="mt-6" role="status">Saved.</Alert>
	{/if}

	<!-- ------------------------------------------------------------- scale -->
	<Card class="mt-8 p-5">
		<form
			method="POST"
			action="?/setScale"
			use:enhance
			class="flex flex-wrap items-end gap-x-4 gap-y-3"
		>
			<div class="min-w-0 flex-1">
				<label for="scale_id" class="mb-1.5 block text-sm font-medium">Grading scale</label>
				<Select id="scale_id" name="scale_id" value={current}>
					{#each data.scales as scale (scale.id ?? 'builtin')}
						<option value={scale.id ?? ''}>
							{scale.name}{scale.builtin ? ' (built in)' : ''}
						</option>
					{/each}
				</Select>
			</div>

			<Button type="submit" variant="secondary">Apply</Button>
		</form>

		<!--
			The bands, so a marker can see what a percentage will be called before they
			commit the course to it. `is_pass` is the scale author's decision; the
			colour is read from it, never from the label.
		-->
		<div class="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
			{#each data.scale.bands ?? [] as band (band.label)}
				<Badge tone={bandTone(band)}>
					{band.label}
					<span class="numeral ml-1 opacity-70">{band.min_percent}%+</span>
				</Badge>
			{/each}
		</div>
	</Card>

	{#if data.learners.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Task01Icon}
				title="Nobody is enrolled"
				description="Learners appear here as soon as they enrol, marked or not."
			/>
		</div>
	{:else if data.items.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Task01Icon}
				title="Nothing to grade yet"
				description="Add a quiz or an assignment to a lesson, and its marks appear here."
			/>
		</div>
	{:else}
		<!--
			The table scrolls inside its own box. A course with a dozen assessments is
			wider than a phone, and a page that scrolls sideways as a whole takes its
			header and its navigation with it.

			The learner column is sticky, because a mark in the eighth column belongs to
			nobody if you have scrolled the name off the screen.
		-->
		<div class="mt-8 overflow-x-auto rounded-card border border-border">
			<table class="w-full min-w-max border-collapse text-sm">
				<caption class="sr-only">
					Every enrolled learner, their mark for each assessment, and their course grade.
				</caption>

				<thead>
					<tr class="border-b border-border bg-surface-sunken text-left">
						<th
							scope="col"
							class="sticky left-0 z-10 bg-surface-sunken px-4 py-3 font-medium whitespace-nowrap"
						>
							Learner
						</th>

						{#each data.items as item (item.id)}
							<th scope="col" class="px-4 py-3 font-medium">
								<span class="flex items-center gap-1.5 whitespace-nowrap">
									<span class="text-muted"><LessonIcon contentType={item.source} /></span>
									<span class="max-w-[16ch] truncate" title={item.title}>{item.title}</span>
								</span>
								<span class="text-muted numeral text-xs font-normal">
									out of {item.max_points}
								</span>
							</th>
						{/each}

						<th scope="col" class="px-4 py-3 text-right font-medium whitespace-nowrap">Grade</th>
					</tr>
				</thead>

				<tbody>
					{#each rows as row (row.user_id)}
						<tr class="border-b border-border last:border-0 hover:bg-surface-sunken">
							<th scope="row" class="sticky left-0 z-10 bg-surface px-4 py-3 text-left font-normal">
								<span class="block font-medium">{row.name}</span>
								<span class="text-muted block text-xs">{row.email}</span>
							</th>

							{#each data.items as item (item.id)}
								{@const mark = row.marks.get(item.id)}
								<td class="px-4 py-3">
									{#if mark}
										<span class="numeral">{mark.points}</span>
										<span class="text-muted numeral text-xs">
											({percentOf(mark)}%)
										</span>
									{:else}
										<!-- An em dash, not a zero: not marked is not nothing scored. -->
										<span class="text-muted" aria-label="Not marked">{UNMARKED}</span>
									{/if}
								</td>
							{/each}

							<td class="px-4 py-3 text-right whitespace-nowrap">
								{#if row.result.graded > 0}
									<span class="numeral font-medium">{row.result.percent}%</span>
									{#if row.result.band}
										<Badge tone={bandTone(row.result.band)} class="ml-2">
											{row.result.band.label}
										</Badge>
									{/if}
								{:else}
									<span class="text-muted text-xs">Nothing marked</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<p class="text-muted mt-4 text-xs">
			A grade covers the assessments that have been marked, not the ones nobody has attempted.
		</p>
	{/if}
</Page>
