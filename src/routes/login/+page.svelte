<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, AuthShell, Button, Field, Input } from '$lib/components';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Sign in — LMS</title></svelte:head>

<AuthShell
	title="Sign in"
	subtitle="Continue where you left off."
	pitch="Missing account, wrong password, and suspended membership are one error, in constant time. Signing in tells an attacker nothing."
	attribution="How this system handles credentials"
>
	{#if form?.message}
		<!--
			`role="alert"` so a screen reader announces the failure without moving
			focus, which would take the reader out of the field they were fixing.
		-->
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<form
		method="POST"
		class="mt-8 space-y-5"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<Field id="email" label="Email">
			{#snippet children({ id, describedBy, invalid })}
				<Input
					{id}
					name="email"
					type="email"
					autocomplete="email"
					required
					aria-describedby={describedBy}
					{invalid}
					value={form?.email ?? ''}
				/>
			{/snippet}
		</Field>

		<Field id="password" label="Password">
			{#snippet children({ id, describedBy, invalid })}
				<Input
					{id}
					name="password"
					type="password"
					autocomplete="current-password"
					required
					aria-describedby={describedBy}
					{invalid}
				/>
			{/snippet}
		</Field>

		<Button type="submit" size="lg" class="w-full" loading={submitting}>
			{submitting ? 'Signing in…' : 'Sign in'}
		</Button>
	</form>

	{#snippet footer()}
		<p>
			<a class="underline underline-offset-4 hover:text-text" href={resolve('/forgot-password')}>
				Forgot your password?
			</a>
		</p>
		<p>
			No account?
			<a class="underline underline-offset-4 hover:text-text" href={resolve('/register')}>
				Create one
			</a>
		</p>
	{/snippet}
</AuthShell>
