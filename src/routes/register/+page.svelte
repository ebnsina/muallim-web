<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Button, Input, Label } from '$lib/components';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Create an account — LMS</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-16">
	<h1 class="text-2xl font-semibold">Create an account</h1>
	<p class="text-muted mt-2 text-sm">
		Registration claims an unclaimed workspace. After that, joining is by invitation.
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
		<div class="space-y-2">
			<Label for="name">Name</Label>
			<Input id="name" name="name" autocomplete="name" required value={form?.name ?? ''} />
		</div>

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

		<div class="space-y-2">
			<Label for="password">Password</Label>
			<Input
				id="password"
				name="password"
				type="password"
				autocomplete="new-password"
				minlength={12}
				required
				aria-describedby="password-hint"
			/>
			<p id="password-hint" class="text-muted text-xs">
				At least 12 characters. No mandatory symbols or digits.
			</p>
		</div>

		<Button type="submit" class="w-full" disabled={submitting}>
			{submitting ? 'Creating account…' : 'Create account'}
		</Button>
	</form>

	<p class="text-muted mt-6 text-sm">
		Already have an account? <a class="underline" href={resolve('/login')}>Sign in</a>
	</p>
</main>
