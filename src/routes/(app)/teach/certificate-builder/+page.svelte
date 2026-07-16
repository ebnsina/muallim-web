<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Delete02Icon, PlusSignIcon, Award01Icon } from '@hugeicons/core-free-icons';
	import {
		createDesignSchema,
		DESIGN_LIMITS,
		normalizeLayout,
		type DesignView,
		type Orientation
	} from '$lib/certdesign';
	import {
		Alert,
		Button,
		CertificateCanvas,
		Card,
		EmptyState,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Sheet
	} from '$lib/components';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let creating = $state(false);
	let designOpen = $state(false);

	// The client's check, then the server's. The server's is the one that decides.
	let errors = $state<FieldErrors>({});
	const problem = (field: string) =>
		errors[field] ?? (form && 'errors' in form ? form.errors?.[field] : undefined);

	function layoutOf(design: DesignView) {
		return normalizeLayout(design.layout);
	}
</script>

<svelte:head><title>Certificate builder — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader
		title="Certificate builder"
		description="Design the certificate a learner earns. Drag the pieces where you want them."
	>
		{#snippet actions()}
			<Button size="sm" onclick={() => (designOpen = true)}>
				<Icon icon={PlusSignIcon} class="size-4" />
				New design
			</Button>
		{/snippet}
	</PageHeader>

	{#if form && 'message' in form && form.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	{#if designOpen}
		<form
			method="POST"
			action="?/create"
			class="mt-6"
			use:enhance={validated(
				createDesignSchema,
				(next) => (errors = next),
				() => {
					creating = true;
					return async ({ update, result }) => {
						await update();
						creating = false;
						if (result.type === 'success') designOpen = false;
					};
				}
			)}
		>
			<Sheet open={designOpen} onClose={() => (designOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">New design</h2>
				<p class="mt-0.5 text-sm text-muted">
					Name a certificate design, then open it to lay out the certificate.
				</p>
			{/snippet}

			<Field id="new-design-name" label="Name" error={problem('name')}>
				{#snippet children({ id, describedBy, invalid })}
					<Input
						{id}
						name="name"
						placeholder="Course completion certificate"
						aria-describedby={describedBy}
						{invalid}
						{...DESIGN_LIMITS.name}
					/>
				{/snippet}
			</Field>

			{#snippet footer()}
				<Button type="submit" loading={creating} disabled={creating}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Create design
				</Button>
			{/snippet}
			</Sheet>
		</form>
	{/if}

	{#if data.designs.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Award01Icon}
				title="No certificate designs yet"
				description="Create your first design above, then open it to lay out the certificate."
			/>
		</div>
	{:else}
		<ul class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.designs as design (design.id)}
				<li>
					<Card class="flex h-full flex-col gap-4">
						<a
							href={resolve(`/teach/certificate-builder/${design.id}`)}
							class="block overflow-hidden rounded-md ring-1 ring-[var(--color-border)]"
						>
							<CertificateCanvas
								orientation={design.orientation as Orientation}
								layout={layoutOf(design)}
								accent={design.accent}
								backgroundColor={design.background_color}
								backgroundUrl={design.background_url}
							/>
						</a>
						<div class="flex items-center justify-between gap-3">
							<div class="min-w-0">
								<a
									href={resolve(`/teach/certificate-builder/${design.id}`)}
									class="underline-grow block truncate font-medium"
								>
									{design.name}
								</a>
								<p class="text-muted text-sm capitalize">{design.orientation}</p>
							</div>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={design.id} />
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									aria-label="Delete {design.name}"
									onclick={(e: Event) => {
										if (!confirm(`Delete “${design.name}”? This cannot be undone.`))
											e.preventDefault();
									}}
								>
									<Icon icon={Delete02Icon} class="size-4" />
								</Button>
							</form>
						</div>
					</Card>
				</li>
			{/each}
		</ul>

		{#if data.nextCursor}
			<div class="mt-8 flex justify-center">
				<Button
					variant="secondary"
					href={`${resolve('/teach/certificate-builder')}?cursor=${encodeURIComponent(data.nextCursor)}`}
				>
					Load more
				</Button>
			</div>
		{/if}
	{/if}
</Page>
