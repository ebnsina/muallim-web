<script lang="ts">
	// The seven groups as cards — the home the nav and footer "all features" point at.
	import { resolve } from '$app/paths';
	import { Icon } from '$lib/components';
	import { Button, Tag, PageHero, SiteCta } from '$lib/features/marketing/ui';
	import { ArrowRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
	import { reveal } from '$lib/reveal';
	import { FEATURES, GROUPS, featuresIn } from '$lib/content/features';

	const groups = GROUPS.map((g) => ({ ...g, count: featuresIn(g.key).length }));
</script>

<svelte:head>
	<title>Products — Muallim</title>
	<meta
		name="description"
		content="The seven sides of Muallim: teaching, assessment, community, the academic office, money and operations, families, and the platform underneath."
	/>
</svelte:head>

<div class="page">
	<PageHero>
		{#snippet eyebrow()}<Tag>Products</Tag>{/snippet}
		{#snippet title()}One platform, seven sides.{/snippet}
		{#snippet subtitle()}
			Everything from the first lesson to the last receipt — {FEATURES.length} features across seven parts,
			each doing a real job today.
		{/snippet}
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
		<div class="grid">
			{#each groups as g (g.key)}
				<a class="card" href={resolve('/(marketing)/products/[group]', { group: g.key })}>
					<span class="chip"><Icon icon={g.icon} class="size-6" /></span>
					<h2 class="name">{g.name}</h2>
					<p class="blurb">{g.blurb}</p>
					<span class="more">
						{g.count} features <Icon icon={ArrowRight01Icon} class="size-4" />
					</span>
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
		margin: 4rem auto 0;
		padding: 0 1.5rem;
	}
	.grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr;
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (min-width: 980px) {
		.grid {
			grid-template-columns: 1fr 1fr 1fr;
		}
	}
	.card {
		display: flex;
		flex-direction: column;
		min-height: 14rem;
		border-radius: var(--r-lg);
		border: 1px solid color-mix(in oklab, var(--ink) 9%, transparent);
		background: var(--surface);
		padding: 1.5rem;
		text-decoration: none;
		transition:
			transform 0.18s ease,
			background-color 0.18s ease;
	}
	.card:hover {
		transform: translateY(-3px);
		background: var(--brand-tint);
	}
	@media (prefers-reduced-motion: reduce) {
		.card,
		.card:hover {
			transition: none;
			transform: none;
		}
	}
	.chip {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border-radius: 0.85rem;
		background: var(--brand-tint);
		color: var(--brand);
	}
	.name {
		margin: 1.1rem 0 0;
		font-size: 1.25rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.blurb {
		margin: 0.4rem 0 0;
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--muted);
	}
	.more {
		margin-top: auto;
		padding-top: 1.25rem;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--brand);
	}
</style>
