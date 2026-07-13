<script lang="ts">
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { PLATFORM, ROADMAP } from './content';
</script>

<Section
	id="platform"
	eyebrow="Underneath"
	title="An API first, and a website second"
	lead="This page's app is one client of the same public contract a mobile app, a plugin, or your own integration would use."
	class="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20"
>
	<dl>
		{#each PLATFORM as item, i (item.title)}
			<div
				class="border-t border-border py-6 first:border-t-0 first:pt-0"
				use:inview={{ delay: i * 70 }}
			>
				<dt class="font-semibold">{item.title}</dt>
				<dd class="mt-2 leading-relaxed text-muted">{item.line}</dd>
			</div>
		{/each}
	</dl>

	<!-- Said plainly, and on the page, so nobody plans around a thing that is not there. -->
	<div class="squircle self-start bg-surface-sunken p-7" use:inview={{ delay: 140 }}>
		<p class="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Not built yet</p>

		<dl class="mt-5 space-y-5">
			{#each ROADMAP as item (item.title)}
				<div>
					<dt class="text-sm font-medium">{item.title}</dt>
					<dd class="mt-1 text-sm leading-relaxed text-muted">{item.line}</dd>
				</div>
			{/each}
		</dl>
	</div>
</Section>
