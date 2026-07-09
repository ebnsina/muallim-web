<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Dashboard — LMS</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-2xl px-6 py-16">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold">{data.user.name}</h1>
			<p class="text-muted-foreground mt-1 text-sm">{data.user.email} · {data.user.role}</p>
		</div>

		<form method="POST" action="?/logout" use:enhance>
			<Button type="submit" variant="outline">Sign out</Button>
		</form>
	</div>

	{#if form?.resent}
		<Alert class="mt-8" role="status">
			<AlertDescription>
				A new confirmation link is on its way. Any earlier link has stopped working.
			</AlertDescription>
		</Alert>
	{:else if form?.message}
		<Alert variant="destructive" class="mt-8" role="alert">
			<AlertDescription>{form.message}</AlertDescription>
		</Alert>
	{:else if !data.user.email_verified}
		<Alert class="mt-8">
			<AlertDescription class="flex flex-wrap items-center gap-3">
				<span>Your email address is not confirmed yet.</span>
				<form method="POST" action="?/resendVerification" use:enhance>
					<Button type="submit" variant="outline" size="sm">Resend the link</Button>
				</form>
			</AlertDescription>
		</Alert>
	{/if}
</main>
