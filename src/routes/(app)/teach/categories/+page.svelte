<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		Cancel01Icon,
		Delete02Icon,
		FolderLibraryIcon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import { Alert, Button, EmptyState, Field, Icon, Input, Sheet } from '$lib/components';
	import { TAXONOMY_LIMITS, categorySchema, type Category } from '$lib/taxonomy';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Seeded by the server, mutated in place as categories are created and deleted.
	let categories = $derived(data.categories as Category[]);

	let errors = $state<FieldErrors>({});
	let newOpen = $state(false);
	let creating = $state(false);
	let acting = $state<string | null>(null);
</script>

<svelte:head><title>Categories — Muallim</title></svelte:head>

<div class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="min-w-0">
			<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Categories</h1>
			<p class="mt-2 max-w-2xl text-muted">
				The folders this workspace files courses under. Assign one to a course from Course taxonomy.
			</p>
		</div>
		<Button variant="secondary" onclick={() => (newOpen = !newOpen)}>
			<Icon icon={newOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{newOpen ? 'Close' : 'New category'}
		</Button>
	</div>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	{#if categories.length === 0}
		<div class="mt-8">
			<EmptyState
				icon={FolderLibraryIcon}
				title="No categories yet"
				description="Create a category and it will appear here, ready to file courses under."
			/>
		</div>
	{:else}
		<ul class="mt-8 space-y-2">
			{#each categories as category (category.id)}
				<li
					class="flex items-center justify-between gap-3 rounded-card border border-border bg-surface-raised p-4"
				>
					<div class="min-w-0">
						<p class="truncate font-medium">{category.name}</p>
						<p class="truncate text-xs text-muted">{category.slug}</p>
					</div>
					<form
						method="POST"
						action="?/delete"
						use:enhance={() => {
							acting = category.id;
							return async ({ result }) => {
								acting = null;
								if (result.type !== 'success') return applyAction(result);
								categories = categories.filter((c) => c.id !== category.id);
								toast.success(`“${category.name}” has been deleted.`);
							};
						}}
					>
						<input type="hidden" name="id" value={category.id} />
						<Button
							type="submit"
							size="sm"
							variant="ghost"
							loading={acting === category.id}
							disabled={acting === category.id}
							aria-label="Delete {category.name}"
						>
							<Icon icon={Delete02Icon} class="size-4" />
						</Button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- ---------------------------------------------------------------- new category -->
{#if newOpen}
	<form
		method="POST"
		action="?/create"
		use:enhance={validated(
			categorySchema,
			(next) => (errors = next),
			() => {
				creating = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creating = false;
					if (result.type !== 'success') return;
					const created = result.data?.createdCategory as Category | undefined;
					if (created) {
						categories = [created, ...categories];
						newOpen = false;
						toast.success(`“${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={newOpen} onClose={() => (newOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new category</h2>
				<p class="mt-0.5 text-sm text-muted">
					A name is all it needs; the rest is filled in for you.
				</p>
			{/snippet}

			<Field id="category-name" label="Name" error={errors.name}>
				{#snippet children({ id, describedBy, invalid })}
					<Input
						{id}
						{invalid}
						name="name"
						placeholder="Quran Studies"
						aria-describedby={describedBy}
						{...TAXONOMY_LIMITS.categoryName}
					/>
				{/snippet}
			</Field>

			{#snippet footer()}
				<Button type="submit" loading={creating} disabled={creating}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create category
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}
