<script lang="ts">
	/**
	 * One feature, in the locked marketing design — the same composition as a
	 * solution page: fixed aurora, frosted cards, the UI kit. All copy comes from
	 * `$lib/content/features`; this file decides only how it is laid out.
	 */
	import { resolve } from '$app/paths';
	import { Icon, MarketingFooter } from '$lib/components';
	import { Card, Button, IconChip, Tag } from '$lib/features/marketing/ui';
	import {
		ArrowRight01Icon,
		ArrowLeft01Icon,
		Tick02Icon,
		Mortarboard01Icon
	} from '@hugeicons/core-free-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const feature = $derived(data.feature);
	const group = $derived(data.group);
	const related = $derived(data.related);

	// Two-tone headline: the first sentence solid, the rest in brand — as on a
	// solution page, so the two read as one family.
	const parts = $derived(feature.headline.split(/(?<=\.)\s+/));
	const headA = $derived(parts[0]);
	const headB = $derived(parts.slice(1).join(' '));

	const TONES = ['indigo', 'teal', 'violet', 'amber', 'rose'] as const;
</script>

<svelte:head>
	<title>{feature.name} — Muallim</title>
	<meta name="description" content={feature.blurb} />
</svelte:head>

<div class="page">
	<header class="menu">
		<a class="brand" href={resolve('/')}><Icon icon={Mortarboard01Icon} class="size-6" /> Muallim</a
		>
		<div class="menu-actions">
			<Button href={resolve('/(marketing)/features')} variant="ghost" size="sm">All features</Button
			>
			<Button href={resolve('/register')} size="sm">
				Start free <Icon icon={ArrowRight01Icon} class="size-4" />
			</Button>
		</div>
	</header>

	<section class="hero">
		<Tag>{group.name}</Tag>
		<h1 class="h1">
			{headA}
			{#if headB}<span class="accent">{headB}</span>{/if}
		</h1>
		<p class="sub">{feature.blurb}</p>
		<div class="cta">
			<Button href={resolve('/register')}>
				Start free <Icon icon={ArrowRight01Icon} class="size-5" />
			</Button>
			<Button href={resolve('/(marketing)/features')} variant="ghost">
				<Icon icon={ArrowLeft01Icon} class="size-5" /> All features
			</Button>
		</div>
	</section>

	<section class="section">
		<h2 class="h2">What it does today</h2>
		<p class="lead">Every line here is something the product does now.</p>
		<Card class="mt-6">
			<ul class="points">
				{#each feature.today as point (point)}
					<li>
						<Icon icon={Tick02Icon} strokeWidth={2.5} class="tick size-4" />
						<span>{point}</span>
					</li>
				{/each}
			</ul>
		</Card>
	</section>

	{#if related.length > 0}
		<section class="section">
			<h2 class="h2">Goes with</h2>
			<p class="lead">
				The parts of Muallim people reach for alongside {feature.name.toLowerCase()}.
			</p>
			<div class="grid">
				{#each related as item, i (item.slug)}
					<a class="tile-link" href={resolve('/(marketing)/features/[slug]', { slug: item.slug })}>
						<Card class="tile">
							<IconChip icon={item.icon} tone={TONES[i % TONES.length]} />
							<h3 class="tile-title">{item.name}</h3>
							<p class="tile-line">{item.tagline}</p>
						</Card>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<section class="section closing">
		<h2 class="h2">Bring your institution online.</h2>
		<div class="cta">
			<Button href={resolve('/register')}
				>Start free <Icon icon={ArrowRight01Icon} class="size-5" /></Button
			>
			<Button href={resolve('/login')} variant="ghost">Sign in</Button>
		</div>
	</section>
</div>

<MarketingFooter />

<style>
	.page {
		background-color: var(--bg);
		background-image:
			radial-gradient(
				50rem 40rem at 8% 4%,
				color-mix(in oklab, var(--brand) 24%, transparent),
				transparent 60%
			),
			radial-gradient(
				46rem 38rem at 94% 8%,
				color-mix(in oklab, var(--gold) 20%, transparent),
				transparent 58%
			),
			radial-gradient(
				46rem 40rem at 88% 82%,
				color-mix(in oklab, var(--indigo) 16%, transparent),
				transparent 60%
			);
		background-repeat: no-repeat;
		background-attachment: fixed;
		padding-bottom: 5rem;
	}
	.menu {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 76rem;
		margin: 0 auto;
		padding: 1.4rem 1.5rem 0;
	}
	.menu-actions {
		display: flex;
		gap: 0.6rem;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		font-size: 1.2rem;
		letter-spacing: -0.01em;
		color: var(--brand);
		text-decoration: none;
	}

	.hero {
		max-width: 52rem;
		margin: 0 auto;
		padding: 4rem 1.5rem 2rem;
		text-align: center;
	}
	.h1 {
		font-weight: 700;
		font-size: clamp(2.25rem, 5vw, 3.8rem);
		line-height: 1.05;
		letter-spacing: -0.03em;
		margin: 1.4rem 0 0;
	}
	.h1 .accent {
		color: var(--brand);
	}
	.sub {
		margin: 1.3rem auto 0;
		max-width: 40rem;
		font-size: 1.12rem;
		line-height: 1.6;
		color: var(--muted);
	}
	.cta {
		margin-top: 2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
		justify-content: center;
	}

	.section {
		max-width: 76rem;
		margin: 4rem auto 0;
		padding: 0 1.5rem;
	}
	.h2 {
		font-weight: 700;
		font-size: clamp(1.7rem, 3vw, 2.3rem);
		letter-spacing: -0.02em;
	}
	.lead {
		margin-top: 0.5rem;
		color: var(--muted);
		line-height: 1.6;
		max-width: 44rem;
	}
	.grid {
		margin-top: 1.5rem;
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(1, 1fr);
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 980px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.tile-link {
		text-decoration: none;
		color: inherit;
		border-radius: var(--r-lg);
		display: block;
		transition: transform 0.12s ease;
	}
	.tile-link:hover {
		transform: translateY(-2px);
	}
	.tile-link:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: 3px;
	}
	.tile-title {
		font-weight: 700;
		font-size: 1.15rem;
		margin: 0.7rem 0 0.4rem;
	}
	.tile-line {
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--muted);
		margin: 0;
	}

	.points {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.9rem;
	}
	@media (min-width: 720px) {
		.points {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem 2rem;
		}
	}
	.points li {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		font-size: 0.95rem;
		line-height: 1.55;
	}
	.points :global(.tick) {
		margin-top: 0.25rem;
		flex-shrink: 0;
		color: var(--brand);
	}

	.closing {
		text-align: center;
	}
	.closing .cta {
		justify-content: center;
	}

	@media (prefers-reduced-motion: reduce) {
		.tile-link {
			transition: none;
		}
	}
</style>
