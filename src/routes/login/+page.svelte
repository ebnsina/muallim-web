<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, AuthShell, Button, Field, Input } from '$lib/components';
	import DemoAccounts from '$lib/dev/DemoAccounts.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);

	/*
		The fields are state so that something other than a person can fill them.

		Seeded from `form.email`, which is what the server echoes back after a failed
		submit — the address survives, the password never does. `$state` and not
		`$derived`: the moment the reader types, the field is theirs.
	*/
	// svelte-ignore state_referenced_locally
	let email = $state(form?.email ?? '');
	let password = $state('');
</script>

<svelte:head><title>Sign in — Muallim</title></svelte:head>

<AuthShell
	title="Sign in"
	subtitle="Continue where you left off."
	pitch="Pick up exactly where you stopped. The lesson you were reading, the quiz you half-finished, and every mark you have earned are waiting."
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
					bind:value={email}
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
					bind:value={password}
				/>
			{/snippet}
		</Field>

		<Button type="submit" size="lg" class="w-full" loading={submitting}>
			{submitting ? 'Signing in…' : 'Sign in'}
		</Button>
	</form>

	<!--
		The loader sends these only in development, so production renders nothing here
		and the response carries no password. The guard is the empty list, not this
		`{#if}`: the accounts live under `$lib/server`, which the client bundle cannot
		import at all.
	-->
	{#if data.demoAccounts.length > 0}
		<DemoAccounts
			accounts={data.demoAccounts}
			onpick={(account) => {
				email = account.email;
				password = account.password;
			}}
		/>
	{/if}

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
