<script lang="ts">
	import { resolve } from '$app/paths';
	import { Calendar03Icon, Globe02Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
	import { Badge, Breadcrumbs, Difficulty, Icon, Stars } from '$lib/components';
	import type { Crumb } from '$lib/components/Breadcrumbs.svelte';
	import type { CourseDetail, ReviewSummary } from './types';

	type Props = {
		course: CourseDetail;
		crumbs: Crumb[];
		reviews: ReviewSummary;
	};

	let { course, crumbs, reviews }: Props = $props();

	const groupedNumber = new Intl.NumberFormat();
	const monthYear = new Intl.DateTimeFormat(undefined, { month: 'numeric', year: 'numeric' });

	const hasReviews = $derived(reviews.count > 0);

	// The reader's own locale names the language, so "ar" reads as Arabic to them
	// and as العربية to somebody else. An unknown tag falls back to the tag.
	const languageName = $derived.by(() => {
		try {
			return (
				new Intl.DisplayNames(undefined, { type: 'language' }).of(course.language) ??
				course.language
			);
		} catch {
			return course.language;
		}
	});
</script>

<!--
	The banner stands on the course's own light — the same aurora its card wears in
	the catalog, drawn from the same seed, so a course is one color wherever you
	meet it. Everything here is inverted ink: the page's grays were chosen against
	white paper and simply vanish on it.
-->
<Breadcrumbs {crumbs} tone="inverse" />

<div class="mt-5 flex flex-wrap items-center gap-2">
	{#if course.status !== 'published'}
		<Badge tone="warning">{course.status}</Badge>
	{/if}
	<Difficulty level={course.difficulty} tone="inverse" />
</div>

<h1 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
	{course.title}
</h1>

{#if course.summary}
	<p class="mt-4 max-w-2xl text-lg text-on-solid/85 text-pretty">
		{course.summary}
	</p>
{/if}

<div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
	{#if hasReviews}
		<a href="#reviews" class="flex items-center gap-2">
			<span class="numeral font-medium">{reviews.average.toFixed(1)}</span>
			<Stars value={reviews.average} size="sm" tone="inverse" />
			<span class="underline-grow text-on-solid/85">
				<span class="numeral">{groupedNumber.format(reviews.count)}</span>
				{reviews.count === 1 ? 'rating' : 'ratings'}
			</span>
		</a>
	{/if}

	{#if (course.learner_count ?? 0) > 0}
		<span class="flex items-center gap-1.5 text-on-solid/85">
			<Icon icon={UserGroupIcon} class="size-4" />
			<span class="numeral">{groupedNumber.format(course.learner_count ?? 0)}</span>
			{course.learner_count === 1 ? 'learner' : 'learners'}
		</span>
	{/if}
</div>

{#if course.instructor}
	<!-- The byline goes where the catalog's does: everything this person wrote. -->
	<p class="mt-4 text-sm text-on-solid/85">
		Created by
		{#if course.instructor_id}
			<a
				class="underline-grow font-medium text-on-solid"
				href="{resolve('/courses')}?author={course.instructor_id}"
			>
				{course.instructor}
			</a>
		{:else}
			<span class="font-medium text-on-solid">{course.instructor}</span>
		{/if}
	</p>
{/if}

<div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-solid/85">
	<span class="flex items-center gap-1.5">
		<Icon icon={Calendar03Icon} class="size-4" />
		Last updated
		<span class="numeral">{monthYear.format(new Date(course.updated_at))}</span>
	</span>
	<span class="flex items-center gap-1.5">
		<Icon icon={Globe02Icon} class="size-4" />
		{languageName}
	</span>
</div>
