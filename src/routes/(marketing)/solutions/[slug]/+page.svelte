<script lang="ts">
	/**
	 * A per-audience solution page — flat cream, paper cards, pill buttons, the same
	 * look as the landing. The segment data (headline, blurb, the "today" list, the
	 * highlight) is content, not presentation, and is untouched here.
	 */
	import { resolve } from '$app/paths';
	import { Icon } from '$lib/components';
	import {
		Card,
		Button,
		Tag,
		PageHero,
		SiteCta,
		TONES,
		QUIET,
		SCRIM
	} from '$lib/features/marketing/ui';
	import { ArrowRight01Icon, ArrowUpRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const segment = $derived(data.segment);

	// Two-tone headline: the first sentence solid, the rest in brand.
	const parts = $derived(segment.headline.split(/(?<=\.)\s+/));
	const headA = $derived(parts[0]);
	const headB = $derived(parts.slice(1).join(' '));

	// The first point leads: wider, taller, and carrying the segment's own
	// screenshot. The rest stay quiet so the lead keeps the eye.
	const restTone = (i: number) => QUIET[(i - 1) % QUIET.length];
</script>

<svelte:head>
	<title>Muallim for {segment.nav.toLowerCase()}</title>
	<meta name="description" content={segment.blurb} />
</svelte:head>

<div class="page">
	<PageHero>
		{#snippet eyebrow()}
			<Tag>{segment.eyebrow}</Tag>
		{/snippet}
		{#snippet title()}
			{headA}
			{#if headB}<span class="accent">{headB}</span>{/if}
		{/snippet}
		{#snippet subtitle()}{segment.blurb}{/snippet}
		{#snippet actions()}
			<Button href={resolve('/register')} variant="lime">
				Create a workspace <Icon icon={ArrowRight01Icon} class="size-5" />
			</Button>
			<Button href={resolve('/')} variant="ghost">
				See everything it does <Icon icon={ArrowUpRight01Icon} class="size-5" />
			</Button>
		{/snippet}
	</PageHero>

	<section class="section">
		<h2 class="h2">Built for the way {segment.nav.toLowerCase()} actually work</h2>
		<p class="lead">{segment.tagline}</p>
		<div class="grid">
			{#each segment.today as item, i (item.title)}
				{@const tone = i === 0 ? TONES.photo : restTone(i)}
				<div
					class="flex flex-col rounded-[var(--r-lg)] p-6 {tone.card} {i === 0
						? 'min-h-[18rem] sm:col-span-2'
						: 'min-h-[15rem]'}"
				>
					{#if i === 0}
						<!-- The segment's own screenshot as the panel's backdrop. Blurred on purpose:
						     unblurred, its headings land on the card's and the two argue. It is
						     texture here — the page shows the product properly further down. -->
						<img
							src={segment.shot.src}
							alt=""
							loading="lazy"
							class="absolute inset-0 h-full w-full scale-110 object-cover blur-[3px]"
						/>
						<div class={SCRIM}></div>
					{/if}
					<span class="relative grid size-11 place-items-center rounded-xl {tone.icon}">
						<Icon icon={item.icon} class="size-5" />
					</span>
					<h3 class="relative mt-4 font-bold {tone.title} {i === 0 ? 'text-2xl' : 'text-lg'}">
						{item.title}
					</h3>
					<p class="relative mt-1 leading-relaxed {tone.body} {i === 0 ? 'text-base' : 'text-sm'}">
						{item.body}
					</p>
				</div>
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
</style>
