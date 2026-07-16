<script lang="ts">
	import type { Snippet } from 'svelte';

	/*
		The hero band every non-landing page opens on: the same light gradient the
		landing wears, so the one dark header pill reads the same everywhere.

		The copy stays the page's — this owns the band and nothing that is said on it.
		With `aside` it lays out copy-left/panel-right like the landing's hero; without,
		it centres.
	*/
	type Props = {
		eyebrow?: Snippet;
		title: Snippet;
		subtitle?: Snippet;
		actions?: Snippet;
		aside?: Snippet;
	};
	let { eyebrow, title, subtitle, actions, aside }: Props = $props();
</script>

<div class="hero-band">
	<div class="inner" class:split={aside}>
		<div class="copy">
			{#if eyebrow}
				<div class="eyebrow">{@render eyebrow()}</div>
			{/if}
			<h1 class="h1">{@render title()}</h1>
			{#if subtitle}
				<p class="sub">{@render subtitle()}</p>
			{/if}
			{#if actions}
				<div class="cta">{@render actions()}</div>
			{/if}
		</div>
		{#if aside}
			<div class="aside">{@render aside()}</div>
		{/if}
	</div>
</div>

<style>
	.hero-band {
		position: relative;
		/* The header floats out of the flow above this, so the band reserves its height
		   rather than letting the nav land on the copy. */
		padding-top: 5.2rem;
		background: var(--hero-backdrop);
		color: var(--ink);
	}

	.inner {
		max-width: 52rem;
		margin: 0 auto;
		padding: 3.5rem 1.5rem 4.5rem;
		text-align: center;
	}
	.split {
		max-width: 76rem;
		display: grid;
		gap: 3rem;
		align-items: center;
		text-align: start;
	}
	@media (min-width: 900px) {
		.split {
			grid-template-columns: 1.1fr 0.9fr;
		}
	}

	.eyebrow {
		display: block;
	}
	.h1 {
		font-weight: 700;
		font-size: clamp(2.25rem, 5vw, 3.8rem);
		line-height: 1.05;
		letter-spacing: -0.03em;
		margin: 1.4rem 0 0;
		color: var(--ink);
	}
	/* The pages mark the second half of a headline `.accent`; on paper lime vanishes,
	   so it is olive that carries it. */
	.h1 :global(.accent) {
		color: var(--brand);
	}
	.sub {
		margin: 1.3rem auto 0;
		max-width: 40rem;
		font-size: 1.12rem;
		line-height: 1.6;
		color: var(--muted);
	}
	.split .sub {
		margin-inline: 0;
		max-width: 34rem;
	}
	.cta {
		margin-top: 2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
		justify-content: center;
	}
	.split .cta {
		justify-content: flex-start;
	}
</style>
