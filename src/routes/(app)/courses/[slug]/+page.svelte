<script lang="ts">
	import { resolve } from '$app/paths';
	import { Alert02Icon } from '@hugeicons/core-free-icons';
	import { Alert, Icon, Page } from '$lib/components';
	import {
		CourseAnnouncements,
		CourseBanner,
		CourseCurriculum,
		CourseDescription,
		CourseObjectives,
		CourseRequirements,
		CourseReviews,
		EnrolPanel
	} from '$lib/features/course';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const enrolled = $derived(data.progress !== null);
	const objectives = $derived(data.course.objectives ?? []);
	const requirements = $derived(data.course.requirements ?? []);

	const crumbs = $derived([
		{ label: 'Courses', href: resolve('/courses') },
		{ label: data.course.title }
	]);

	const dripNotice: Record<string, string> = {
		scheduled: 'Lessons in this course open on their own dates.',
		after_enrolment: 'Lessons open a few days apart, counted from the day you enrol.',
		sequential: 'Lessons open one at a time, as you finish the one before.'
	};
</script>

<svelte:head><title>{data.course.title} — Muallim</title></svelte:head>

<Page width="full">
	<!--
		The banner is a sunken panel, inset like everything else on the page — not a
		full-bleed band. A band that runs to the viewport's edge fights the page frame
		on every scroll, and the frame is what says where the content starts.

		The panel that asks you to enrol sits beside it and follows you down. On one
		column it comes first: on a phone the fold lands above the first heading.
	-->
	<div class="relative">
		<div class="rounded-card bg-surface-sunken p-6 sm:p-8 lg:pb-20">
			<div class="lg:mr-96 xl:mr-112">
				<CourseBanner course={data.course} {crumbs} reviews={data.reviewSummary} />
			</div>
		</div>

		<!--
			`inset-y-0` is what makes the card follow you. An absolute box shrinks to its
			content, and a `sticky` child can only travel inside its parent — so without a
			parent as tall as the page, the card sticks for exactly its own height and
			then leaves with the banner.
		-->
		<div class="lg:absolute lg:inset-y-0 lg:top-8 lg:right-8 lg:w-80 xl:w-96">
			<div class="lg:sticky lg:top-24">
				<EnrolPanel
					course={data.course}
					topics={data.topics}
					progress={data.progress}
					prerequisites={data.prerequisites}
					signedIn={data.signedIn}
					next={data.next}
				/>
			</div>
		</div>

		<!--
			Inside the same positioned wrapper as the panel, deliberately: `sticky` can
			only travel as far as its containing block, and ending the wrapper at the
			banner stops the card following you exactly where a reader starts needing it.
		-->
		<div class="mt-10 lg:mr-96 lg:mt-8 xl:mr-112">
			{#if form?.message}
				<Alert tone="danger" class="mb-6" role="alert">{form.message}</Alert>
			{/if}

			{#if data.course.drip_mode !== 'none' && dripNotice[data.course.drip_mode]}
				<p class="text-muted mb-6 flex items-start gap-2 text-sm">
					<Icon icon={Alert02Icon} class="mt-0.5 size-3.5 shrink-0" />
					{dripNotice[data.course.drip_mode]}
				</p>
			{/if}

			{#if objectives.length > 0}
				<CourseObjectives {objectives} />
			{/if}

			{#if data.announcements.length > 0}
				<CourseAnnouncements announcements={data.announcements} />
			{/if}

			<CourseCurriculum
				course={data.course}
				topics={data.topics}
				lessonCount={data.lessonCount}
				durationSeconds={data.durationSeconds}
				{enrolled}
				enrolledAt={data.enrolledAt}
			/>

			{#if requirements.length > 0 || data.prerequisites.length > 0}
				<CourseRequirements {requirements} prerequisites={data.prerequisites} />
			{/if}

			{#if data.course.description}
				<CourseDescription description={data.course.description} />
			{/if}

			<CourseReviews
				reviews={data.reviews}
				summary={data.reviewSummary}
				mine={data.myReview}
				{enrolled}
				message={form?.reviewMessage}
			/>
		</div>
	</div>
</Page>
