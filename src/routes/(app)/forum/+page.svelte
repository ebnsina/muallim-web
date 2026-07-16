<script lang="ts">
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { Cancel01Icon, PlusSignIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Button,
		EmptyState,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Sheet,
		Textarea
	} from '$lib/components';
	import { BoardRow } from '$lib/features/forum';
	import { DURATION, easeOut } from '$lib/motion';
	import { canModerate } from '$lib/roles';
	import { LIMITS, boardSchema } from '$lib/schemas';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const moderator = $derived(canModerate(data.user));
	let composing = $state(false);

	// The page's own schema run, and the action's. One reading: whichever spoke last.
	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];
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
					<Icon icon={composing ? Cancel01Icon : PlusSignIcon} class="size-4" />
					{composing ? 'Close' : 'New board'}
				</Button>
			{/if}
		{/snippet}
	</PageHeader>

	<!-- A failure of the call, not of a field: it is the page's voice. -->
	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<!-- The composer pushes the board list down, so it grows rather than appears. -->
	{#if moderator && composing}
		<div class="mt-6 max-w-2xl" transition:slide={{ duration: DURATION.base, easing: easeOut }}>
			<form
				method="POST"
				action="?/createSpace"
				use:enhance={validated(
					boardSchema,
					(next) => (errors = next),
					() => {
						return async ({ update, result }) => {
							await update();
							if (result.type === 'success') composing = false;
						};
					}
				)}
			>
				<Sheet open={composing} onClose={() => (composing = false)}>
					{#snippet header()}
						<h2 class="font-medium">New board</h2>
						<p class="text-muted text-sm">
							Leave the course slug empty for a workspace-wide board.
						</p>
					{/snippet}

					<div class="space-y-4">
						<!-- The refusal rides on the field it is about — Field renders it under the
						     control, in plain text. A banner at the top of the page is a sentence about
						     one input, shouted from across the room. -->
						<Field id="board-title" label="Title" error={problem('title')}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="title"
									{...LIMITS.boardTitle}
									aria-describedby={describedBy}
								/>
							{/snippet}
						</Field>
						<Field id="board-desc" label="Description" error={problem('description')}>
							{#snippet children({ id, describedBy, invalid })}
								<Textarea
									{id}
									{invalid}
									name="description"
									rows={2}
									{...LIMITS.boardDescription}
									aria-describedby={describedBy}
								/>
							{/snippet}
						</Field>
						<Field
							id="board-course"
							label="Course slug (optional)"
							hint="Leave empty for a workspace board."
							error={problem('course_slug')}
						>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									aria-describedby={describedBy}
									name="course_slug"
									{...LIMITS.courseSlug}
									placeholder="algebra-101"
								/>
							{/snippet}
						</Field>
					</div>

					{#snippet footer()}
						<Button type="submit" size="sm">
							<Icon icon={PlusSignIcon} class="size-4" />
							Create board
						</Button>
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
				description="When a board is opened, or you enroll in a course that has one, it appears here."
			/>
		</div>
	{:else}
		<!-- One bordered, divided list rather than a grid of floating cards: a board index is
		     read down, and the border here is the divider between rows, not a box around each. -->
		<ul
			class="mt-6 max-w-4xl divide-y divide-border overflow-hidden rounded-card bg-surface-raised shadow-card"
		>
			{#each data.spaces as space (space.id)}
				<li><BoardRow {space} /></li>
			{/each}
		</ul>
	{/if}
</Page>
