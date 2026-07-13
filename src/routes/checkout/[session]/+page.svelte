<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert02Icon, Cancel01Icon, CreditCardIcon } from '@hugeicons/core-free-icons';
	import { Alert, Button, Card, Icon } from '$lib/components';
	import { formatMoney } from '$lib/money';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Checkout — Muallim</title></svelte:head>

<!--
	The fake gateway's page. It stands where Stripe's hosted checkout will stand, and
	it is deliberately not dressed up as one: nobody should ever mistake it for a real
	payment page, and the banner says so.
-->
<main class="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
	<Alert tone="warning" role="status">
		<span class="flex items-center gap-2">
			<Icon icon={Alert02Icon} class="size-4 shrink-0" />
			No money moves here. This stands in for the payment gateway until its keys are set.
		</span>
	</Alert>

	<Card float class="mt-6 p-6 sm:p-8">
		<p class="text-muted text-xs tracking-wide uppercase">Amount due</p>
		<p class="numeral mt-1 text-4xl font-semibold tracking-tight">{formatMoney(data.price)}</p>

		<p class="text-muted numeral mt-4 text-xs">{data.session}</p>

		<div class="mt-8 flex flex-col gap-3">
			<form method="POST" action="?/pay" use:enhance>
				<input type="hidden" name="order" value={data.order} />
				<input type="hidden" name="tenant" value={data.tenant} />
				<input type="hidden" name="session" value={data.session} />
				<input type="hidden" name="success" value={data.success} />

				<Button type="submit" size="lg" class="w-full">
					<Icon icon={CreditCardIcon} class="size-4" />
					Pay {formatMoney(data.price)}
				</Button>
			</form>

			<form method="POST" action="?/cancel" use:enhance>
				<input type="hidden" name="order" value={data.order} />
				<input type="hidden" name="tenant" value={data.tenant} />
				<input type="hidden" name="session" value={data.session} />
				<input type="hidden" name="cancel" value={data.cancel} />

				<Button type="submit" variant="ghost" size="lg" class="w-full">
					<Icon icon={Cancel01Icon} class="size-4" />
					Cancel
				</Button>
			</form>
		</div>
	</Card>
</main>
