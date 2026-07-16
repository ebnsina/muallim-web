<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Delete02Icon, PlusSignIcon, IdIcon } from '@hugeicons/core-free-icons';
	import {
		createTemplateSchema,
		normalizeLayout,
		TEMPLATE_LIMITS,
		type Orientation,
		type TemplateView
	} from '$lib/idcard';
	import {
		Alert,
		Button,
		Card,
		EmptyState,
		Field,
		Icon,
		IDCardCanvas,
		Input,
		Label,
		Page,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let creating = $state(false);
	let createOpen = $state(false);

	// The client's check, then the server's. The server's is the one that decides.
	let errors = $state<FieldErrors>({});
	const problem = (field: string) =>
		errors[field] ?? (form && 'errors' in form ? form.errors?.[field] : undefined);

	function layoutOf(template: TemplateView) {
		return normalizeLayout(template.layout);
	}
</script>

<svelte:head><title>ID cards — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader
		title="ID cards"
		description="Design the ID card your students and staff carry. Drag the pieces where you want them."
	>
		{#snippet actions()}
			<Button size="sm" onclick={() => (createOpen = true)}>
				<Icon icon={PlusSignIcon} class="size-4" />
				New template
			</Button>
		{/snippet}
	</PageHeader>

	{#if form && 'message' in form && form.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	{#if createOpen}
		<form
			method="POST"
			action="?/create"
			class="mt-6"
			use:enhance={validated(
				createTemplateSchema,
				(next) => (errors = next),
				() => {
					creating = true;
					return async ({ update, result }) => {
						await update();
						creating = false;
						if (result.type === 'success') createOpen = false;
					};
				}
			)}
		>
			<Sheet open={createOpen} onClose={() => (createOpen = false)}>
				{#snippet header()}
					<h2 class="font-medium">New template</h2>
					<p class="mt-0.5 text-sm text-muted">
						Name an ID-card template, then open it to lay out the card.
					</p>
				{/snippet}

				<div class="flex flex-col gap-4">
					<Field id="new-template-name" label="Name" error={problem('name')}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								name="name"
								placeholder="Student ID card"
								aria-describedby={describedBy}
								{invalid}
								{...TEMPLATE_LIMITS.name}
							/>
						{/snippet}
					</Field>

					<Field id="new-template-subject" label="For" error={problem('subject')}>
						{#snippet children({ id, describedBy, invalid })}
							<Select {id} name="subject" aria-describedby={describedBy} {invalid}>
								<option value="student">Students</option>
								<option value="staff">Staff</option>
							</Select>
						{/snippet}
					</Field>

					<Field id="new-template-orientation" label="Orientation" error={problem('orientation')}>
						{#snippet children({ id, describedBy, invalid })}
							<Select {id} name="orientation" aria-describedby={describedBy} {invalid}>
								<option value="portrait">Portrait</option>
								<option value="landscape">Landscape</option>
							</Select>
						{/snippet}
					</Field>
				</div>

				{#snippet footer()}
					<Button type="submit" loading={creating} disabled={creating}>
						<Icon icon={PlusSignIcon} class="size-4" />
						Create template
					</Button>
				{/snippet}
			</Sheet>
		</form>
	{/if}

	{#if data.templates.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={IdIcon}
				title="No ID-card templates yet"
				description="Create your first template above, then open it to lay out the card."
			/>
		</div>
	{:else}
		<ul class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.templates as template (template.id)}
				<li>
					<Card class="flex h-full flex-col gap-4">
						<a
							href={resolve(`/teach/id-cards/${template.id}`)}
							class="mx-auto block w-full max-w-[240px] overflow-hidden rounded-xl ring-1 ring-[var(--color-border)]"
						>
							<IDCardCanvas
								orientation={template.orientation as Orientation}
								layout={layoutOf(template)}
								accent={template.accent}
								backgroundColor={template.background_color}
								backgroundUrl={template.background_url}
							/>
						</a>
						<div class="flex items-center justify-between gap-3">
							<div class="min-w-0">
								<a
									href={resolve(`/teach/id-cards/${template.id}`)}
									class="underline-grow block truncate font-medium"
								>
									{template.name}
								</a>
								<p class="text-muted text-sm capitalize">
									{template.subject} · {template.orientation}
								</p>
							</div>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={template.id} />
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									aria-label="Delete {template.name}"
									onclick={(e: Event) => {
										if (!confirm(`Delete “${template.name}”? This cannot be undone.`))
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
					href={`${resolve('/teach/id-cards')}?cursor=${encodeURIComponent(data.nextCursor)}`}
				>
					Load more
				</Button>
			</div>
		{/if}
	{/if}
</Page>
