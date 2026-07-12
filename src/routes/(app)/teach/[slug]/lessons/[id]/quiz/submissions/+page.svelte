<script lang="ts">
	import {
		Badge,
		Breadcrumbs,
		Button,
		EmptyState,
		Icon,
		Page,
		PageHeader,
		Row
	} from '$lib/components';
	import { lessonTitle, teachTrail } from '$lib/breadcrumbs';
	import { resolve } from '$app/paths';
	import {
		CancelCircleIcon,
		CheckmarkCircle02Icon,
		Clock01Icon,
		FilterIcon,
		Task01Icon
	} from '@hugeicons/core-free-icons';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const crumbs = $derived(
		teachTrail(
			data.slug,
			data.course.title,
			data.lessonId,
			lessonTitle(data.topics, data.lessonId),
			{ label: 'Quiz', href: resolve(`/teach/${data.slug}/lessons/${data.lessonId}/quiz`) },
			{ label: 'Marking' }
		)
	);

	const submissions = $derived(data.submissions ?? []);
</script>

<svelte:head><title>Marking — Quiz</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title="Marking" />

	<!--
		A filter is a GET, so it is a form and not a link. The query string it produces
		is the one the loader reads, and the page is bookmarkable at either setting.
	-->
	<form
		method="GET"
		action={resolve(`/teach/${data.slug}/lessons/${data.lessonId}/quiz/submissions`)}
		class="mt-4"
	>
		{#if data.awaiting}
			<input type="hidden" name="all" value="1" />
			<Button type="submit" variant="ghost" size="sm">
				<Icon icon={FilterIcon} class="size-4" />
				Show every attempt
			</Button>
		{:else}
			<Button type="submit" variant="ghost" size="sm">
				<Icon icon={FilterIcon} class="size-4" />
				Show only what is waiting
			</Button>
		{/if}
	</form>

	{#if submissions.length === 0}
		<div class="mt-8">
			<EmptyState
				icon={Task01Icon}
				title={data.awaiting ? 'Nothing is waiting to be marked' : 'Nobody has submitted yet'}
				description={data.awaiting
					? 'Every attempt has a grade against it.'
					: 'Attempts appear here the moment a learner submits one.'}
			/>
		</div>
	{:else}
		<ul class="mt-8 space-y-2">
			{#each submissions as submission (submission.id)}
				<li>
					<Row>
						<div class="min-w-0">
							<p class="truncate font-medium">{submission.learner_name}</p>
							<p class="text-muted truncate text-xs">
								{submission.learner_email} · attempt
								<span class="numeral">{submission.attempt.number}</span>
							</p>
						</div>

						<div class="flex shrink-0 items-center gap-3 text-sm">
							{#if submission.attempt.status === 'awaiting_review'}
								<Badge tone="warning" icon={Clock01Icon}>Waiting</Badge>
								<a
									class="underline-grow text-accent-text font-medium"
									href={resolve(
										`/teach/${data.slug}/lessons/${data.lessonId}/quiz/submissions/${submission.id}`
									)}
								>
									Mark {submission.unmarked}
									{submission.unmarked === 1 ? 'answer' : 'answers'}
								</a>
							{:else if submission.attempt.status === 'grading'}
								<Badge tone="neutral" icon={Clock01Icon}>Grading</Badge>
							{:else}
								{#if submission.attempt.passed}
									<Badge tone="success" icon={CheckmarkCircle02Icon}>Passed</Badge>
								{:else}
									<Badge tone="danger" icon={CancelCircleIcon}>Not passed</Badge>
								{/if}
								<a
									class="underline-grow text-muted numeral hover:text-text"
									href={resolve(
										`/teach/${data.slug}/lessons/${data.lessonId}/quiz/submissions/${submission.id}`
									)}
								>
									{submission.attempt.points} of {submission.attempt.max_points}
								</a>
							{/if}
						</div>
					</Row>
				</li>
			{/each}
		</ul>
	{/if}
</Page>
