<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Layers01Icon,
		Calendar03Icon,
		Delete02Icon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
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
	import { BLUEPRINT_LIMITS, blueprintSchema } from '$lib/coursebuild';
	import { validated, type FieldErrors } from '$lib/validation';
	import { toast } from '$lib/toast.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let creating = $state(false);
	let blueprintOpen = $state(false);
	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const crumbs = [{ label: 'Teach', href: resolve('/teach') }, { label: 'Course Builder' }];

	// A blueprint's structure is opaque JSON; count its modules without trusting the shape.
	function moduleCount(structure: unknown): number {
		return Array.isArray(structure) ? structure.length : 0;
	}

	const dateFmt = new Intl.DateTimeFormat('en', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
	const formatted = (iso: string) => dateFmt.format(new Date(iso));

	$effect(() => {
		if (form?.message) toast.danger(form.message);
	});
</script>

<svelte:head><title>Course Builder — Muallim</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<PageHeader
		class="mt-4"
		title="Course Builder"
		description="Design a course as modules and lessons — drag to arrange it, then save the plan."
	>
		{#snippet actions()}
			<Button size="sm" onclick={() => (blueprintOpen = true)}>
				<Icon icon={PlusSignIcon} class="size-4" />
				New blueprint
			</Button>
		{/snippet}
	</PageHeader>

	{#if data.loadError}
		<Alert tone="danger" class="mt-6" role="alert">{data.loadError}</Alert>
	{/if}

	<div class="mt-8">
		<!-- The list -->
		<section class="min-w-0">
			<h2 class="text-sm font-semibold text-muted">Your course plans</h2>

			{#if data.blueprints.length === 0}
				<div class="mt-4">
					<EmptyState
						icon={Layers01Icon}
						title="No course plans yet"
						description="Create one with the button above, then open it to build out its modules and lessons."
					/>
				</div>
			{:else}
				<ul class="mt-4 space-y-3">
					{#each data.blueprints as bp (bp.id)}
						<li>
							<Card class="p-4 sm:p-5">
								<div class="flex items-start justify-between gap-4">
									<div class="min-w-0">
										<a
											href={resolve(`/teach/course-builder/${bp.id}`)}
											class="underline-grow block truncate font-semibold"
										>
											{bp.name}
										</a>
										{#if bp.description}
											<p class="mt-1 line-clamp-2 text-sm text-muted">{bp.description}</p>
										{/if}
										<div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
											<Badge tone="neutral" icon={Layers01Icon}>
												{moduleCount(bp.structure)} modules
											</Badge>
											<span class="inline-flex items-center gap-1">
												<Icon icon={Calendar03Icon} class="size-3.5" />
												Updated {formatted(bp.updated_at)}
											</span>
										</div>
									</div>

									<div class="flex shrink-0 items-center gap-2">
										<Button
											href={resolve(`/teach/course-builder/${bp.id}`)}
											variant="secondary"
											size="sm"
										>
											Open
										</Button>
										<form
											method="POST"
											action="?/delete"
											use:enhance={() => {
												return async ({ update, result }) => {
													await update();
													if (result.type === 'success') toast.success('Course plan deleted.');
												};
											}}
										>
											<input type="hidden" name="id" value={bp.id} />
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												aria-label="Delete course plan"
												onclick={(e) => {
													if (!confirm(`Delete “${bp.name}”? This cannot be undone.`))
														e.preventDefault();
												}}
											>
												<Icon icon={Delete02Icon} class="text-danger-text" />
											</Button>
										</form>
									</div>
								</div>
							</Card>
						</li>
					{/each}
				</ul>

				{#if data.nextCursor}
					<div class="mt-6 flex justify-center">
						<Button
							href="?cursor={encodeURIComponent(data.nextCursor)}"
							variant="secondary"
							size="sm"
						>
							Load more
						</Button>
					</div>
				{/if}
			{/if}
		</section>

		<!-- Create -->
		{#if blueprintOpen}
			<form
				method="POST"
				action="?/create"
				use:enhance={validated(
					blueprintSchema,
					(next) => (errors = next),
					() => {
						creating = true;
						return async ({ update, result }) => {
							await update();
							creating = false;
							if (result.type === 'success') blueprintOpen = false;
						};
					}
				)}
			>
				<Sheet open={blueprintOpen} onClose={() => (blueprintOpen = false)}>
					{#snippet header()}
						<h2 class="font-semibold">New course plan</h2>
					{/snippet}

					<div class="space-y-5">
						<Field id="bp-name" label="Name" error={problem('name')}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									name="name"
									aria-describedby={describedBy}
									{invalid}
									placeholder="e.g. Tajweed for beginners"
									required
									maxlength={BLUEPRINT_LIMITS.name.maxlength}
								/>
							{/snippet}
						</Field>

						<Field
							id="bp-description"
							label="Description"
							hint="Optional. A line on what this course covers."
							error={problem('description')}
						>
							{#snippet children({ id, describedBy, invalid })}
								<Textarea
									{id}
									name="description"
									aria-describedby={describedBy}
									{invalid}
									rows={3}
									maxlength={BLUEPRINT_LIMITS.description.maxlength}
								/>
							{/snippet}
						</Field>
					</div>

					{#snippet footer()}
						<Button type="submit" loading={creating}>
							<Icon icon={PlusSignIcon} />
							Create blueprint
						</Button>
					{/snippet}
				</Sheet>
			</form>
		{/if}
	</div>
</Page>
