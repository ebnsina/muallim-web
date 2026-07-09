<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The action's answer wins over the loaded lesson, so the button flips without
	// waiting for a reload. `form` is undefined until something has been submitted.
	const completed = $derived(form ? Boolean(form.completed) : Boolean(data.lesson.completed_at));

	// Completing a lesson requires an enrolment, so a previewer is shown the
	// content and nothing to press. `access` is the API's word on that, not a
	// guess made from the presence of a session.
	const canComplete = $derived(data.access === 'enrolled');
</script>

<svelte:head><title>{data.lesson.title} — LMS</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-2xl px-6 py-16">
	<p class="text-muted-foreground text-sm">
		<a class="underline" href={resolve(`/courses/${data.slug}`)}>Back to the course</a>
	</p>

	<h1 class="mt-2 text-2xl font-semibold">{data.lesson.title}</h1>

	<p class="text-muted-foreground mt-1 text-xs uppercase">
		{data.lesson.content_type}{#if data.access === 'preview'}
			· preview{/if}
	</p>

	{#if form?.message}
		<Alert variant="destructive" class="mt-6" role="alert">
			<AlertDescription>{form.message}</AlertDescription>
		</Alert>
	{/if}

	{#if data.lesson.video_url}
		<div class="mt-8">
			{#if data.lesson.video_source === 'youtube' || data.lesson.video_source === 'vimeo' || data.lesson.video_source === 'embed'}
				<iframe
					class="aspect-video w-full rounded-lg border"
					src={data.lesson.video_url}
					title={data.lesson.title}
					allowfullscreen
				></iframe>
			{:else}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video class="aspect-video w-full rounded-lg border" src={data.lesson.video_url} controls
				></video>
			{/if}
		</div>
	{/if}

	{#if data.lesson.content}
		<div class="mt-8 text-pretty whitespace-pre-wrap">{data.lesson.content}</div>
	{:else if !data.lesson.video_url}
		<p class="text-muted-foreground mt-8 text-sm">This lesson has no content yet.</p>
	{/if}

	{#if data.access === 'preview'}
		<Alert class="mt-10">
			<AlertDescription>
				This is a free preview. Enrol on the course to read the rest and to track your progress.
			</AlertDescription>
		</Alert>
	{:else if canComplete}
		<div class="mt-10 flex items-center gap-4">
			<form method="POST" action="?/complete" use:enhance>
				<input type="hidden" name="complete" value={completed ? 'false' : 'true'} />
				<Button type="submit" variant={completed ? 'outline' : 'default'}>
					{completed ? 'Reopen lesson' : 'Mark as complete'}
				</Button>
			</form>

			{#if completed}
				<p class="text-muted-foreground text-sm" role="status">Completed.</p>
			{/if}
		</div>
	{/if}
</main>
