<script lang="ts">
	import { resolve } from '$app/paths';
	import { CreditCardIcon } from '@hugeicons/core-free-icons';
	import { Badge, Button, Card, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { SALES } from './content';
</script>

<Section
	id="sales"
	eyebrow="Course sales"
	title="Charge for a course, and keep what it earns."
	lead="A workspace connects its own payment account. The learner pays your school, not us."
	class="grid gap-6 lg:grid-cols-2"
>
	<div use:inview>
		<Card float class="h-full p-6 sm:p-8">
			<div class="flex size-10 items-center justify-center squircle-sm bg-success-surface">
				<Icon icon={CreditCardIcon} class="size-5 text-success-text" />
			</div>

			<ol class="mt-6 space-y-5">
				{#each SALES as line, i (line)}
					<li class="flex gap-4">
						<span
							class="numeral mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-pill bg-surface-sunken text-xs font-semibold text-muted"
						>
							{i + 1}
						</span>
						<span class="text-sm text-pretty text-muted">{line}</span>
					</li>
				{/each}
			</ol>
		</Card>
	</div>

	<div use:inview={{ delay: 100 }}>
		<!-- aurora-4 rather than the default leaf: it is the cool one, and it agrees with the hero. -->
		<Card surface="aurora" class="aurora-4 flex h-full flex-col justify-between p-6 sm:p-8">
			<div>
				<Badge tone="neutral" class="border-white/25 bg-white/15 text-on-solid">Stripe</Badge>
				<p class="mt-6 text-2xl font-semibold text-balance text-on-solid sm:text-3xl">
					You are the merchant of record. The takings are yours, less a platform fee.
				</p>
				<p class="mt-4 text-sm text-pretty text-on-solid/75">
					A learner gets the course when the gateway confirms the payment, not when the browser
					comes back from checkout. A course can be made free again in one click.
				</p>
			</div>

			<div class="mt-8">
				<Button href={resolve('/register')} variant="glass" pill>Connect a workspace</Button>
			</div>
		</Card>
	</div>
</Section>
