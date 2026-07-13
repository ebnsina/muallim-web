<script lang="ts">
	import { CheckmarkBadge01Icon, Search01Icon } from '@hugeicons/core-free-icons';
	import { Badge, Card, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';

	// Illustrative: what a lookup returns. The serial format is the API's own.
	const SERIAL = 'MU-2026-0F3A19C4';

	const FACTS = [
		'Write a certificate template once, in the workspace, and choose it per course.',
		'A learner completes the course and the certificate is issued with its own serial.',
		'Anyone holding the serial can read the certificate. No account, no sign-in.',
		'Revoke one and the serial still answers. It says the certificate was withdrawn.'
	];
</script>

<Section
	id="certificates"
	eyebrow="Certificates"
	title="A certificate is only worth what an employer can check."
	lead="Muallim's are a number, and the number answers. That is the whole difference between a credential and a PDF."
	tinted
	class="grid items-center gap-6 lg:grid-cols-2"
>
	<div use:inview>
		<Card float class="p-6 sm:p-8">
			<div class="flex items-center gap-2 text-sm text-muted">
				<Icon icon={Search01Icon} class="size-4" />
				Certificate lookup
			</div>

			<p class="numeral mt-4 text-xl font-semibold tracking-tight sm:text-2xl">{SERIAL}</p>

			<div class="mt-5 flex flex-wrap items-center gap-3">
				<Badge tone="success" icon={CheckmarkBadge01Icon}>valid</Badge>
				<span class="text-sm text-muted">Issued 4 March 2026 · Foundations of Arabic Grammar</span>
			</div>

			<p class="mt-6 border-t border-border pt-5 text-sm text-pretty text-muted">
				A public answer, by design. Whoever holds the number may read what it says, which is what a
				certificate is for.
			</p>
		</Card>
	</div>

	<ul class="space-y-4" use:inview={{ delay: 100 }}>
		{#each FACTS as fact (fact)}
			<li class="flex gap-3 text-pretty">
				<Icon
					icon={CheckmarkBadge01Icon}
					class="mt-0.5 size-5 shrink-0 text-accent"
					strokeWidth={2}
				/>
				<span>{fact}</span>
			</li>
		{/each}
	</ul>
</Section>
