<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import {
		Cancel01Icon,
		Delete02Icon,
		FolderLibraryIcon,
		PlusSignIcon,
		Tag01Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Checkbox,
		EmptyState,
		Field,
		Icon,
		Input,
		Select,
		Sheet
	} from '$lib/components';
	import {
		TAXONOMY_LIMITS,
		categorySchema,
		hasCategory,
		tagSchema,
		type Category,
		type CourseSummary,
		type Tag
	} from '$lib/taxonomy';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The rows on screen, seeded by the server and mutated in place as categories and
	// tags are created and deleted.
	let categories = $derived(data.categories as Category[]);
	let tags = $derived(data.tags as Tag[]);
	const courses = $derived(data.courses as CourseSummary[]);

	let categoryErrors = $state<FieldErrors>({});
	let tagErrors = $state<FieldErrors>({});

	let newCategoryOpen = $state(false);
	let newTagOpen = $state(false);
	let creatingCategory = $state(false);
	let creatingTag = $state(false);
	let actingCategory = $state<string | null>(null);
	let actingTag = $state<string | null>(null);

	// The tagging panel's working state: which course is in focus, and the category
	// and tag set it currently carries. Loaded from the server on pick, saved on submit.
	let taggingSlug = $state('');
	let selectedCategory = $state('');
	let selectedTags = $state(new Set<string>());
	let loadingTaxonomy = $state(false);
	let savingTaxonomy = $state(false);

	const courseTitle = (slug: string) => courses.find((c) => c.slug === slug)?.title ?? slug;

	function adopt(category: Category, tagList: Tag[]) {
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

<div class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="min-w-0">
			<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Course taxonomy</h1>
			<p class="mt-2 max-w-2xl text-muted">
				The categories and tags this workspace files courses under, and where you assign them.
			</p>
		</div>
	</div>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<div class="mt-8 grid gap-6 lg:grid-cols-2">
		<!-- ------------------------------------------------------------- categories -->
		<section class="rounded-card border border-border bg-surface-raised p-5">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<Icon icon={FolderLibraryIcon} class="size-4 text-muted" />
					<h2 class="text-lg font-semibold">Categories</h2>
				</div>
				<Button size="sm" variant="secondary" onclick={() => (newCategoryOpen = !newCategoryOpen)}>
					<Icon icon={newCategoryOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
					{newCategoryOpen ? 'Close' : 'New category'}
				</Button>
			</div>

			{#if categories.length === 0}
				<div class="mt-4">
					<EmptyState
						icon={FolderLibraryIcon}
						title="No categories yet"
						description="Create a category and it will appear here, ready to file courses under."
					/>
				</div>
			{:else}
				<ul class="mt-4 space-y-2">
					{#each categories as category (category.id)}
						<li
							class="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-3"
						>
							<div class="min-w-0">
								<p class="truncate font-medium">{category.name}</p>
								<p class="truncate text-xs text-muted">{category.slug}</p>
							</div>
							<form
								method="POST"
								action="?/deleteCategory"
								use:enhance={() => {
									actingCategory = category.id;
									return async ({ result }) => {
										actingCategory = null;
										if (result.type !== 'success') return applyAction(result);
										categories = categories.filter((c) => c.id !== category.id);
										if (selectedCategory === category.id) selectedCategory = '';
										toast.success(`“${category.name}” has been deleted.`);
									};
								}}
							>
								<input type="hidden" name="id" value={category.id} />
								<Button
									type="submit"
									size="sm"
									variant="ghost"
									loading={actingCategory === category.id}
									disabled={actingCategory === category.id}
									aria-label="Delete {category.name}"
								>
									<Icon icon={Delete02Icon} class="size-4" />
								</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<!-- ------------------------------------------------------------------- tags -->
		<section class="rounded-card border border-border bg-surface-raised p-5">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<Icon icon={Tag01Icon} class="size-4 text-muted" />
					<h2 class="text-lg font-semibold">Tags</h2>
				</div>
				<Button size="sm" variant="secondary" onclick={() => (newTagOpen = !newTagOpen)}>
					<Icon icon={newTagOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
					{newTagOpen ? 'Close' : 'New tag'}
				</Button>
			</div>

			{#if tags.length === 0}
				<div class="mt-4">
					<EmptyState
						icon={Tag01Icon}
						title="No tags yet"
						description="Create a tag and it will appear here, ready to attach to a course."
					/>
				</div>
			{:else}
				<ul class="mt-4 flex flex-wrap gap-2">
					{#each tags as tag (tag.id)}
						<li>
							<form
								method="POST"
								action="?/deleteTag"
								use:enhance={() => {
									actingTag = tag.id;
									return async ({ result }) => {
										actingTag = null;
										if (result.type !== 'success') return applyAction(result);
										tags = tags.filter((t) => t.id !== tag.id);
										toggleTag(tag.id, false);
										toast.success(`“${tag.name}” has been deleted.`);
									};
								}}
							>
								<input type="hidden" name="id" value={tag.id} />
								<button
									type="submit"
									disabled={actingTag === tag.id}
									class="group inline-flex items-center gap-1.5 disabled:opacity-50"
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
		</section>
	</div>

	<!-- --------------------------------------------------------------- course tagging -->
	<section class="mt-6 rounded-card border border-border bg-surface-raised p-5">
		<h2 class="text-lg font-semibold">Tag a course</h2>
		<p class="mt-1 text-sm text-muted">Pick a course, choose its category and tags, and save.</p>

		{#if data.coursesError}
			<Alert tone="warning" class="mt-4" role="alert">{data.coursesError}</Alert>
		{:else if courses.length === 0}
			<div class="mt-4">
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
				class="mt-4 max-w-sm"
				use:enhance={() => {
					loadingTaxonomy = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						loadingTaxonomy = false;
						if (result.type !== 'success') return;
						const loaded = result.data?.taxonomy as
							{ slug: string; category: Category; tags: Tag[] } | undefined;
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
								{ slug: string; category: Category; tags: Tag[] } | undefined;
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
							<p class="mt-2 text-sm text-muted">No tags yet — create one above to attach it.</p>
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
	</section>
</div>

<!-- ---------------------------------------------------------------- new category -->
{#if newCategoryOpen}
	<form
		method="POST"
		action="?/createCategory"
		use:enhance={validated(
			categorySchema,
			(next) => (categoryErrors = next),
			() => {
				creatingCategory = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingCategory = false;
					if (result.type !== 'success') return;
					const created = result.data?.createdCategory as Category | undefined;
					if (created) {
						categories = [created, ...categories];
						newCategoryOpen = false;
						toast.success(`“${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={newCategoryOpen} onClose={() => (newCategoryOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new category</h2>
				<p class="mt-0.5 text-sm text-muted">
					A name is all it needs; the slug is derived for you.
				</p>
			{/snippet}

			<Field id="category-name" label="Name" error={categoryErrors.name}>
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
				<Button type="submit" loading={creatingCategory} disabled={creatingCategory}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create category
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- --------------------------------------------------------------------- new tag -->
{#if newTagOpen}
	<form
		method="POST"
		action="?/createTag"
		use:enhance={validated(
			tagSchema,
			(next) => (tagErrors = next),
			() => {
				creatingTag = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creatingTag = false;
					if (result.type !== 'success') return;
					const created = result.data?.createdTag as Tag | undefined;
					if (created) {
						tags = [created, ...tags];
						newTagOpen = false;
						toast.success(`“${created.name}” has been added.`);
					}
				};
			}
		)}
	>
		<Sheet open={newTagOpen} onClose={() => (newTagOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new tag</h2>
				<p class="mt-0.5 text-sm text-muted">
					A name is all it needs; the slug is derived for you.
				</p>
			{/snippet}

			<Field id="tag-name" label="Name" error={tagErrors.name}>
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
				<Button type="submit" loading={creatingTag} disabled={creatingTag}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create tag
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}
