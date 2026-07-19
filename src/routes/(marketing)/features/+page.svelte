<script lang="ts">
	/**
	 * The feature index — every feature, grouped, so the breadth is visible without
	 * scrolling for it. The landing's tones and its dark hero band, not a flat grid.
	 */
	import { resolve } from '$app/paths';
	import { Icon } from '$lib/components';
	import {
		Button,
		IconChip,
		Tag,
		PageHero,
		SiteCta,
		QUIET,
		LEAD
	} from '$lib/features/marketing/ui';
	import { FEATURES, GROUPS, featuresIn } from '$lib/content/features';
	import { reveal } from '$lib/reveal';
	import { ArrowRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';

	// Each group leads with its first feature — wider, taller, and the loud tone.
	// The lead's tone rotates by group so all four get an outing and the dark one
	// lands once; the rest stay quiet so the lead keeps the eye. Offsetting the rest
	// by the group index keeps the lead's neighbour off the lead's own tone —
	// otherwise the two touch and read as one shape.
	const leadTone = (gi: number) => LEAD[gi % LEAD.length];
	const restTone = (i: number, gi: number) => QUIET[(i + gi) % QUIET.length];
</script>

<svelte:head>
	<title>Features — Muallim</title>
	<meta
		name="description"
		content="Everything Muallim does today: courses, quizzes, marking and certificates; admissions, attendance, exams and fees; and fees collected through your own bKash or SSLCommerz account."
	/>
</svelte:head>

<div class="page">
	<PageHero>
		{#snippet eyebrow()}
			<Tag>{FEATURES.length} features, all of them shipping</Tag>
		{/snippet}
		{#snippet title()}
			Everything Muallim does. <span class="accent">Nothing it doesn’t.</span>
		{/snippet}
		{#snippet subtitle()}
			One platform for teaching a course and running an institution — from the morning register to
			the certificate at the end. Every line on these pages is something the product does today.
		{/snippet}
		{#snippet actions()}
			<Button href={resolve('/register')} variant="lime">
				Start free <Icon icon={ArrowRight01Icon} class="size-5" />
			</Button>
			<Button href={resolve('/')} variant="ghost">
				Back to the overview <Icon icon={ArrowUpRight01Icon} class="size-5" />
			</Button>
		{/snippet}
	</PageHero>

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

	{#each GROUPS as group, gi (group.key)}
		{@const features = featuresIn(group.key)}
		<section use:reveal class="section" id={group.key}>
			<div class="group-head">
				<IconChip icon={group.icon} tone="brand" />
				<div>
					<h2 class="h2">{group.name}</h2>
					<p class="lead">{group.blurb}</p>
				</div>
			</div>
			<div class="grid">
				{#each features as feature, i (feature.slug)}
					{@const tone = i === 0 ? leadTone(gi) : restTone(i, gi)}
					<a
						class="tile-link {i === 0 ? 'sm:col-span-2' : ''}"
						href={resolve('/(marketing)/features/[slug]', { slug: feature.slug })}
					>
						<div
							class="flex h-full flex-col rounded-[var(--r-lg)] p-6 {tone.card} {i === 0
								? 'min-h-[18rem]'
								: 'min-h-[15rem]'}"
						>
							<span class="grid size-11 place-items-center rounded-xl {tone.icon}">
								<Icon icon={feature.icon} class="size-5" />
							</span>
							<h3 class="mt-4 font-bold {tone.title} {i === 0 ? 'text-2xl' : 'text-lg'}">
								{feature.name}
							</h3>
							<p class="mt-1 leading-relaxed {tone.body} {i === 0 ? 'text-base' : 'text-sm'}">
								{feature.tagline}
							</p>
							<span
								class="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold {tone.more}"
							>
								Read more <Icon icon={ArrowRight01Icon} class="size-4" />
							</span>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/each}

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
		scroll-margin-top: 2rem;
	}
	.h2 {
		font-weight: 700;
		font-size: clamp(1.7rem, 3vw, 2.3rem);
		letter-spacing: -0.025em;
		color: var(--brand);
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
	@media (prefers-reduced-motion: reduce) {
		.tile-link,
		.jump a {
			transition: none;
		}
	}
</style>
