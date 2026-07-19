<script lang="ts">
	/**
	 * One feature — the same composition as a solution page: flat cream, paper cards,
	 * the UI kit. All copy comes from `$lib/content/features`; this file decides only
	 * how it is laid out.
	 */
	import { resolve } from '$app/paths';
	import { Icon } from '$lib/components';
	import { Card, Button, Tag, PageHero, SiteCta, QUIET, LEAD } from '$lib/features/marketing/ui';
	import { GROUPS } from '$lib/content/features';
	import { reveal } from '$lib/reveal';
	import { ArrowRight01Icon, ArrowLeft01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const feature = $derived(data.feature);
	const group = $derived(data.group);
	const related = $derived(data.related);

	// The first related feature leads — wider and louder; the rest stay quiet. The
	// lead's tone follows the group, so a feature page and its siblings on the index
	// agree. The rest are offset by the same index to keep the lead's neighbour off
	// the lead's own tone.
	const groupIndex = $derived(GROUPS.findIndex((g) => g.key === group.key));
	const leadTone = $derived(LEAD[groupIndex % LEAD.length]);
	const restTone = (i: number) => QUIET[(i + groupIndex) % QUIET.length];

	// Two-tone headline: the first sentence solid, the rest in brand — as on a
	// solution page, so the two read as one family.
	const parts = $derived(feature.headline.split(/(?<=\.)\s+/));
	const headA = $derived(parts[0]);
	const headB = $derived(parts.slice(1).join(' '));
</script>

<svelte:head>
	<title>{feature.name} — Muallim</title>
	<meta name="description" content={feature.blurb} />
</svelte:head>

<div class="page">
	<PageHero>
		{#snippet eyebrow()}
			<Tag>{group.name}</Tag>
		{/snippet}
		{#snippet title()}
			{headA}
			{#if headB}<span class="accent">{headB}</span>{/if}
		{/snippet}
		{#snippet subtitle()}{feature.blurb}{/snippet}
		{#snippet actions()}
			<Button href={resolve('/register')} variant="lime">
				Start free <Icon icon={ArrowRight01Icon} class="size-5" />
			</Button>
			<Button href={resolve('/(marketing)/features')} variant="ghost">
				<Icon icon={ArrowLeft01Icon} class="size-5" /> All features
			</Button>
		{/snippet}
	</PageHero>

	<section use:reveal class="section">
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
		<section use:reveal class="section">
			<h2 class="h2">Goes with</h2>
			<p class="lead">
				The parts of Muallim people reach for alongside {feature.name.toLowerCase()}.
			</p>
			<div class="grid">
				{#each related as item, i (item.slug)}
					{@const tone = i === 0 ? leadTone : restTone(i)}
					<a
						class="tile-link {i === 0 ? 'sm:col-span-2' : ''}"
						href={resolve('/(marketing)/features/[slug]', { slug: item.slug })}
					>
						<!-- The lead leads on width and type size; with no "read more" to anchor a
						     taller card, height would only buy it empty space. -->
						<div class="flex h-full min-h-[15rem] flex-col rounded-[var(--r-lg)] p-6 {tone.card}">
							<span class="grid size-11 place-items-center rounded-xl {tone.icon}">
								<Icon icon={item.icon} class="size-5" />
							</span>
							<h3 class="mt-4 font-bold {tone.title} {i === 0 ? 'text-2xl' : 'text-lg'}">
								{item.name}
							</h3>
							<p class="mt-1 leading-relaxed {tone.body} {i === 0 ? 'text-base' : 'text-sm'}">
								{item.tagline}
							</p>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

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

	@media (prefers-reduced-motion: reduce) {
		.tile-link {
			transition: none;
		}
	}
</style>
