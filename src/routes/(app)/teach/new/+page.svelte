<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Cancel01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Breadcrumbs,
		Button,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Select,
		Sheet
	} from '$lib/components';
	import AiField from '$lib/components/AiField.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);

	// Bound so the AI assist can read the title as context and write its drafts back.
	// Client state survives an enhanced submit, so it needs no repopulation from `form`.
	let title = $state('');
	let summary = $state('');

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
							<Input {id} {invalid} name="title" required bind:value={title} />
							<AiField
								enabled={data.aiEnabled}
								label="Suggest a title"
								prompt={() =>
									`Write one concise, compelling course title (max 8 words) for a course about: ${title || summary || 'this subject'}. Return only the title.`}
								onaccept={(text) => (title = text.replace(/^["']|["']$/g, ''))}
							/>
						{/snippet}
					</Field>

					<Field id="summary" label="Summary">
						{#snippet children({ id, invalid })}
							<Input {id} {invalid} name="summary" bind:value={summary} />
							<AiField
								enabled={data.aiEnabled}
								label="Draft a summary"
								prompt={() =>
									`Write a one-sentence course summary (max 25 words) that would make a learner want to enrol in a course titled "${title || 'this course'}". Return only the sentence.`}
								onaccept={(text) => (summary = text)}
							/>
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
					<Button href={resolve('/teach')} variant="ghost">
						<Icon icon={Cancel01Icon} class="size-4" />
						Cancel
					</Button>
					<Button type="submit" loading={submitting}>
						<Icon icon={PlusSignIcon} class="size-4" />
						{submitting ? 'Creating…' : 'Create course'}
					</Button>
				{/snippet}
			</Sheet>
		</form>
	</div>
</Page>
