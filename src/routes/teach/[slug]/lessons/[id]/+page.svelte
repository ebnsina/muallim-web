<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The selects drive which fields are shown, so their current value is state.
	// Initialising that state straight from `data` would capture only the first
	// lesson's value and keep it after navigating to another one. An override that
	// falls back to the loaded lesson resets itself whenever `data` changes.
	let typeOverride = $state<string | null>(null);
	let sourceOverride = $state<string | null>(null);

	const contentType = $derived(typeOverride ?? data.lesson.content_type);
	const videoSource = $derived(sourceOverride ?? data.lesson.video_source);

	let submitting = $state(false);

	const selectClass = 'border-input bg-background h-9 w-full rounded-md border px-3 text-sm';
</script>

<svelte:head><title>{data.lesson.title} — Teach</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-2xl px-6 py-16">
	<p class="text-muted-foreground text-sm">
		<a class="underline" href={resolve(`/teach/${data.slug}`)}>Back to the curriculum</a>
	</p>

	<h1 class="mt-2 text-2xl font-semibold">Edit lesson</h1>

	{#if form?.message}
		<Alert variant="destructive" class="mt-6" role="alert">
			<AlertDescription>{form.message}</AlertDescription>
		</Alert>
	{/if}

	<form
		method="POST"
		class="mt-8 space-y-4"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<div class="space-y-2">
			<Label for="title">Title</Label>
			<Input id="title" name="title" value={data.lesson.title} required />
		</div>

		<div class="space-y-2">
			<Label for="content_type">Type</Label>
			<select
				id="content_type"
				name="content_type"
				value={contentType}
				onchange={(e) => (typeOverride = e.currentTarget.value)}
				class={selectClass}
			>
				{#each ['text', 'video', 'quiz', 'assignment', 'live', 'scorm', 'h5p'] as type (type)}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>

		<div class="space-y-2">
			<Label for="content">Content</Label>
			<textarea
				id="content"
				name="content"
				rows="10"
				class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
				>{data.lesson.content ?? ''}</textarea
			>
		</div>

		{#if contentType === 'video'}
			<div class="space-y-2">
				<Label for="video_source">Video source</Label>
				<select
					id="video_source"
					name="video_source"
					value={videoSource}
					onchange={(e) => (sourceOverride = e.currentTarget.value)}
					class={selectClass}
				>
					{#each ['none', 'youtube', 'vimeo', 'embed', 'hosted'] as source (source)}
						<option value={source}>{source}</option>
					{/each}
				</select>
			</div>

			{#if videoSource !== 'none'}
				<div class="space-y-2">
					<Label for="video_url">Video URL</Label>
					<Input id="video_url" name="video_url" type="url" value={data.lesson.video_url ?? ''} />
				</div>
			{/if}
		{:else}
			<!-- Kept in the payload so switching type away from video clears the source. -->
			<input type="hidden" name="video_source" value="none" />
		{/if}

		<div class="space-y-2">
			<Label for="duration_seconds">Duration (seconds)</Label>
			<Input
				id="duration_seconds"
				name="duration_seconds"
				type="number"
				min="0"
				step="1"
				value={data.lesson.duration_seconds ?? 0}
			/>
		</div>

		<div class="flex items-center gap-2">
			<input
				id="is_preview"
				name="is_preview"
				type="checkbox"
				checked={data.lesson.is_preview}
				class="size-4"
			/>
			<Label for="is_preview">Free preview — readable without enrolling</Label>
		</div>

		<Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save lesson'}</Button>
	</form>
</main>
