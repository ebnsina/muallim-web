<script lang="ts">
	import { Card, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { PLATFORM } from './content';
</script>

<Section
	id="platform"
	eyebrow="Underneath"
	title="An API first, and a website second"
	lead="This page's app is one client of the same public contract a mobile app, a plugin, or your own integration would use."
	class="grid gap-5 md:grid-cols-3"
>
	{#each PLATFORM as item, i (item.title)}
		<div use:inview={{ delay: i * 80 }}>
			<Card float class="lift h-full p-7">
				<span
					class="flex size-10 items-center justify-center rounded-control bg-accent-surface text-accent-text"
				>
					<Icon icon={item.icon} class="size-5" />
				</span>

				<h3 class="mt-5 font-semibold">{item.title}</h3>
				<p class="mt-2.5 leading-relaxed text-muted">{item.line}</p>
			</Card>
		</div>
	{/each}
</Section>
