<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { Cancel01Icon, Delete02Icon, PlusSignIcon, Tag01Icon } from '@hugeicons/core-free-icons';
	import { Alert, Badge, Button, EmptyState, Field, Icon, Input, Sheet } from '$lib/components';
	import { TAXONOMY_LIMITS, tagSchema, type Tag } from '$lib/taxonomy';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Seeded by the server, mutated in place as tags are created and deleted.
	let tags = $derived(data.tags as Tag[]);

	let errors = $state<FieldErrors>({});
	let newOpen = $state(false);
	let creating = $state(false);
	let acting = $state<string | null>(null);
</script>

<svelte:head><title>Tags — Muallim</title></svelte:head>

<div class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="min-w-0">
			<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Tags</h1>
			<p class="mt-2 max-w-2xl text-muted">
				The labels this workspace attaches to courses. Attach them to a course from Course taxonomy.
			</p>
		</div>
		<Button variant="secondary" onclick={() => (newOpen = !newOpen)}>
			<Icon icon={newOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{newOpen ? 'Close' : 'New tag'}
		</Button>
	</div>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	{#if tags.length === 0}
		<div class="mt-8">
			<EmptyState
				icon={Tag01Icon}
				title="No tags yet"
				description="Create a tag and it will appear here, ready to attach to a course."
			/>
		</div>
	{:else}
		<ul class="mt-8 flex flex-wrap gap-2">
			{#each tags as tag (tag.id)}
				<li>
					<form
						method="POST"
						action="?/delete"
						use:enhance={() => {
							acting = tag.id;
							return async ({ result }) => {
								acting = null;
								if (result.type !== 'success') return applyAction(result);
								tags = tags.filter((t) => t.id !== tag.id);
								toast.success(`“${tag.name}” has been deleted.`);
							};
						}}
					>
						<input type="hidden" name="id" value={tag.id} />
						<button
							type="submit"
							disabled={acting === tag.id}
							class="group inline-flex items-center disabled:opacity-50"
							aria-label="Delete {tag.name}"
						>
							<Badge tone="neutral">
								{tag.name}
								<Icon
									icon={Delete02Icon}
									class="size-3 text-muted transition-colors group-hover:text-danger"
								/>
							</Badge>
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- --------------------------------------------------------------------- new tag -->
{#if newOpen}
	<form
		method="POST"
		action="?/create"
		use:enhance={validated(
			tagSchema,
			(next) => (errors = next),
			() => {
				creating = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creating = false;
					if (result.type !== 'success') return;
					const created = result.data?.createdTag as Tag | undefined;
					if (created) {
						tags = [created, ...tags];
						newOpen = false;
						toast.success(`“${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={newOpen} onClose={() => (newOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new tag</h2>
				<p class="mt-0.5 text-sm text-muted">
					A name is all it needs; the rest is filled in for you.
				</p>
			{/snippet}

			<Field id="tag-name" label="Name" error={errors.name}>
				{#snippet children({ id, describedBy, invalid })}
					<Input
						{id}
						{invalid}
						name="name"
						placeholder="beginner"
						aria-describedby={describedBy}
						{...TAXONOMY_LIMITS.tagName}
					/>
				{/snippet}
			</Field>

			{#snippet footer()}
				<Button type="submit" loading={creating} disabled={creating}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create tag
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}
