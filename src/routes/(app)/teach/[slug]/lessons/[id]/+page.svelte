<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import { FloppyDiskIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Breadcrumbs,
		Button,
		Checkbox,
		Field,
		Icon,
		Input,
		Label,
		Page,
		PageHeader,
		Select,
		Sheet,
		Textarea
	} from '$lib/components';
	import AiField from '$lib/components/AiField.svelte';
	import { teachTrail } from '$lib/breadcrumbs';
	import { DURATION, easeOut } from '$lib/motion';
	import { LIMITS, lessonEditSchema } from '$lib/schemas';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const crumbs = $derived(
		teachTrail(data.slug, data.course.title, data.lesson.id, data.lesson.title)
	);

	// The API's tokens, said in the words a reader expects — including the two that
	// are initialisms, which a plain capitalise would get wrong.
	const CONTENT_TYPES = [
		{ value: 'text', label: 'Text' },
		{ value: 'video', label: 'Video' },
		{ value: 'quiz', label: 'Quiz' },
		{ value: 'assignment', label: 'Assignment' },
		{ value: 'live', label: 'Live session' },
		{ value: 'scorm', label: 'SCORM' },
		{ value: 'h5p', label: 'H5P' }
	];
	const VIDEO_SOURCES = [
		{ value: 'none', label: 'None' },
		{ value: 'youtube', label: 'YouTube' },
		{ value: 'vimeo', label: 'Vimeo' },
		{ value: 'embed', label: 'Embed' },
		{ value: 'hosted', label: 'Hosted' }
	];

	// The selects drive which fields are shown, so their current value is state.
	// Initialising that state straight from `data` would capture only the first
	// lesson's value and keep it after navigating to another one. An override that
	// falls back to the loaded lesson resets itself whenever `data` changes.
	let typeOverride = $state<string | null>(null);
	let sourceOverride = $state<string | null>(null);

	const contentType = $derived(typeOverride ?? data.lesson.content_type);
	const videoSource = $derived(sourceOverride ?? data.lesson.video_source);

	// The content is controlled so the AI draft can write into it; it re-seeds only
	// when the lesson itself changes (navigation), never on a re-render mid-edit.
	let content = $state('');
	let loadedId = $state('');
	$effect(() => {
		if (data.lesson.id !== loadedId) {
			loadedId = data.lesson.id;
			content = data.lesson.content ?? '';
		}
	});

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

<Page>
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title="Edit lesson">
		{#snippet actions()}
			<Button
				href={resolve(`/teach/${data.slug}/lessons/${data.lesson.id}/quiz`)}
				variant="secondary"
				size="sm"
			>
				Quiz and marking
			</Button>
			<Button
				href={resolve(`/teach/${data.slug}/lessons/${data.lesson.id}/assignment`)}
				variant="secondary"
				size="sm"
			>
				Assignment
			</Button>
		{/snippet}
	</PageHeader>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{/if}

	<form
		method="POST"
		class="mt-8"
		use:enhance={validated(
			lessonEditSchema,
			(next) => (errors = next),
			() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}
		)}
	>
		<Sheet>
			<div class="space-y-4">
				<Field id="title" label="Title" error={problem('title')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="title"
							value={data.lesson.title}
							{...LIMITS.lessonTitle}
							aria-describedby={describedBy}
						/>
					{/snippet}
				</Field>

				<div class="space-y-2">
					<Label for="content_type">Type</Label>
					<Select
						id="content_type"
						name="content_type"
						value={contentType}
						onchange={(e) => (typeOverride = e.currentTarget.value)}
					>
						{#each CONTENT_TYPES as type (type.value)}
							<option value={type.value}>{type.label}</option>
						{/each}
					</Select>
				</div>

				<div class="space-y-2">
					<Label for="content">Content</Label>
					<Textarea
						id="content"
						name="content"
						rows={10}
						{...LIMITS.lessonContent}
						bind:value={content}
					/>
					<AiField
						enabled={data.aiEnabled}
						label="Draft this lesson"
						prompt={() =>
							`Write the body of a short lesson titled "${data.lesson.title}"${data.courseTitle ? ` for a course on ${data.courseTitle}` : ''}. Two to four clear paragraphs a learner can follow. Plain text, no headings.`}
						onaccept={(text) => (content = text)}
					/>
				</div>

				{#if contentType === 'video'}
					<!-- The type select adds fields under itself, and a field that appears in one
					     frame throws everything below it down the page. It grows instead. -->
					<div class="space-y-2" transition:slide={{ duration: DURATION.base, easing: easeOut }}>
						<Label for="video_source">Video source</Label>
						<Select
							id="video_source"
							name="video_source"
							value={videoSource}
							onchange={(e) => (sourceOverride = e.currentTarget.value)}
						>
							{#each VIDEO_SOURCES as source (source.value)}
								<option value={source.value}>{source.label}</option>
							{/each}
						</Select>
					</div>

					{#if videoSource !== 'none'}
						<div class="space-y-2" transition:slide={{ duration: DURATION.base, easing: easeOut }}>
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
								{...LIMITS.videoUrl}
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
					<Field
						id="available_at"
						label="Opens on"
						error={problem('available_at')}
						hint="The same instant for every learner. Leave blank to keep the current date."
					>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="available_at"
								{...LIMITS.releaseDate}
								value={localDateTime(data.availableAt)}
								aria-describedby={describedBy}
							/>
						{/snippet}
					</Field>
				{:else if data.dripMode === 'after_enrolment'}
					<Field
						id="available_after_days"
						label="Opens this many days after enrolling"
						error={problem('available_after_days')}
						hint="Counted from each learner's own enrollment, so they see different dates."
					>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="available_after_days"
								{...LIMITS.dripDays}
								value={data.availableAfterDays ?? ''}
								aria-describedby={describedBy}
							/>
						{/snippet}
					</Field>
				{:else if data.dripMode === 'sequential'}
					<p class="text-muted text-sm">
						This course releases one lesson at a time. This lesson opens when the learner has
						finished every lesson before it — there is nothing to schedule.
					</p>
				{/if}

				<Field id="duration_seconds" label="Duration (seconds)" error={problem('duration_seconds')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="duration_seconds"
							{...LIMITS.durationSeconds}
							value={data.lesson.duration_seconds ?? 0}
							aria-describedby={describedBy}
						/>
					{/snippet}
				</Field>

				<div class="flex items-center gap-2">
					<Checkbox id="is_preview" name="is_preview" checked={data.lesson.is_preview} />
					<Label for="is_preview">Free preview — readable without enrolling</Label>
				</div>
			</div>

			{#snippet footer()}
				<Button type="submit" disabled={submitting}>
					<Icon icon={FloppyDiskIcon} class="size-4" />
					{submitting ? 'Saving…' : 'Save lesson'}
				</Button>
			{/snippet}
		</Sheet>
	</form>
</Page>
