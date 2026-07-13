<script lang="ts">
	import { SourceCodeIcon } from '@hugeicons/core-free-icons';
	import { Card, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { PLATFORM } from './content';
</script>

<Section
	id="platform"
	eyebrow="Under it"
	title="An API first, and a website second."
	lead="Muallim is a backend with a published contract. This site is the first thing built against it, which is the only reason to trust that the contract is real."
	class="grid gap-6 md:grid-cols-3"
>
	{#each PLATFORM as item, i (item.title)}
		<div use:inview={{ delay: i * 80 }} class="h-full">
			<Card aurora class="flex h-full flex-col p-6">
				<Icon icon={SourceCodeIcon} class="size-5 text-accent" />
				<h3 class="mt-4 font-semibold">{item.title}</h3>
				<p class="mt-2 text-sm text-pretty text-muted">{item.line}</p>
			</Card>
		</div>
	{/each}
</Section>
