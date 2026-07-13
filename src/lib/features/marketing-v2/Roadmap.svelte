<script lang="ts">
	import { Clock01Icon } from '@hugeicons/core-free-icons';
	import { Badge, Card } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { ROADMAP } from './content';
</script>

<Section
	id="roadmap"
	eyebrow="Not built"
	title="And here is what Muallim cannot do."
	lead="Listed, rather than left for you to discover in a trial. Nothing here works today, and nothing on this page depends on it."
	class="grid gap-6 md:grid-cols-3"
>
	{#each ROADMAP as item, i (item.title)}
		<div use:inview={{ delay: i * 80 }} class="h-full">
			<Card surface="sunken" class="flex h-full flex-col p-6">
				<Badge tone="neutral" icon={Clock01Icon} class="self-start">planned</Badge>
				<h3 class="mt-4 font-semibold text-muted">{item.title}</h3>
				<p class="mt-2 text-sm text-pretty text-muted">{item.line}</p>
			</Card>
		</div>
	{/each}
</Section>
