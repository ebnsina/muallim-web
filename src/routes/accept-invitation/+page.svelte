<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Button, Input, Label } from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Accept your invitation — Muallim</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-16">
	<h1 class="text-2xl font-semibold">Accept your invitation</h1>

	{#if !data.token}
		<Alert tone="danger" class="mt-6" role="alert">
			This invitation link isn't complete. Please ask for a new invitation.
		</Alert>
	{:else}
		<p class="text-muted mt-2 text-sm">
			If you already have an account, enter its existing password. Otherwise, choose one now.
		</p>

		{#if form?.message}
			<Alert tone="danger" class="mt-6" role="alert">
				{form.message}
			</Alert>
		{/if}

		<form
			method="POST"
			class="mt-6 space-y-4"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="token" value={data.token} />

			<div class="space-y-2">
				<Label for="name">Name</Label>
				<Input
					id="name"
					name="name"
					autocomplete="name"
					required
					value={form?.name ?? ''}
					aria-describedby="name-hint"
				/>
				<p id="name-hint" class="text-muted text-xs">Ignored if you already have an account.</p>
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					minlength={12}
					required
				/>
			</div>

			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Joining…' : 'Accept invitation'}
			</Button>
		</form>

		<p class="text-muted mt-6 text-sm">
			<a class="underline" href={resolve('/login')}>Back to sign in</a>
		</p>
	{/if}
</main>
