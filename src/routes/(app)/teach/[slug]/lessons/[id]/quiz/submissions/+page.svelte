<script lang="ts">
	import { Breadcrumbs } from '$lib/components';
	import { lessonTitle, teachTrail } from '$lib/breadcrumbs';
	import { resolve } from '$app/paths';
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

<main class="mx-auto max-w-3xl px-6 py-16">
	<Breadcrumbs {crumbs} />

	<h1 class="mt-2 text-2xl font-semibold">Marking</h1>

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
			<button type="submit" class="text-sm underline">Show every attempt</button>
		{:else}
			<button type="submit" class="text-sm underline">Show only what is waiting</button>
		{/if}
	</form>

	{#if submissions.length === 0}
		<p class="text-muted mt-8 text-sm">
			{data.awaiting ? 'Nothing is waiting to be marked.' : 'Nobody has submitted this quiz yet.'}
		</p>
	{:else}
		<ul class="mt-8 space-y-2">
			{#each submissions as submission (submission.id)}
				<li class="flex items-center justify-between gap-4 rounded-control border px-4 py-3">
					<div>
						<p class="font-medium">{submission.learner_name}</p>
						<p class="text-muted text-xs">
							{submission.learner_email} · attempt {submission.attempt.number}
						</p>
					</div>

					<div class="text-right text-sm">
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
				</li>
			{/each}
		</ul>
	{/if}
</main>
