<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import { UserGroupIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Card,
		EmptyState,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Sheet,
		Textarea
	} from '$lib/components';
	import { DURATION, easeOut } from '$lib/motion';
	import { canModerate } from '$lib/roles';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const moderator = $derived(canModerate(data.user));
	let composing = $state(false);
</script>

<svelte:head><title>Community — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader
		title="Community"
		description="Boards for the whole workspace, and one for each course you take."
	>
		{#snippet actions()}
			{#if moderator}
				<Button size="sm" onclick={() => (composing = !composing)}>
					{composing ? 'Close' : 'New board'}
				</Button>
			{/if}
		{/snippet}
	</PageHeader>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<!-- The composer pushes the board list down, so it grows rather than appears. -->
	{#if moderator && composing}
		<div class="mt-6 max-w-2xl" transition:slide={{ duration: DURATION.base, easing: easeOut }}>
			<form
				method="POST"
				action="?/createSpace"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') composing = false;
					};
				}}
			>
				<Sheet>
					{#snippet header()}
						<h2 class="font-medium">New board</h2>
						<p class="text-muted text-sm">
							Leave the course slug empty for a workspace-wide board.
						</p>
					{/snippet}

					<div class="space-y-4">
						<Field id="board-title" label="Title">
							{#snippet children({ id })}
								<Input {id} name="title" required maxlength={200} />
							{/snippet}
						</Field>
						<Field id="board-desc" label="Description">
							{#snippet children({ id })}
								<Textarea {id} name="description" rows={2} maxlength={2000} />
							{/snippet}
						</Field>
						<Field
							id="board-course"
							label="Course slug (optional)"
							hint="Leave empty for a workspace board."
						>
							{#snippet children({ id, describedBy })}
								<Input
									{id}
									aria-describedby={describedBy}
									name="course_slug"
									maxlength={200}
									placeholder="algebra-101"
								/>
							{/snippet}
						</Field>
					</div>

					{#snippet footer()}
						<Button type="submit" size="sm">Create board</Button>
					{/snippet}
				</Sheet>
			</form>
		</div>
	{/if}

	{#if data.spaces.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={UserGroupIcon}
				title="No boards yet"
				description="When a board is opened, or you enrol in a course that has one, it appears here."
			/>
		</div>
	{:else}
		<ul class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.spaces as space (space.id)}
				<li>
					<a
						href={resolve(`/forum/spaces/${space.id}`)}
						class="lift block h-full rounded-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<Card float class="h-full p-5">
							<div class="flex items-start justify-between gap-3">
								<h2 class="font-medium text-pretty">{space.title}</h2>
								{#if space.workspace}
									<Badge tone="accent">Workspace</Badge>
								{:else}
									<Badge tone="neutral">Course</Badge>
								{/if}
							</div>
							{#if space.description}
								<p class="text-muted mt-2 line-clamp-2 text-sm">{space.description}</p>
							{/if}
							<p class="text-muted mt-4 flex items-center gap-1.5 text-xs">
								<Icon icon={UserGroupIcon} class="size-3.5" />
								<span class="numeral">{space.thread_count}</span>
								{space.thread_count === 1 ? 'thread' : 'threads'}
							</p>
						</Card>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</Page>
