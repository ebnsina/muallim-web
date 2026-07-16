<script lang="ts">
	import { enhance } from '$app/forms';
	import { FolderLibraryIcon } from '@hugeicons/core-free-icons';
	import { Alert, Button, Checkbox, EmptyState, Field, Select } from '$lib/components';
	import { hasCategory, type Category, type CourseSummary, type Tag } from '$lib/taxonomy';
	import { toast } from '$lib/toast.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const categories = $derived(data.categories as Category[]);
	const tags = $derived(data.tags as Tag[]);
	const courses = $derived(data.courses as CourseSummary[]);

	// The working state: which course is in focus, and the category and tag set it
	// currently carries. Loaded from the server on pick, saved on submit.
	let taggingSlug = $state('');
	let selectedCategory = $state('');
	let selectedTags = $state(new Set<string>());
	let loadingTaxonomy = $state(false);
	let savingTaxonomy = $state(false);

	const courseTitle = (slug: string) => courses.find((c) => c.slug === slug)?.title ?? slug;

	function adopt(category: Category | null, tagList: Tag[]) {
		selectedCategory = hasCategory(category) ? category.id : '';
		selectedTags = new Set(tagList.map((t) => t.id));
	}

	function toggleTag(id: string, on: boolean) {
		const next = new Set(selectedTags);
		if (on) next.add(id);
		else next.delete(id);
		selectedTags = next;
	}
</script>

<svelte:head><title>Course taxonomy — Muallim</title></svelte:head>

<div class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="min-w-0">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Course taxonomy</h1>
		<p class="mt-2 max-w-2xl text-muted">
			Pick a course, choose its category and tags, and save. Manage the vocabularies themselves from
			Categories and Tags.
		</p>
	</div>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	{#if data.coursesError}
		<Alert tone="warning" class="mt-8" role="alert">{data.coursesError}</Alert>
	{:else if courses.length === 0}
		<div class="mt-8">
			<EmptyState
				icon={FolderLibraryIcon}
				title="No courses to tag"
				description="Create a course first, then come back to file it under a category and tags."
			/>
		</div>
	{:else}
		<form
			method="POST"
			action="?/loadTaxonomy"
			class="mt-8 max-w-sm"
			use:enhance={() => {
				loadingTaxonomy = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					loadingTaxonomy = false;
					if (result.type !== 'success') return;
					const loaded = result.data?.taxonomy as
						{ slug: string; category: Category | null; tags: Tag[] } | undefined;
					if (loaded) {
						taggingSlug = loaded.slug;
						adopt(loaded.category, loaded.tags);
					}
				};
			}}
		>
			<Field id="course-pick" label="Course">
				{#snippet children({ id, describedBy })}
					<Select
						{id}
						name="slug"
						value={taggingSlug}
						disabled={loadingTaxonomy}
						aria-describedby={describedBy}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
					>
						<option value="" disabled>Choose a course</option>
						{#each courses as course (course.id)}
							<option value={course.slug}>{course.title}</option>
						{/each}
					</Select>
				{/snippet}
			</Field>
		</form>

		{#if taggingSlug}
			<form
				method="POST"
				action="?/saveTaxonomy"
				class="mt-6 border-t border-border pt-6"
				use:enhance={() => {
					savingTaxonomy = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						savingTaxonomy = false;
						if (result.type !== 'success') return;
						const saved = result.data?.savedTaxonomy as
							{ slug: string; category: Category | null; tags: Tag[] } | undefined;
						if (saved) {
							adopt(saved.category, saved.tags);
							toast.success(`Saved the taxonomy for “${courseTitle(saved.slug)}”.`);
						}
					};
				}}
			>
				<input type="hidden" name="slug" value={taggingSlug} />

				<div class="max-w-sm">
					<Field id="course-category" label="Category">
						{#snippet children({ id, describedBy })}
							<Select
								{id}
								name="category_id"
								bind:value={selectedCategory}
								aria-describedby={describedBy}
							>
								<option value="">No category</option>
								{#each categories as category (category.id)}
									<option value={category.id}>{category.name}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>
				</div>

				<fieldset class="mt-5">
					<legend class="text-sm font-medium">Tags</legend>
					{#if tags.length === 0}
						<p class="mt-2 text-sm text-muted">No tags yet — create one under Tags to attach it.</p>
					{:else}
						<div class="mt-3 flex flex-wrap gap-x-6 gap-y-3">
							{#each tags as tag (tag.id)}
								<label class="inline-flex cursor-pointer items-center gap-2 text-sm">
									<Checkbox
										name="tag_ids"
										value={tag.id}
										checked={selectedTags.has(tag.id)}
										onchange={(e) => toggleTag(tag.id, e.currentTarget.checked)}
									/>
									{tag.name}
								</label>
							{/each}
						</div>
					{/if}
				</fieldset>

				<div class="mt-6 flex justify-end">
					<Button type="submit" loading={savingTaxonomy} disabled={savingTaxonomy}>
						Save taxonomy
					</Button>
				</div>
			</form>
		{/if}
	{/if}
</div>
