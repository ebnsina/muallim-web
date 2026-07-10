<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Alert,
		Breadcrumbs,
		Button,
		Field,
		Input,
		Page,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);

	const crumbs = [{ label: 'Teach', href: resolve('/teach') }, { label: 'New course' }];

	const DIFFICULTIES = [
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
		{ value: 'expert', label: 'Expert' }
	];
</script>

<svelte:head><title>New course — Muallim</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} />

	<PageHeader
		class="mt-4"
		title="New course"
		description="It stays a draft until you publish it."
	/>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<div class="mt-6 max-w-2xl">
		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<Sheet>
				<div class="space-y-5">
					<Field id="title" label="Title">
						{#snippet children({ id, invalid })}
							<Input {id} {invalid} name="title" required value={form?.title ?? ''} />
						{/snippet}
					</Field>

					<Field id="summary" label="Summary">
						{#snippet children({ id, invalid })}
							<Input {id} {invalid} name="summary" value={form?.summary ?? ''} />
						{/snippet}
					</Field>

					<Field id="difficulty" label="Difficulty">
						{#snippet children({ id, invalid })}
							<Select {id} {invalid} name="difficulty">
								{#each DIFFICULTIES as difficulty (difficulty.value)}
									<option value={difficulty.value}>{difficulty.label}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>
				</div>

				{#snippet footer()}
					<Button href={resolve('/teach')} variant="ghost">Cancel</Button>
					<Button type="submit" loading={submitting}>
						{submitting ? 'Creating…' : 'Create course'}
					</Button>
				{/snippet}
			</Sheet>
		</form>
	</div>
</Page>
