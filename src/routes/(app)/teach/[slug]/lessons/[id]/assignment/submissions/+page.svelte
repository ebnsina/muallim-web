<script lang="ts">
	import { resolve } from '$app/paths';
	import { Task01Icon } from '@hugeicons/core-free-icons';
	import { Badge, EmptyState } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const submissions = $derived(data.submissions ?? []);

	const dateFormat = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});
</script>

<svelte:head><title>Marking — Assignment</title></svelte:head>

<main class="mx-auto max-w-3xl px-6 py-16">
	<p class="text-muted text-sm">
		<a class="underline" href={resolve(`/teach/${data.slug}/lessons/${data.lessonId}/assignment`)}>
			Back to the assignment
		</a>
	</p>

	<h1 class="mt-2 text-2xl font-semibold">Marking</h1>

	<!--
		A filter is a GET, so it is a form and not a button that rewrites the URL. The
		page is bookmarkable at either setting, and works with no JavaScript at all.
	-->
	<form
		method="GET"
		action={resolve(`/teach/${data.slug}/lessons/${data.lessonId}/assignment/submissions`)}
		class="mt-4"
	>
		{#if data.awaiting}
			<input type="hidden" name="all" value="1" />
			<button type="submit" class="text-sm underline">Show everything handed in</button>
		{:else}
			<button type="submit" class="text-sm underline">Show only what is waiting</button>
		{/if}
	</form>

	{#if submissions.length === 0}
		<div class="mt-8">
			<EmptyState
				icon={Task01Icon}
				title={data.awaiting ? 'Nothing is waiting to be marked' : 'Nobody has handed in yet'}
				description={data.awaiting
					? 'Every submission has a grade against it.'
					: 'Work appears here the moment a learner hands it in.'}
			/>
		</div>
	{:else}
		<ul class="mt-8 space-y-2">
			{#each submissions as submission (submission.id)}
				<li>
					<a
						class="flex items-center justify-between gap-4 rounded-control border border-border px-4 py-3 transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						href={resolve(
							`/teach/${data.slug}/lessons/${data.lessonId}/assignment/submissions/${submission.id}`
						)}
					>
						<div class="min-w-0">
							<p class="flex items-center gap-2 font-medium">
								<span class="truncate">{submission.learner_name}</span>
								{#if submission.late}
									<Badge tone="warning">Late</Badge>
								{/if}
							</p>
							<p class="text-muted truncate text-xs">
								{submission.learner_email}{#if submission.submitted_at}
									· {dateFormat.format(new Date(submission.submitted_at))}{/if}
							</p>
						</div>

						<!--
							`points` is absent until a person has marked it, and `0` is a real
							grade. `?? null` and an explicit null check, never a falsy one.
						-->
						<div class="shrink-0 text-right text-sm">
							{#if submission.status === 'graded'}
								<span class="numeral">{submission.points ?? 0}</span>
								<p class="text-muted text-xs">Marked</p>
							{:else}
								<span class="text-accent-text">Mark</span>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</main>
