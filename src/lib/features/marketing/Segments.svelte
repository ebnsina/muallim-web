<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import { SEGMENTS } from '$lib/content/segments';
	import Section from './Section.svelte';
</script>

<!-- The way into the audience pages. Each says what works today and what does not. -->
<Section
	id="solutions"
	eyebrow="Built for how you teach"
	title="Start where you are"
	lead="A community, a solo course, a school, a coaching cohort, or a client's academy. Each page splits what works today from what is still ahead."
	class="border-t border-border"
>
	<ul>
		{#each SEGMENTS as segment, i (segment.slug)}
			<li use:inview={{ delay: i * 60 }}>
				<a
					href={resolve('/(marketing)/solutions/[slug]', { slug: segment.slug })}
					class="group flex items-center gap-6 border-b border-border py-6 transition-colors hover:bg-surface-sunken"
				>
					<Icon icon={segment.heroIcon} class="size-5 shrink-0 text-accent-text" />

					<span class="min-w-0 flex-1">
						<span class="block font-semibold">{segment.nav}</span>
						<span class="mt-1 block text-[0.9375rem] text-muted">{segment.tagline}</span>
					</span>

					<Icon
						icon={ArrowUpRight01Icon}
						class="size-5 shrink-0 text-muted transition-transform duration-(--duration-press) ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-text"
					/>
				</a>
			</li>
		{/each}
	</ul>
</Section>
