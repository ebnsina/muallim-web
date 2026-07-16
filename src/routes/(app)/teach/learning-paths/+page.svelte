<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		Cancel01Icon,
		Delete02Icon,
		PlusSignIcon,
		Route02Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		EmptyState,
		Field,
		Icon,
		Input,
		PageHeader,
		Select,
		Sheet,
		Textarea
	} from '$lib/components';
	import {
		PATH_LIMITS,
		createPathSchema,
		pathStatusLabel,
		pathStatusTone,
		type Path
	} from '$lib/learnpath';
	import { appendPage, canLoadMore, type Paged } from '$lib/paging';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const pathKey = (path: Path) => path.id;

	let paths = $derived(data.paths as Paged<Path>);

	let errors = $state<FieldErrors>({});

	let createOpen = $state(false);
	let creating = $state(false);
	let loadingMore = $state(false);
	let confirming = $state<string | null>(null);
	let removing = $state<string | null>(null);

	const courseCount = (path: Path) => path.course_ids?.length ?? 0;
</script>

<svelte:head><title>Learning paths — Muallim</title></svelte:head>

<PageHeader
	title="Learning paths"
	description="Ordered tracks of courses a learner follows one after another. A path is a draft until you publish it."
>
	{#snippet actions()}
		<Button onclick={() => (createOpen = !createOpen)}>
			<Icon icon={createOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
			{createOpen ? 'Close' : 'New path'}
		</Button>
	{/snippet}
</PageHeader>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- -------------------------------------------------------------------- create -->
{#if createOpen}
	<form
		method="POST"
		action="?/create"
		class="mt-6"
		use:enhance={validated(
			createPathSchema,
			(next) => (errors = next),
			() => {
				creating = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					creating = false;

					if (result.type !== 'success') return;

					const created = result.data?.createdPath as Path | undefined;
					if (created) {
						paths = { ...paths, rows: [created, ...paths.rows] };
						createOpen = false;
						toast.success(`“${created.title}” has been created.`);
					}
				};
			}
		)}
	>
		<Sheet open={createOpen} onClose={() => (createOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">A new learning path</h2>
				<p class="mt-0.5 text-sm text-muted">
					A title and a web address are all it needs; you add its courses next. It starts as a
					draft.
				</p>
			{/snippet}

			<div class="grid gap-5">
				<Field id="title" label="Title" error={errors.title}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="title"
							placeholder="Hifz Track"
							aria-describedby={describedBy}
							{...PATH_LIMITS.title}
						/>
					{/snippet}
				</Field>

				<Field id="slug" label="Web address" error={errors.slug}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="slug"
							placeholder="hifz-track"
							aria-describedby={describedBy}
							{...PATH_LIMITS.slug}
						/>
					{/snippet}
				</Field>

				<Field id="description" label="Description" error={errors.description}>
					{#snippet children({ id, describedBy, invalid })}
						<Textarea
							{id}
							{invalid}
							name="description"
							placeholder="What a learner works through, and why."
							aria-describedby={describedBy}
							{...PATH_LIMITS.description}
						/>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={creating} disabled={creating}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create path
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- --------------------------------------------------------------------- filter -->
<div class="mt-8 flex items-end justify-end">
	<form method="GET" class="w-44">
		<Field id="status-filter" label="Status">
			{#snippet children({ id })}
				<Select
					{id}
					name="status"
					value={data.status}
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				>
					<option value="">Any status</option>
					<option value="draft">Draft</option>
					<option value="published">Published</option>
				</Select>
			{/snippet}
		</Field>
		<noscript><Button type="submit" variant="secondary" class="mt-2">Apply</Button></noscript>
	</form>
</div>

<!-- ----------------------------------------------------------------------- list -->
<section class="mt-4">
	{#if paths.rows.length === 0}
		<EmptyState
			icon={Route02Icon}
			title="No learning paths yet"
			description={data.status
				? 'Nothing matches this filter. Try another status.'
				: 'Create your first path above and it will appear here, ready for its courses.'}
		/>
	{:else}
		<ul class="space-y-3">
			{#each paths.rows as path (path.id)}
				<li class="rounded-card bg-surface-raised p-4 shadow-card sm:p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<a
									href={resolve(`/teach/learning-paths/${path.slug}`)}
									class="rounded-control font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								>
									{path.title}
								</a>
								<Badge tone={pathStatusTone(path.status)}>{pathStatusLabel(path.status)}</Badge>
							</div>
							<p class="mt-1 text-sm text-muted">
								{courseCount(path)}
								{courseCount(path) === 1 ? 'course' : 'courses'}
								<span class="text-muted/70">· {path.slug}</span>
							</p>
						</div>

						<div class="flex shrink-0 items-center gap-2">
							<Button
								href={resolve(`/teach/learning-paths/${path.slug}`)}
								variant="secondary"
								size="sm"
							>
								Edit
							</Button>

							{#if confirming === path.id}
								<form
									method="POST"
									action="?/remove"
									class="flex items-center gap-2"
									use:enhance={() => {
										removing = path.id;
										return async ({ result }) => {
											removing = null;
											confirming = null;
											if (result.type !== 'success') return applyAction(result);
											paths = { ...paths, rows: paths.rows.filter((p) => p.id !== path.id) };
											toast.success(`“${path.title}” has been deleted.`);
										};
									}}
								>
									<input type="hidden" name="slug" value={path.slug} />
									<Button
										type="submit"
										variant="danger"
										size="sm"
										loading={removing === path.id}
										disabled={removing === path.id}
									>
										Delete
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => (confirming = null)}
									>
										Keep
									</Button>
								</form>
							{:else}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => (confirming = path.id)}
									aria-label="Delete {path.title}"
								>
									<Icon icon={Delete02Icon} class="size-4" />
								</Button>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>

		{#if canLoadMore(paths)}
			<form
				method="POST"
				action="?/more"
				class="mt-4 flex justify-center"
				use:enhance={() => {
					loadingMore = true;
					return async ({ result }) => {
						loadingMore = false;
						if (result.type !== 'success') return applyAction(result);
						const next = result.data?.more as Paged<Path> | undefined;
						if (next) paths = appendPage(paths, next, pathKey);
					};
				}}
			>
				<input type="hidden" name="cursor" value={paths.cursor} />
				<input type="hidden" name="status" value={data.status} />
				<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
					<Icon icon={ArrowDown01Icon} class="size-4" />
					Load more paths
				</Button>
			</form>
		{/if}
	{/if}
</section>
