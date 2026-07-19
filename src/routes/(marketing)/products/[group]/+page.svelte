<script lang="ts">
	// One group told in full, from content/features.ts — no hand-written copy to drift.
	// Replaced 44 thin feature pages; each feature is an anchored section here.
	import { resolve } from '$app/paths';
	import { Icon } from '$lib/components';
	import { Button, Tag, PageHero, SiteCta } from '$lib/features/marketing/ui';
	import { ArrowRight01Icon, ArrowUpRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import { reveal } from '$lib/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const group = $derived(data.group);
	const features = $derived(data.features);
	const others = $derived(data.others);
</script>

<svelte:head>
	<title>{group.name} — Muallim</title>
	<meta name="description" content={group.blurb} />
</svelte:head>

<div class="page">
	<PageHero>
		{#snippet eyebrow()}<Tag>Product</Tag>{/snippet}
		{#snippet title()}{group.name}{/snippet}
		{#snippet subtitle()}{group.blurb}{/snippet}
		{#snippet actions()}
			<Button href={resolve('/register')} variant="lime">
				Start free <Icon icon={ArrowRight01Icon} class="size-5" />
			</Button>
			<Button href={resolve('/(marketing)/demo')} variant="ghost">
				Book a demo <Icon icon={ArrowUpRight01Icon} class="size-5" />
			</Button>
		{/snippet}
	</PageHero>

	<section use:reveal class="section">
		<p class="eyebrow">{features.length} in {group.name.toLowerCase()}</p>
		<h2 class="h2">Everything in this part of Muallim, and what it does today.</h2>
		<div class="grid">
			{#each features as feature (feature.slug)}
				<!-- id is the anchor the mega deep-links to. -->
				<article id={feature.slug} class="tile">
					<span class="chip"><Icon icon={feature.icon} class="size-5" /></span>
					<h3 class="tile-title">{feature.name}</h3>
					<p class="tile-head">{feature.headline}</p>
					<ul class="points">
						{#each feature.today as point (point)}
							<li>
								<Icon icon={Tick02Icon} strokeWidth={2.5} class="tick size-4" />
								<span>{point}</span>
							</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</section>

	<!-- The other products, so a reader moves between them without a trip to a menu. -->
	<section use:reveal class="section">
		<p class="eyebrow">The rest of Muallim</p>
		<h2 class="h2">Six more sides to the same platform.</h2>
		<div class="others">
			{#each others as g (g.key)}
				<a class="other" href={resolve('/(marketing)/products/[group]', { group: g.key })}>
					<span class="chip"><Icon icon={g.icon} class="size-5" /></span>
					<span>
						<span class="other-name">{g.name}</span>
						<span class="other-sub">{g.blurb}</span>
					</span>
					<Icon icon={ArrowRight01Icon} class="ml-auto size-4 shrink-0 text-[var(--muted)]" />
				</a>
			{/each}
		</div>
	</section>

	<SiteCta />
</div>

<style>
	.page {
		background: var(--cream);
	}
	.section {
		max-width: 76rem;
		margin: 5rem auto 0;
		padding: 0 1.5rem;
	}
	.eyebrow {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-soft);
		margin: 0 0 0.5rem;
	}
	.h2 {
		font-weight: 700;
		font-size: clamp(1.7rem, 3vw, 2.3rem);
		letter-spacing: -0.025em;
		color: var(--brand);
		max-width: 26ch;
	}
	.grid {
		margin-top: 1.75rem;
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr;
	}
	@media (min-width: 720px) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	.tile {
		display: flex;
		flex-direction: column;
		border-radius: var(--r-lg);
		border: 1px solid color-mix(in oklab, var(--ink) 9%, transparent);
		background: var(--surface);
		padding: 1.5rem;
		/* Clears the fixed pill when the mega deep-links to a feature. */
		scroll-margin-top: 6rem;
	}
	.chip {
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 0.75rem;
		background: var(--brand-tint);
		color: var(--brand);
	}
	.tile-title {
		margin: 1rem 0 0;
		font-size: 1.15rem;
		font-weight: 800;
		letter-spacing: -0.01em;
		color: var(--ink);
	}
	.tile-head {
		margin: 0.25rem 0 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--brand-soft);
	}
	.points {
		margin: 1.1rem 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.points li {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--ink-soft);
	}
	.points :global(.tick) {
		margin-top: 0.12rem;
		flex-shrink: 0;
		color: var(--brand);
	}
	.others {
		margin-top: 1.75rem;
		display: grid;
		gap: 0.75rem;
		grid-template-columns: 1fr;
	}
	@media (min-width: 720px) {
		.others {
			grid-template-columns: 1fr 1fr;
		}
	}
	.other {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		border-radius: var(--r);
		border: 1px solid color-mix(in oklab, var(--ink) 9%, transparent);
		background: var(--surface);
		padding: 1rem 1.1rem;
		text-decoration: none;
		transition: background-color 0.18s ease;
	}
	.other:hover {
		background: var(--surface-2);
	}
	.other-name {
		display: block;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--ink);
	}
	.other-sub {
		display: block;
		margin-top: 0.1rem;
		font-size: 0.8rem;
		line-height: 1.4;
		color: var(--muted);
	}
</style>
