<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { inview } from '$lib/actions/inview';
	import ProductShot from './ProductShot.svelte';

	type Props = {
		id?: string;
		index: number;
		eyebrow: string;
		title: string;
		lead: string;
		points: readonly string[];
		src: string;
		alt: string;
		path: string;
		/** Put the screenshot on the left. Alternated down the page, so nothing marches. */
		flip?: boolean;
		tinted?: boolean;
		/** Anything extra under the points — chips, a note, a link. */
		children?: Snippet;
	};

	let {
		id,
		index,
		eyebrow,
		title,
		lead,
		points,
		src,
		alt,
		path,
		flip = false,
		tinted = false,
		children
	}: Props = $props();
</script>

<section {id} class={cn('overflow-hidden px-6 py-20 sm:py-28', tinted && 'bg-surface-sunken')}>
	<div class="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
		<div class={cn(flip && 'lg:order-2')} use:inview>
			<p class="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] uppercase">
				<span class="numeral text-muted">0{index}</span>
				<span class="h-px w-6 bg-border-strong" aria-hidden="true"></span>
				<span class="text-accent-text">{eyebrow}</span>
			</p>

			<h2 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
			<p class="mt-5 text-lg leading-relaxed text-pretty text-muted">{lead}</p>

			<ul class="mt-8 border-t border-border">
				{#each points as point (point)}
					<li class="border-b border-border py-3.5 text-[0.9375rem] leading-relaxed">{point}</li>
				{/each}
			</ul>

			{#if children}
				<div class="mt-8">{@render children()}</div>
			{/if}
		</div>

		<!-- The shot runs out to the viewport's edge: the page has a subject, not two columns. -->
		<div
			class={cn(flip && 'lg:order-1')}
			class:bleed-left={flip}
			class:bleed-right={!flip}
			use:inview={{ delay: 100 }}
		>
			<ProductShot {src} {alt} {path} tilt={flip ? 'left' : 'right'} />
		</div>
	</div>
</section>

<style>
	/* Past the 72rem container, out to the window. The gutter is what is left of the padding. */
	@media (min-width: 64rem) {
		.bleed-right {
			margin-right: calc(-1 * max(0px, (100vw - 72rem) / 2 - 1.5rem));
		}

		.bleed-left {
			margin-left: calc(-1 * max(0px, (100vw - 72rem) / 2 - 1.5rem));
		}
	}
</style>
