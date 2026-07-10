<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, AuthShell, Button, Field, Input } from '$lib/components';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Create an account — LMS</title></svelte:head>

<AuthShell
	title="Create an account"
	subtitle="This creates the school. Everyone else joins by invitation."
	pitch="Everything you need to teach: lessons, videos, quizzes and marks, in one place your students can reach."
>
	{#if form?.message}
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
		<Field id="name" label="Name">
			{#snippet children({ id, describedBy, invalid })}
				<Input
					{id}
					name="name"
					autocomplete="name"
					required
					aria-describedby={describedBy}
					{invalid}
					value={form?.name ?? ''}
				/>
			{/snippet}
		</Field>

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

		<Field
			id="password"
			label="Password"
			hint="At least 12 characters. No mandatory symbols or digits."
		>
			{#snippet children({ id, describedBy, invalid })}
				<Input
					{id}
					name="password"
					type="password"
					autocomplete="new-password"
					minlength={12}
					required
					aria-describedby={describedBy}
					{invalid}
				/>
			{/snippet}
		</Field>

		<Button type="submit" size="lg" class="w-full" loading={submitting}>
			{submitting ? 'Creating account…' : 'Create account'}
		</Button>
	</form>

	{#snippet footer()}
		<p>
			Already have an account?
			<a class="underline underline-offset-4 hover:text-text" href={resolve('/login')}>Sign in</a>
		</p>
	{/snippet}
</AuthShell>
