<script lang="ts">
	import { resolve } from '$app/paths';
	import { Task01Icon } from '@hugeicons/core-free-icons';
	import {
		Badge,
		Breadcrumbs,
		Card,
		EmptyState,
		LessonIcon,
		Numeral,
		Page,
		PageHeader,
		Progress,
		Row
	} from '$lib/components';
	import { bandTone, marksByItem, percentOf, UNMARKED } from '$lib/grades';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const marks = $derived(marksByItem(data.entries));
	const result = $derived(data.result);
	const graded = $derived(result.graded > 0);

	const crumbs = $derived([
		{ label: 'Courses', href: resolve('/courses') },
		{ label: data.course.title, href: resolve(`/courses/${data.slug}`) },
		{ label: 'Grades' }
	]);
</script>

<svelte:head><title>Grades — {data.course.title}</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<!--
		The built-in scale is called "Default", which reads as a placeholder rather
		than a name. Name it as what it is.
	-->
	<PageHeader
		class="mt-4"
		title="Your grades"
		description={data.scale.builtin
			? 'Marked on the default scale.'
			: `Marked on the ${data.scale.name} scale.`}
	/>

	{#if data.items.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Task01Icon}
				title="Nothing to grade yet"
				description="This course has no quizzes or assignments."
			/>
		</div>
	{:else}
		<!--
			The number, and what it is a number of.

			A percentage over the work that has been marked, not over the work that
			exists. A learner who has done the first of ten assessments perfectly is at
			100% of what they have handed in, and `graded of item_count` is what stops
			that reading as "you have finished the course".
		-->
		<Card float class="mt-8 p-6">
			{#if graded}
				<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
					<div class="flex items-baseline gap-3">
						<!-- The one figure this page is about, so it rolls up into place. -->
						<Numeral
							countUp
							value={result.percent}
							suffix="%"
							class="text-3xl font-semibold"
							label="{result.percent} percent"
						/>
						{#if result.band}
							<Badge tone={bandTone(result.band)}>{result.band.label}</Badge>
						{/if}
					</div>

					<p class="text-muted text-sm">
						<span class="numeral">{result.points}</span>
						of
						<span class="numeral">{result.max_points}</span> points
					</p>
				</div>

				<div class="mt-4">
					<Progress
						value={result.percent}
						label="Your grade so far"
						tone={result.band?.is_pass ? 'success' : 'accent'}
					/>
				</div>

				<!--
					"1 of 1 assessment that have been marked" is what a sentence assembled out
					of a ternary sounds like. The two shapes are written out instead.
				-->
				<p class="text-muted mt-3 text-sm">
					{#if result.graded === result.item_count}
						Across {result.item_count === 1
							? 'the one assessment'
							: `all ${result.item_count} assessments`} in this course.
					{:else}
						Across the <span class="numeral">{result.graded}</span>
						of <span class="numeral">{result.item_count}</span> assessments marked so far.
					{/if}
				</p>
			{:else}
				<!--
					Nothing marked is not a zero, and not an F. The API sends no band at all,
					and the page says so rather than rendering a failing grade for work
					nobody has been asked to hand in.
				-->
				<p class="font-medium">Not graded yet</p>
				<p class="text-muted mt-1 text-sm">
					{#if result.item_count === 1}
						Your grade appears here once this course's one assessment has been marked.
					{:else}
						Your grade appears here once the first of
						<span class="numeral">{result.item_count}</span> assessments has been marked.
					{/if}
				</p>
			{/if}
		</Card>

		<h2 class="mt-10 text-sm font-medium tracking-wide uppercase">Assessments</h2>

		<!-- The marks stay plain numerals: forty figures rolling at once is a slot machine. -->
		<ul class="mt-4 space-y-2">
			{#each data.items as item (item.id)}
				{@const mark = marks.get(item.id)}
				<li>
					<Row float href={resolve(`/courses/${data.slug}/lessons/${item.lesson_id}`)} class="lift">
						<div class="flex min-w-0 items-center gap-3">
							<span class="text-muted shrink-0">
								<LessonIcon contentType={item.source} />
							</span>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{item.title}</p>
								<p class="text-muted text-xs capitalize">{item.source}</p>
							</div>
						</div>

						<div class="shrink-0 text-right text-sm">
							{#if mark}
								<p>
									<span class="numeral">{mark.points}</span>
									of
									<span class="numeral">{mark.max_points}</span>
								</p>
								<p class="text-muted text-xs">
									<span class="numeral">{percentOf(mark)}</span>%
								</p>
							{:else}
								<p class="text-muted" aria-label="Not marked">{UNMARKED}</p>
								<p class="text-muted numeral text-xs">out of {item.max_points}</p>
							{/if}
						</div>
					</Row>
				</li>
			{/each}
		</ul>
	{/if}
</Page>
