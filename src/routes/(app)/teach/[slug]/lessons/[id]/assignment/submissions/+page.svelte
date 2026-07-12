<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		CheckmarkCircle02Icon,
		Clock01Icon,
		FilterIcon,
		Task01Icon
	} from '@hugeicons/core-free-icons';
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
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const crumbs = $derived(
		teachTrail(
			data.slug,
			data.course.title,
			data.lessonId,
			lessonTitle(data.topics, data.lessonId),
			{
				label: 'Assignment',
				href: resolve(`/teach/${data.slug}/lessons/${data.lessonId}/assignment`)
			},
			{ label: 'Marking' }
		)
	);

	const submissions = $derived(data.submissions ?? []);

	const dateFormat = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});
</script>

<svelte:head><title>Marking — Assignment</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title="Marking" />

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
			<Button type="submit" variant="ghost" size="sm">
				<Icon icon={FilterIcon} class="size-4" />
				Show everything handed in
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
					<Row
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
						<div class="flex shrink-0 items-center gap-3 text-sm">
							{#if submission.status === 'graded'}
								<span class="text-muted numeral">{submission.points ?? 0} pts</span>
								<Badge tone="success" icon={CheckmarkCircle02Icon}>Marked</Badge>
							{:else}
								<Badge tone="warning" icon={Clock01Icon}>Waiting</Badge>
							{/if}
						</div>
					</Row>
				</li>
			{/each}
		</ul>
	{/if}
</Page>
