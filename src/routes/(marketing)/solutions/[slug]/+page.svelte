<script lang="ts">
	/**
	 * A per-audience solution page — flat cream, paper cards, pill buttons, the same
	 * look as the landing. The segment data (headline, blurb, the "today" list, the
	 * highlight) is content, not presentation, and is untouched here.
	 */
	import { resolve } from '$app/paths';
	import { Icon } from '$lib/components';
	import { Card, Button, IconChip, Tag } from '$lib/features/marketing/ui';
	import { ArrowRight01Icon, ArrowUpRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const segment = $derived(data.segment);

	// Two-tone headline: the first sentence solid, the rest in brand.
	const parts = $derived(segment.headline.split(/(?<=\.)\s+/));
	const headA = $derived(parts[0]);
	const headB = $derived(parts.slice(1).join(' '));

	// A rotating tone per card, so a grid reads as variety.
	const TONES = ['indigo', 'teal', 'violet', 'amber', 'rose'] as const;
</script>

<svelte:head>
	<title>Muallim for {segment.nav.toLowerCase()}</title>
	<meta name="description" content={segment.blurb} />
</svelte:head>

<div class="page">
	<section class="hero">
		<Tag>{segment.eyebrow}</Tag>
		<h1 class="h1">
			{headA}
			{#if headB}<span class="accent">{headB}</span>{/if}
		</h1>
		<p class="sub">{segment.blurb}</p>
		<div class="cta">
			<Button href={resolve('/register')}>
				Create a workspace <Icon icon={ArrowRight01Icon} class="size-5" />
			</Button>
			<Button href={resolve('/')} variant="ghost">
				See everything it does <Icon icon={ArrowUpRight01Icon} class="size-5" />
			</Button>
		</div>
	</section>

	<section class="section">
		<h2 class="h2">Built for the way {segment.nav.toLowerCase()} actually work</h2>
		<p class="lead">{segment.tagline}</p>
		<div class="grid">
			{#each segment.today as item, i (item.title)}
				<Card class="tile">
					<IconChip icon={item.icon} tone={TONES[i % TONES.length]} />
					<h3 class="tile-title">{item.title}</h3>
					<p class="tile-line">{item.body}</p>
				</Card>
			{/each}
		</div>
	</section>

	<section class="section">
		<Card class="grid items-center gap-6 md:grid-cols-[1.2fr_0.9fr]">
			<div>
				<p class="eyebrow">{segment.highlight.label}</p>
				<h2 class="h2">{segment.highlight.title}</h2>
				<p class="lead">{segment.highlight.body}</p>
			</div>
			<Card subtle class="!p-6">
				<ul class="points">
					{#each segment.highlight.points as point (point)}
						<li>
							<Icon icon={Tick02Icon} strokeWidth={2.5} class="tick size-4" />
							<span>{point}</span>
						</li>
					{/each}
				</ul>
			</Card>
		</Card>
	</section>

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

<style>
	.page {
		background: var(--cream);
		padding-bottom: 5rem;
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
		letter-spacing: -0.025em;
		color: var(--brand);
	}
	.lead {
		margin-top: 0.5rem;
		color: var(--muted);
		line-height: 1.6;
		max-width: 44rem;
	}
	.eyebrow {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-soft);
		margin: 0 0 0.4rem;
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
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.points li {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		font-size: 0.92rem;
		line-height: 1.5;
	}
	.points :global(.tick) {
		margin-top: 0.15rem;
		flex-shrink: 0;
		color: var(--brand);
	}

	.closing {
		text-align: center;
	}
	.closing .cta {
		justify-content: center;
	}
</style>
