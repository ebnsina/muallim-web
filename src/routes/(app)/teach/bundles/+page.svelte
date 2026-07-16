<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		Cancel01Icon,
		Delete02Icon,
		PackageIcon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import {
		ActionLink,
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
	import { BUNDLE_LIMITS, bundleCreateSchema, type Bundle } from '$lib/bundles';
	import { formatMoney } from '$lib/money';
	import { appendPage, canLoadMore, type Paged } from '$lib/paging';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const bundleKey = (bundle: Bundle) => bundle.id;

	let bundles = $derived(data.bundles as Paged<Bundle>);

	let createErrors = $state<FieldErrors>({});
	let createOpen = $state(false);
	let creating = $state(false);
	let loadingMore = $state(false);
	let acting = $state<string | null>(null);

	// A listing omits course_ids, so the count is unknown here until the bundle is
	// opened. The detail page is where courses live.
	const courseCount = (bundle: Bundle) => bundle.course_ids?.length ?? null;
</script>

<svelte:head><title>Bundles — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader
		title="Course bundles"
		description="Group courses under one name and sell them at a single price."
	>
		{#snippet actions()}
			<Button onclick={() => (createOpen = !createOpen)}>
				<Icon icon={createOpen ? Cancel01Icon : PlusSignIcon} class="size-4" />
				{createOpen ? 'Close' : 'New bundle'}
			</Button>
		{/snippet}
	</PageHeader>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<!-- ------------------------------------------------------------- new bundle -->
	{#if createOpen}
		<form
			method="POST"
			action="?/create"
			class="mt-6"
			use:enhance={validated(
				bundleCreateSchema,
				(next) => (createErrors = next),
				() => {
					creating = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						creating = false;
						if (result.type !== 'success') return;

						const created = result.data?.createdBundle as Bundle | undefined;
						if (created) {
							bundles = { ...bundles, rows: [created, ...bundles.rows] };
							createOpen = false;
							toast.success(`“${created.name}” has been created.`);
						}
					};
				}
			)}
		>
			<Sheet open={createOpen} onClose={() => (createOpen = false)}>
				{#snippet header()}
					<h2 class="font-medium">A new bundle</h2>
					<p class="mt-0.5 text-sm text-muted">
						A named group of courses at one price. Add its courses once it exists. The price is in
						taka.
					</p>
				{/snippet}

				<div class="grid gap-5">
					<Field id="name" label="Name" error={createErrors.name}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="name"
								placeholder="Starter pack"
								aria-describedby={describedBy}
								{...BUNDLE_LIMITS.name}
							/>
						{/snippet}
					</Field>

					<Field id="slug" label="Slug" error={createErrors.slug}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="slug"
								placeholder="starter-pack"
								aria-describedby={describedBy}
								{...BUNDLE_LIMITS.slug}
							/>
						{/snippet}
					</Field>

					<Field id="price" label="Price (৳)" error={createErrors.price}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="price"
								inputmode="decimal"
								placeholder="2000"
								aria-describedby={describedBy}
								{...BUNDLE_LIMITS.price}
							/>
						{/snippet}
					</Field>

					<Field id="currency" label="Currency" error={createErrors.currency}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="currency"
								value="BDT"
								aria-describedby={describedBy}
								{...BUNDLE_LIMITS.currency}
							/>
						{/snippet}
					</Field>

					<Field id="description" label="Description" error={createErrors.description}>
						{#snippet children({ id, describedBy, invalid })}
							<Textarea
								{id}
								{invalid}
								name="description"
								placeholder="Optional — what this bundle is for."
								aria-describedby={describedBy}
								{...BUNDLE_LIMITS.description}
							/>
						{/snippet}
					</Field>
				</div>

				{#snippet footer()}
					<Button type="submit" loading={creating} disabled={creating}>
						<Icon icon={PlusSignIcon} class="size-4" />
						Create bundle
					</Button>
				{/snippet}
			</Sheet>
		</form>
	{/if}

	<!-- ------------------------------------------------------------- bundles -->
	<div class="mt-10">
		{#if bundles.rows.length === 0}
			<EmptyState
				icon={PackageIcon}
				title="No bundles yet"
				description="Create a bundle above and it will appear here, ready to fill with courses."
			>
				{#snippet action()}
					<Button onclick={() => (createOpen = true)} size="sm">
						<Icon icon={PlusSignIcon} class="size-4" />
						New bundle
					</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<ul class="grid gap-3 sm:grid-cols-2">
				{#each bundles.rows as bundle (bundle.id)}
					<li class="rounded-card border border-border bg-surface-raised p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="font-medium">
									<a
										href={resolve(`/teach/bundles/${bundle.slug}`)}
										class="hover:underline focus-visible:underline focus-visible:outline-none"
									>
										{bundle.name}
									</a>
								</p>
								<p class="mt-0.5 text-sm text-muted">
									{formatMoney({ amount_minor: bundle.price_amount, currency: bundle.currency })}
									{#if courseCount(bundle) !== null}
										· {courseCount(bundle)}
										{courseCount(bundle) === 1 ? 'course' : 'courses'}
									{/if}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-1">
								<ActionLink href={resolve(`/teach/bundles/${bundle.slug}`)} tone="muted">
									Manage
								</ActionLink>
								<form
									method="POST"
									action="?/delete"
									use:enhance={() => {
										acting = bundle.id;
										return async ({ result }) => {
											acting = null;
											if (result.type !== 'success') return applyAction(result);
											bundles = {
												...bundles,
												rows: bundles.rows.filter((b) => b.id !== bundle.id)
											};
											toast.success(`“${bundle.name}” has been deleted.`);
										};
									}}
								>
									<input type="hidden" name="slug" value={bundle.slug} />
									<Button
										type="submit"
										size="sm"
										variant="ghost"
										loading={acting === bundle.id}
										disabled={acting === bundle.id}
										aria-label="Delete {bundle.name}"
									>
										<Icon icon={Delete02Icon} class="size-4" />
									</Button>
								</form>
							</div>
						</div>
					</li>
				{/each}
			</ul>

			{#if canLoadMore(bundles)}
				<form
					method="POST"
					action="?/more"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingMore = true;
						return async ({ result }) => {
							loadingMore = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.more as Paged<Bundle> | undefined;
							if (next) bundles = appendPage(bundles, next, bundleKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={bundles.cursor} />
					<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more bundles
					</Button>
				</form>
			{/if}
		{/if}
	</div>
</Page>
