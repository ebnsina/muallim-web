<script lang="ts">
	/**
	 * The feature index — every feature, grouped, so the breadth is visible without
	 * scrolling for it. Locked marketing design, composed from the UI kit.
	 */
	import { resolve } from '$app/paths';
	import { Icon, MarketingFooter } from '$lib/components';
	import { Card, Button, IconChip, Tag } from '$lib/features/marketing/ui';
	import { FEATURES, GROUPS, featuresIn } from '$lib/content/features';
	import {
		ArrowRight01Icon,
		ArrowUpRight01Icon,
		Mortarboard01Icon
	} from '@hugeicons/core-free-icons';

	const TONES = ['indigo', 'teal', 'violet', 'amber', 'rose'] as const;
</script>

<svelte:head>
	<title>Features — Muallim</title>
	<meta
		name="description"
		content="Everything Muallim does today: courses, quizzes, marking and certificates; admissions, attendance, exams and fees; and fees collected through your own bKash or SSLCommerz account."
	/>
</svelte:head>

<div class="page">
	<header class="menu">
		<a class="brand" href={resolve('/')}><Icon icon={Mortarboard01Icon} class="size-6" /> Muallim</a
		>
		<div class="menu-actions">
			<Button href={resolve('/login')} variant="ghost" size="sm">Sign in</Button>
			<Button href={resolve('/register')} size="sm">
				Start free <Icon icon={ArrowRight01Icon} class="size-4" />
			</Button>
		</div>
	</header>

	<section class="hero">
		<Tag>{FEATURES.length} features, all of them shipping</Tag>
		<h1 class="h1">
			Everything Muallim does. <span class="accent">Nothing it doesn’t.</span>
		</h1>
		<p class="sub">
			One platform for teaching a course and running an institution — from the morning register to
			the certificate at the end. Every line on these pages is something the product does today.
		</p>
		<div class="cta">
			<Button href={resolve('/register')}>
				Start free <Icon icon={ArrowRight01Icon} class="size-5" />
			</Button>
			<Button href={resolve('/')} variant="ghost">
				Back to the overview <Icon icon={ArrowUpRight01Icon} class="size-5" />
			</Button>
		</div>
	</section>

	<!-- A jump list, so the breadth registers before any scrolling happens. -->
	<nav class="section jump" aria-label="Feature groups">
		<ul>
			{#each GROUPS as group (group.key)}
				<li>
					<a href="#{group.key}">
						{group.name}
						<span class="count">{featuresIn(group.key).length}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	{#each GROUPS as group (group.key)}
		{@const features = featuresIn(group.key)}
		<section class="section" id={group.key}>
			<div class="group-head">
				<IconChip icon={group.icon} tone="brand" />
				<div>
					<h2 class="h2">{group.name}</h2>
					<p class="lead">{group.blurb}</p>
				</div>
			</div>
			<div class="grid">
				{#each features as feature, i (feature.slug)}
					<a
						class="tile-link"
						href={resolve('/(marketing)/features/[slug]', { slug: feature.slug })}
					>
						<Card class="tile">
							<IconChip icon={feature.icon} tone={TONES[i % TONES.length]} />
							<h3 class="tile-title">{feature.name}</h3>
							<p class="tile-line">{feature.tagline}</p>
							<span class="tile-more">
								Read more <Icon icon={ArrowRight01Icon} class="size-4" />
							</span>
						</Card>
					</a>
				{/each}
			</div>
		</section>
	{/each}

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
		scroll-margin-top: 2rem;
	}
	.h2 {
		font-weight: 700;
		font-size: clamp(1.7rem, 3vw, 2.3rem);
		letter-spacing: -0.02em;
		margin: 0;
	}
	.lead {
		margin-top: 0.4rem;
		color: var(--muted);
		line-height: 1.6;
		max-width: 46rem;
	}

	.jump ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
		justify-content: center;
	}
	.jump a {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid var(--line);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.5rem 0.9rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
		transition:
			border-color 0.12s ease,
			color 0.12s ease;
	}
	.jump a:hover {
		border-color: var(--brand);
		color: var(--brand);
	}
	.jump .count {
		font-family: var(--font-mono, ui-monospace), monospace;
		font-size: 0.72rem;
		color: var(--muted);
	}

	.group-head {
		display: flex;
		align-items: flex-start;
		gap: 0.9rem;
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
	.tile-more {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.9rem;
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--brand);
	}

	.closing {
		text-align: center;
	}
	.closing .cta {
		justify-content: center;
	}

	@media (prefers-reduced-motion: reduce) {
		.tile-link,
		.jump a {
			transition: none;
		}
	}
</style>
