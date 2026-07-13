<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';

	// The three moves, in the order a seller makes them. No numbers are claimed here:
	// the fee is a setting, and the currency is whatever the workspace priced in.
	const STEPS = [
		{
			step: 'Connect',
			line: 'The workspace links its own payment account. Muallim never holds the money, and there is no balance here to withdraw from.'
		},
		{
			step: 'Price',
			line: 'A course is priced in your currency, or made free again in one click. A free course simply has no price row.'
		},
		{
			step: 'Get paid',
			line: 'Access is granted when the gateway confirms the payment — not when the browser comes back from it.'
		}
	];
</script>

<Section
	id="sales"
	eyebrow="Sell"
	title="Your course, your account, your money"
	lead="You are the merchant. We are the software. The learner pays your payment account, and the enrolment appears the moment that account says the money arrived."
	class="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20"
>
	<ol class="grid gap-px bg-border sm:grid-cols-3 lg:grid-cols-1">
		{#each STEPS as item, i (item.step)}
			<li class="bg-surface py-7 sm:px-6 lg:px-0 lg:py-8" use:inview={{ delay: i * 80 }}>
				<div class="flex items-baseline gap-3">
					<span class="numeral text-sm text-muted">0{i + 1}</span>
					<h3 class="text-lg font-semibold">{item.step}</h3>
				</div>
				<p class="mt-2 leading-relaxed text-muted lg:pl-8">{item.line}</p>
			</li>
		{/each}
	</ol>

	<div class="squircle self-start bg-surface-sunken p-7 sm:p-8" use:inview={{ delay: 140 }}>
		<p class="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Where this stands</p>

		<p class="mt-5 leading-relaxed">
			The money path is built end to end — an account, a price, an order, the gateway's webhook, the
			enrolment — and a webhook delivered three times still enrols exactly once.
		</p>

		<p class="mt-4 leading-relaxed text-muted">
			Stripe Connect is the first gateway it will run against, and its driver refuses to do anything
			until its keys are set. That is the one piece not yet live, and it is said here rather than
			discovered later.
		</p>

		<a
			href={resolve('/register')}
			class="underline-grow mt-7 inline-flex items-center gap-1.5 font-medium text-accent-text"
		>
			Open a workspace and price a course
			<Icon icon={ArrowUpRight01Icon} class="size-4" />
		</a>
	</div>
</Section>
