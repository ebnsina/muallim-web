<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Reset your password — LMS</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-16">
	<h1 class="text-2xl font-semibold">Reset your password</h1>

	{#if form?.sent}
		<!--
			Deliberately says nothing about whether the address has an account. The API
			answers the same way for both, and a page that says "we sent you a link" in
			one case and "no such account" in the other hands out a roster.
		-->
		<Alert class="mt-6" role="status">
			<AlertDescription>
				If that address belongs to an account here, a reset link is on its way. The link expires in
				an hour and works once.
			</AlertDescription>
		</Alert>

		<p class="text-muted-foreground mt-6 text-sm">
			<a class="underline" href={resolve('/login')}>Back to sign in</a>
		</p>
	{:else}
		<p class="text-muted-foreground mt-2 text-sm">
			Enter your email address and we will send you a link to choose a new password.
		</p>

		{#if form?.message}
			<Alert variant="destructive" class="mt-6" role="alert">
				<AlertDescription>{form.message}</AlertDescription>
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
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
				/>
			</div>

			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Sending…' : 'Send reset link'}
			</Button>
		</form>

		<p class="text-muted-foreground mt-6 text-sm">
			<a class="underline" href={resolve('/login')}>Back to sign in</a>
		</p>
	{/if}
</main>
