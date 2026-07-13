<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import { Cancel01Icon, PlusSignIcon, SentIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Sheet,
		Textarea
	} from '$lib/components';
	import { ThreadRow } from '$lib/features/forum';
	import { DURATION, easeOut } from '$lib/motion';
	import { LIMITS, threadSchema } from '$lib/schemas';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let composing = $state(false);

	// The page's own schema run, and the action's. One reading: whichever spoke last.
	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const crumbs = $derived([
		{ label: 'Community', href: resolve('/forum') },
		{ label: data.space.title }
	]);
</script>

<svelte:head><title>{data.space.title} — Muallim</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title={data.space.title} description={data.space.description}>
		{#snippet meta()}
			{#if data.space.workspace}
				<Badge tone="accent">Workspace</Badge>
			{:else if data.space.course_title}
				<Badge tone="neutral">{data.space.course_title}</Badge>
			{/if}
		{/snippet}
		{#snippet actions()}
			<Button size="sm" onclick={() => (composing = !composing)}>
				<Icon icon={composing ? Cancel01Icon : PlusSignIcon} class="size-4" />
				{composing ? 'Close' : 'New thread'}
			</Button>
		{/snippet}
	</PageHeader>

	<!-- A failure of the call, not of a field: it is the page's voice. -->
	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<!-- The composer pushes the thread list down, so it grows rather than appears. -->
	{#if composing}
		<div class="mt-6 max-w-2xl" transition:slide={{ duration: DURATION.base, easing: easeOut }}>
			<form
				method="POST"
				action="?/startThread"
				use:enhance={validated(threadSchema, (next) => (errors = next))}
			>
				<Sheet>
					{#snippet header()}
						<h2 class="font-medium">Start a thread</h2>
					{/snippet}

					<div class="space-y-4">
						<Field id="thread-title" label="Title" error={problem('title')}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="title"
									{...LIMITS.threadTitle}
									aria-describedby={describedBy}
								/>
							{/snippet}
						</Field>
						<Field id="thread-body" label="Message" error={problem('body')}>
							{#snippet children({ id, describedBy, invalid })}
								<Textarea
									{id}
									{invalid}
									name="body"
									rows={4}
									{...LIMITS.threadBody}
									aria-describedby={describedBy}
								/>
							{/snippet}
						</Field>
					</div>

					{#snippet footer()}
						<Button type="submit" size="sm">
							<Icon icon={SentIcon} class="size-4" />
							Post thread
						</Button>
					{/snippet}
				</Sheet>
			</form>
		</div>
	{/if}

	{#if data.threads.length === 0}
		<p class="text-muted mt-8 text-sm">No threads yet. Start the first one.</p>
	{:else}
		<!-- The API returns pinned threads first, then by last activity — the order the board is read in. -->
		<ul
			class="mt-6 max-w-4xl divide-y divide-border overflow-hidden rounded-card bg-surface-raised shadow-card"
		>
			{#each data.threads as thread (thread.id)}
				<li class={thread.pinned ? 'bg-accent-surface/30' : ''}>
					<ThreadRow {thread} />
				</li>
			{/each}
		</ul>

		{#if data.nextCursor}
			<div class="mt-6 flex justify-center">
				<Button
					href={`${resolve(`/forum/spaces/${data.space.id}`)}?cursor=${encodeURIComponent(data.nextCursor)}`}
					variant="secondary"
					size="sm"
				>
					Load more
				</Button>
			</div>
		{/if}
	{/if}
</Page>
