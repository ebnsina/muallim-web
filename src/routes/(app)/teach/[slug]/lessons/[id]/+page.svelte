<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Button, Checkbox, Input, Label, Select, Textarea } from '$lib/components';
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

	/**
	 * `datetime-local` wants `YYYY-MM-DDTHH:mm` in the browser's own zone, and the
	 * API speaks RFC 3339 in UTC. Rendering the UTC string straight into the input
	 * shows the author a time an hour or twelve from the one they set.
	 */
	function localDateTime(iso: string | null): string {
		if (!iso) return '';

		const when = new Date(iso);
		const offset = when.getTimezoneOffset() * 60_000;
		return new Date(when.getTime() - offset).toISOString().slice(0, 16);
	}
</script>

<svelte:head><title>{data.lesson.title} — Teach</title></svelte:head>

<main class="mx-auto max-w-2xl px-6 py-16">
	<p class="text-muted text-sm">
		<a class="underline" href={resolve(`/teach/${data.slug}`)}>Back to the curriculum</a>
	</p>

	<h1 class="mt-2 text-2xl font-semibold">Edit lesson</h1>

	<p class="mt-2 flex gap-4 text-sm">
		<a class="underline" href={resolve(`/teach/${data.slug}/lessons/${data.lesson.id}/quiz`)}>
			Quiz and marking
		</a>
		<a class="underline" href={resolve(`/teach/${data.slug}/lessons/${data.lesson.id}/assignment`)}>
			Assignment
		</a>
	</p>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
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
			<Select
				id="content_type"
				name="content_type"
				value={contentType}
				onchange={(e) => (typeOverride = e.currentTarget.value)}
			>
				{#each ['text', 'video', 'quiz', 'assignment', 'live', 'scorm', 'h5p'] as type (type)}
					<option value={type}>{type}</option>
				{/each}
			</Select>
		</div>

		<div class="space-y-2">
			<Label for="content">Content</Label>
			<Textarea id="content" name="content" rows={10} value={data.lesson.content ?? ''} />
		</div>

		{#if contentType === 'video'}
			<div class="space-y-2">
				<Label for="video_source">Video source</Label>
				<Select
					id="video_source"
					name="video_source"
					value={videoSource}
					onchange={(e) => (sourceOverride = e.currentTarget.value)}
				>
					{#each ['none', 'youtube', 'vimeo', 'embed', 'hosted'] as source (source)}
						<option value={source}>{source}</option>
					{/each}
				</Select>
			</div>

			{#if videoSource !== 'none'}
				<div class="space-y-2">
					<Label for="video_url">{videoSource === 'hosted' ? 'Video ID' : 'Video URL'}</Label>
					<!--
						Deliberately not `type="url"`: a Cloudflare Stream reference is a bare id,
						and the browser would refuse to submit it. The API decides what is valid
						here — it is the only thing that knows which hosts this workspace embeds.
					-->
					<Input
						id="video_url"
						name="video_url"
						value={data.lesson.video_url ?? ''}
						aria-describedby="video-url-hint"
					/>
					<p id="video-url-hint" class="text-muted text-xs">
						{#if videoSource === 'youtube'}
							Paste any YouTube link. The player is built from the video id, on the no-cookie
							domain.
						{:else if videoSource === 'vimeo'}
							Paste any Vimeo link.
						{:else if videoSource === 'hosted'}
							The Cloudflare Stream video id, or the URL you copied from the dashboard.
						{:else}
							An https:// player URL, on a host this workspace allows.
						{/if}
					</p>
				</div>
			{/if}
		{:else}
			<!-- Kept in the payload so switching type away from video clears the source. -->
			<input type="hidden" name="video_source" value="none" />
		{/if}

		<!--
			The release schedule, shown only in the mode that reads it. A preview lesson
			is never held back, so it is never scheduled.
		-->
		<input type="hidden" name="drip_mode" value={data.dripMode} />

		{#if data.dripMode === 'scheduled'}
			<div class="space-y-2">
				<Label for="available_at">Opens on</Label>
				<Input
					id="available_at"
					name="available_at"
					type="datetime-local"
					value={localDateTime(data.availableAt)}
					aria-describedby="available-at-hint"
				/>
				<p id="available-at-hint" class="text-muted text-xs">
					The same instant for every learner. Leave blank to keep the current date.
				</p>
			</div>
		{:else if data.dripMode === 'after_enrolment'}
			<div class="space-y-2">
				<Label for="available_after_days">Opens this many days after enrolling</Label>
				<Input
					id="available_after_days"
					name="available_after_days"
					type="number"
					min="0"
					step="1"
					value={data.availableAfterDays ?? ''}
					aria-describedby="after-days-hint"
				/>
				<p id="after-days-hint" class="text-muted text-xs">
					Counted from each learner's own enrolment, so they see different dates.
				</p>
			</div>
		{:else if data.dripMode === 'sequential'}
			<p class="text-muted text-sm">
				This course releases one lesson at a time. This lesson opens when the learner has finished
				every lesson before it — there is nothing to schedule.
			</p>
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
			<Checkbox id="is_preview" name="is_preview" checked={data.lesson.is_preview} />
			<Label for="is_preview">Free preview — readable without enrolling</Label>
		</div>

		<Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save lesson'}</Button>
	</form>
</main>
