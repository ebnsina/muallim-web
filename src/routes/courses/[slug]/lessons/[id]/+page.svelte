<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Button } from '$lib/components';
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

<svelte:head><title>{data.lesson.title} — Muallim</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-2xl px-6 py-16">
	<p class="text-muted text-sm">
		<a class="underline" href={resolve(`/courses/${data.slug}`)}>Back to the course</a>
	</p>

	<h1 class="mt-2 text-2xl font-semibold">{data.lesson.title}</h1>

	<p class="text-muted mt-1 text-xs uppercase">
		{data.lesson.content_type}{#if data.access === 'preview'}
			· preview{/if}
	</p>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{/if}

	<!--
		`video_embed_url`, never `video_url`. The first is a player the API built from
		a video id it recognised, on a host it allows, over https. The second is a
		string an author typed, and framing it would run their page on this origin for
		every reader of the lesson.

		Every source is a frame: YouTube, Vimeo, an allowed embed, and Cloudflare
		Stream all ship their own player, so there is nothing to branch on.
	-->
	{#if data.lesson.video_embed_url}
		<div class="mt-8">
			<iframe
				class="aspect-video w-full rounded-card border"
				src={data.lesson.video_embed_url}
				title={data.lesson.title}
				allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			></iframe>
		</div>
	{/if}

	{#if data.lesson.content}
		<div class="mt-8 text-pretty whitespace-pre-wrap">{data.lesson.content}</div>
	{:else if !data.lesson.video_embed_url}
		<p class="text-muted mt-8 text-sm">This lesson has no content yet.</p>
	{/if}

	<!--
		A quiz lesson's body is its quiz. The link is shown to anyone who can read the
		lesson; whether they may *take* it is lms-api's decision, made when they try.
	-->
	{#if data.lesson.content_type === 'quiz'}
		<div class="mt-8">
			<Button href={resolve(`/courses/${data.slug}/lessons/${data.lesson.id}/quiz`)}>
				Go to the quiz
			</Button>
		</div>
	{/if}

	{#if data.access === 'preview'}
		<Alert class="mt-10">
			This is a free preview. Enrol on the course to read the rest and to track your progress.
		</Alert>
	{:else if canComplete}
		<div class="mt-10 flex items-center gap-4">
			<form method="POST" action="?/complete" use:enhance>
				<input type="hidden" name="complete" value={completed ? 'false' : 'true'} />
				<Button type="submit" variant={completed ? 'secondary' : 'primary'}>
					{completed ? 'Reopen lesson' : 'Mark as complete'}
				</Button>
			</form>

			{#if completed}
				<p class="text-muted text-sm" role="status">Completed.</p>
			{/if}
		</div>
	{/if}
</main>
