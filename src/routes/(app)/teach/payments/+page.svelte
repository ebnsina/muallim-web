<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Alert02Icon,
		CheckmarkCircle02Icon,
		CreditCardIcon,
		FloppyDiskIcon,
		Key01Icon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Card,
		Field,
		Icon,
		Input,
		Page,
		PageHeader
	} from '$lib/components';
	import { bkashSchema, LIMITS, sslcommerzSchema } from '$lib/schemas';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $state<Record<string, FieldErrors>>({});
	const setErrors = (scope: string) => (next: FieldErrors) => {
		errors = { ...errors, [scope]: next };
	};

	// The client's check, then the server's. The server's is the one that decides.
	const problem = (scope: string, field: string) =>
		(form?.scope === scope ? form?.errors?.[field] : undefined) ?? errors[scope]?.[field];

	const at = (gateway: string) => data.accounts.find((a) => a.gateway === gateway);

	const stripe = $derived(at('stripe'));
	const sslcommerz = $derived(at('sslcommerz'));
	const bkash = $derived(at('bkash'));
	const fake = $derived(at('fake'));

	$effect(() => {
		if (form?.saved) toast.success('Saved. These are locked away, and won’t be shown again.');
	});
</script>

<svelte:head><title>Payments — Muallim</title></svelte:head>

{#snippet status(entry: (typeof data.accounts)[number] | undefined)}
	{#if !entry || entry.unavailable}
		<Badge tone="neutral" icon={Alert02Icon}>Unavailable</Badge>
	{:else if entry.account?.ready}
		<Badge tone="success" icon={CheckmarkCircle02Icon}>Connected</Badge>
	{:else if entry.account}
		<Badge tone="warning" icon={Alert02Icon}>{entry.account.status}</Badge>
	{:else}
		<Badge tone="neutral">Not connected</Badge>
	{/if}
{/snippet}

<Page width="wide">
	<PageHeader title="Payments" description="The ways this workspace can take money.">
		{#snippet actions()}
			<Button href={resolve('/teach/sales')} variant="secondary" size="sm">Sales</Button>
		{/snippet}
	</PageHeader>

	<Alert tone="info" class="mt-6" title="The money is yours">
		A learner pays this workspace's own account directly. Muallim never holds the money — it takes a
		fee, and the tax, the refunds and the disputes stay yours. Anything secret you type here is
		locked away before it is saved, and nobody can read it back afterwards — not us, and not anyone
		who gets into your account.
	</Alert>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<div class="mt-8 space-y-5">
		<!-- ---------------------------------------------------------------- Stripe -->
		<Card float>
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 class="flex items-center gap-2 font-medium">
						<Icon icon={CreditCardIcon} class="text-muted size-4" />
						Stripe
					</h2>
					<p class="text-muted mt-1 max-w-prose text-sm">
						Cards, worldwide. No keys are typed here: Stripe onboards you on its own pages and pays
						your account directly.
					</p>
				</div>
				{@render status(stripe)}
			</div>

			{#if stripe?.unavailable}
				<p class="text-muted mt-4 text-sm">{stripe.unavailable}</p>
			{:else}
				<form method="POST" action="?/connect" class="mt-4" use:enhance>
					<input type="hidden" name="gateway" value="stripe" />
					<Button type="submit" variant="secondary" size="sm">
						<Icon icon={CreditCardIcon} class="size-4" />
						{stripe?.account ? 'Continue onboarding' : 'Connect Stripe'}
					</Button>
				</form>
			{/if}
		</Card>

		<!-- ----------------------------------------------------------- SSLCommerz -->
		<Card float>
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 class="flex items-center gap-2 font-medium">
						<Icon icon={Key01Icon} class="text-muted size-4" />
						SSLCommerz
					</h2>
					<p class="text-muted mt-1 max-w-prose text-sm">
						Cards and mobile wallets in Bangladesh. Give your store id and store password; they go
						to SSLCommerz and nowhere else.
					</p>
				</div>
				{@render status(sslcommerz)}
			</div>

			{#if sslcommerz?.unavailable}
				<p class="text-muted mt-4 text-sm">{sslcommerz.unavailable}</p>
			{:else}
				<form
					method="POST"
					action="?/sslcommerz"
					class="mt-5 space-y-4"
					use:enhance={validated(sslcommerzSchema, setErrors('sslcommerz'))}
				>
					<div class="grid gap-4 sm:grid-cols-2">
						<Field id="ssl-store" label="Store id" error={problem('sslcommerz', 'public_id')}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									name="public_id"
									autocomplete="off"
									{...LIMITS.gatewayPublicId}
									aria-describedby={describedBy}
									{invalid}
								/>
							{/snippet}
						</Field>

						<Field
							id="ssl-password"
							label="Store password"
							hint="Locked away when saved. It is never shown again."
							error={problem('sslcommerz', 'secret')}
						>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									name="secret"
									type="password"
									autocomplete="off"
									{...LIMITS.gatewaySecret}
									aria-describedby={describedBy}
									{invalid}
								/>
							{/snippet}
						</Field>
					</div>

					<div class="flex justify-end">
						<Button type="submit" size="sm">
							<Icon icon={FloppyDiskIcon} class="size-4" />
							Save keys
						</Button>
					</div>
				</form>
			{/if}
		</Card>

		<!-- ----------------------------------------------------------------- bKash -->
		<Card float>
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 class="flex items-center gap-2 font-medium">
						<Icon icon={Key01Icon} class="text-muted size-4" />
						bKash
					</h2>
					<p class="text-muted mt-1 max-w-prose text-sm">
						The wallet, in Bangladesh. Four things from your bKash merchant account: the app key,
						and the three secrets that go with it.
					</p>
				</div>
				{@render status(bkash)}
			</div>

			{#if bkash?.unavailable}
				<p class="text-muted mt-4 text-sm">{bkash.unavailable}</p>
			{:else}
				<form
					method="POST"
					action="?/bkash"
					class="mt-5 space-y-4"
					use:enhance={validated(bkashSchema, setErrors('bkash'))}
				>
					<div class="grid gap-4 sm:grid-cols-2">
						<Field id="bkash-key" label="App key" error={problem('bkash', 'public_id')}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									name="public_id"
									autocomplete="off"
									{...LIMITS.gatewayPublicId}
									aria-describedby={describedBy}
									{invalid}
								/>
							{/snippet}
						</Field>

						<Field id="bkash-secret" label="App secret" error={problem('bkash', 'app_secret')}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									name="app_secret"
									type="password"
									autocomplete="off"
									{...LIMITS.gatewaySecret}
									aria-describedby={describedBy}
									{invalid}
								/>
							{/snippet}
						</Field>

						<Field id="bkash-username" label="Username" error={problem('bkash', 'username')}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									name="username"
									autocomplete="off"
									{...LIMITS.gatewaySecret}
									aria-describedby={describedBy}
									{invalid}
								/>
							{/snippet}
						</Field>

						<Field
							id="bkash-password"
							label="Password"
							hint="The three secrets are locked away together. None of them is shown again."
							error={problem('bkash', 'password')}
						>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									name="password"
									type="password"
									autocomplete="off"
									{...LIMITS.gatewaySecret}
									aria-describedby={describedBy}
									{invalid}
								/>
							{/snippet}
						</Field>
					</div>

					<div class="flex justify-end">
						<Button type="submit" size="sm">
							<Icon icon={FloppyDiskIcon} class="size-4" />
							Save keys
						</Button>
					</div>
				</form>
			{/if}
		</Card>

		<!-- ------------------------------------------------------------------ fake -->
		{#if !fake?.unavailable}
			<Card float>
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 class="flex items-center gap-2 font-medium">
							<Icon icon={CreditCardIcon} class="text-muted size-4" />
							Test payments
						</h2>
						<p class="text-muted mt-1 max-w-prose text-sm">
							Practise a whole purchase — paying, enrolling, refunding — without any real money
							changing hands. Useful for trying things out before you go live.
						</p>
					</div>
					{@render status(fake)}
				</div>

				<form method="POST" action="?/connect" class="mt-4" use:enhance>
					<input type="hidden" name="gateway" value="fake" />
					<Button type="submit" variant="secondary" size="sm">
						<Icon icon={CreditCardIcon} class="size-4" />
						{fake?.account ? 'Reconnect' : 'Turn on test payments'}
					</Button>
				</form>
			</Card>
		{/if}
	</div>
</Page>
