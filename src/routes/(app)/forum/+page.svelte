<script lang="ts">
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { UserGroupIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Button,
		EmptyState,
		Field,
		Input,
		Page,
		PageHeader,
		Sheet,
		Textarea
	} from '$lib/components';
	import { BoardRow } from '$lib/features/forum';
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
		<!-- One bordered, divided list rather than a grid of floating cards: a board index is
		     read down, and the border here is the divider between rows, not a box around each. -->
		<ul
			class="mt-6 max-w-4xl divide-y divide-border overflow-hidden rounded-card border border-border"
		>
			{#each data.spaces as space (space.id)}
				<li><BoardRow {space} /></li>
			{/each}
		</ul>
	{/if}
</Page>
