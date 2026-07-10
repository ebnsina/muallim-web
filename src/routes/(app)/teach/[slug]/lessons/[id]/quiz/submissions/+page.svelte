<script lang="ts">
	import { Breadcrumbs, Button, EmptyState, Page, PageHeader, Row } from '$lib/components';
	import { lessonTitle, teachTrail } from '$lib/breadcrumbs';
	import { resolve } from '$app/paths';
	import { Task01Icon } from '@hugeicons/core-free-icons';
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
			<Button type="submit" variant="ghost" size="sm">Show every attempt</Button>
		{:else}
			<Button type="submit" variant="ghost" size="sm">Show only what is waiting</Button>
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

						<div class="shrink-0 text-right text-sm">
							{#if submission.attempt.status === 'awaiting_review'}
								<a
									class="underline"
									href={resolve(
										`/teach/${data.slug}/lessons/${data.lessonId}/quiz/submissions/${submission.id}`
									)}
								>
									Mark {submission.unmarked}
									{submission.unmarked === 1 ? 'answer' : 'answers'}
								</a>
							{:else if submission.attempt.status === 'grading'}
								<span class="text-muted">Grading</span>
							{:else}
								<a
									class="underline"
									href={resolve(
										`/teach/${data.slug}/lessons/${data.lessonId}/quiz/submissions/${submission.id}`
									)}
								>
									{submission.attempt.points} of {submission.attempt.max_points}
								</a>
								<p class="text-muted text-xs">
									{submission.attempt.passed ? 'Passed' : 'Not passed'}
								</p>
							{/if}
						</div>
					</Row>
				</li>
			{/each}
		</ul>
	{/if}
</Page>
