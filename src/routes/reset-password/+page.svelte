<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Button, Input, Label } from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Choose a new password — LMS</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-16">
	<h1 class="text-2xl font-semibold">Choose a new password</h1>

	{#if !data.token}
		<Alert tone="danger" class="mt-6" role="alert">
			This link is missing its token. Request a new one.
		</Alert>
		<p class="text-muted mt-6 text-sm">
			<a class="underline" href={resolve('/forgot-password')}>Request a reset link</a>
		</p>
	{:else}
		<p class="text-muted mt-2 text-sm">
			Setting a new password signs you out everywhere in this workspace.
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
				<Label for="password">New password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					minlength={12}
					required
					aria-describedby="password-hint"
				/>
				<p id="password-hint" class="text-muted text-xs">At least 12 characters.</p>
			</div>

			<div class="space-y-2">
				<Label for="confirm">Confirm new password</Label>
				<Input
					id="confirm"
					name="confirm"
					type="password"
					autocomplete="new-password"
					minlength={12}
					required
				/>
			</div>

			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Saving…' : 'Set new password'}
			</Button>
		</form>
	{/if}
</main>
