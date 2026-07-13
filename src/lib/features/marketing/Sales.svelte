<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		ArrowUpRight01Icon,
		CreditCardIcon,
		Invoice01Icon,
		Tag01Icon
	} from '@hugeicons/core-free-icons';
	import { Card, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';

	// The three moves, in the order a seller makes them.
	const STEPS = [
		{
			icon: CreditCardIcon,
			step: 'Connect',
			line: 'The workspace links its own payment account. The learner pays you directly, and there is no balance here for you to withdraw from.'
		},
		{
			icon: Tag01Icon,
			step: 'Price',
			line: 'Price a course in your own currency, or make it free again in one click. A free course is simply a course with no price on it.'
		},
		{
			icon: Invoice01Icon,
			step: 'Get paid',
			line: 'Access is granted when your payment account confirms the money arrived — not when the browser wanders back from checkout.'
		}
	];
</script>

<Section
	id="sales"
	eyebrow="Sell"
	title="Your course, your account, your money"
	lead="You are the merchant. We are the software. Every order is recorded on both sides — a receipt for the learner, a record for you — and a payment confirmed twice still enrols exactly once."
	class="grid gap-5 md:grid-cols-3"
>
	{#each STEPS as item, i (item.step)}
		<div use:inview={{ delay: i * 80 }}>
			<Card float class="lift h-full p-7">
				<div class="flex items-center justify-between">
					<span
						class="flex size-10 items-center justify-center rounded-control bg-accent-surface text-accent-text"
					>
						<Icon icon={item.icon} class="size-5" />
					</span>
					<span class="numeral text-sm text-muted">0{i + 1}</span>
				</div>

				<h3 class="mt-5 font-semibold">{item.step}</h3>
				<p class="mt-2.5 leading-relaxed text-muted">{item.line}</p>
			</Card>
		</div>
	{/each}

	<div class="md:col-span-3">
		<a
			href={resolve('/register')}
			class="underline-grow inline-flex items-center gap-1.5 font-medium text-accent-text"
		>
			Open a workspace and price a course
			<Icon icon={ArrowUpRight01Icon} class="size-4" />
		</a>
	</div>
</Section>
