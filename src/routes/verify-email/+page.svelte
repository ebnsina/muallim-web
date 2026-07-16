<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Button } from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Confirm your email — Muallim</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-16">
	<h1 class="text-2xl font-semibold">Confirm your email address</h1>

	{#if form?.verified}
		<Alert class="mt-6" role="status">Your email address is confirmed.</Alert>
		<p class="text-muted mt-6 text-sm">
			<a class="underline" href={resolve('/dashboard')}>Go to your dashboard</a>
		</p>
	{:else if !data.token}
		<Alert tone="danger" class="mt-6" role="alert">
			This link isn't complete. Please request a new one.
		</Alert>
	{:else}
		<p class="text-muted mt-2 text-sm">
			Press the button to confirm the address this link was sent to.
		</p>

		{#if form?.message}
			<Alert tone="danger" class="mt-6" role="alert">
				{form.message}
			</Alert>
		{/if}

		<form
			method="POST"
			class="mt-6"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="token" value={data.token} />
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Confirming…' : 'Confirm email address'}
			</Button>
		</form>
	{/if}
</main>
