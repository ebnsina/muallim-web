<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Button } from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Hiding the link is a courtesy, not a control: /teach is guarded by lms-api,
	// which answers 403 to a student who types the address.
	const canAuthor = $derived(data.user.role !== 'student');
</script>

<svelte:head><title>Dashboard — Muallim</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-2xl px-6 py-16">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold">{data.user.name}</h1>
			<p class="text-muted mt-1 text-sm">{data.user.email} · {data.user.role}</p>
		</div>

		<div class="flex items-center gap-3">
			{#if canAuthor}
				<Button href={resolve('/teach')} variant="secondary">Teach</Button>
			{/if}

			<form method="POST" action="?/logout" use:enhance>
				<Button type="submit" variant="secondary">Sign out</Button>
			</form>
		</div>
	</div>

	{#if form?.resent}
		<Alert class="mt-8" role="status">
			A new confirmation link is on its way. Any earlier link has stopped working.
		</Alert>
	{:else if form?.message}
		<Alert tone="danger" class="mt-8" role="alert">
			{form.message}
		</Alert>
	{:else if !data.user.email_verified}
		<Alert class="mt-8">
			<div class="flex flex-wrap items-center gap-3">
				<span>Your email address is not confirmed yet.</span>
				<form method="POST" action="?/resendVerification" use:enhance>
					<Button type="submit" variant="secondary" size="sm">Resend the link</Button>
				</form>
			</div>
		</Alert>
	{/if}

	<section class="mt-12">
		<div class="flex items-baseline justify-between gap-3">
			<h2 class="font-medium">Your courses</h2>
			<a class="text-muted text-sm underline" href={resolve('/courses')}>Browse catalog</a>
		</div>

		{#if data.enrolments.length === 0}
			<p class="text-muted mt-4 text-sm">You are not enrolled on anything yet.</p>
		{:else}
			<ul class="mt-4 space-y-3">
				{#each data.enrolments as enrolment (enrolment.course_slug)}
					<li class="flex items-baseline justify-between gap-3 rounded-card border p-4 text-sm">
						<a
							class="font-medium underline-offset-4 hover:underline"
							href={resolve(`/courses/${enrolment.course_slug}`)}
						>
							{enrolment.course_title}
						</a>
						<span class="text-muted shrink-0">
							{enrolment.progress?.percent ?? 0}%
							{#if enrolment.status !== 'active'}· {enrolment.status}{/if}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
