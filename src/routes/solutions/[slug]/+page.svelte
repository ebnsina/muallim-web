<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import { Button, Card, Icon, MarketingFooter, MarketingHeader } from '$lib/components';
	import { Capabilities, Closing, ProductShot, Section } from '$lib/features/marketing';
	import { inview } from '$lib/actions/inview';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const segment = $derived(data.segment);

	// Two-tone headline: the first sentence solid, the rest receding.
	const parts = $derived(segment.headline.split(/(?<=\.)\s+/));
	const headA = $derived(parts[0]);
	const headB = $derived(parts.slice(1).join(' '));
</script>

<svelte:head>
	<title>Muallim for {segment.nav.toLowerCase()}</title>
	<meta name="description" content={segment.blurb} />
</svelte:head>

<MarketingHeader />

<main>
	<!-- The landing's hero, and the same rule: the picture is the product. -->
	<section class="hero-wash relative isolate overflow-hidden">
		<div
			class="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.035] dark:opacity-[0.06]"
			aria-hidden="true"
		></div>

		<div class="mx-auto max-w-6xl px-6 pt-28 text-center sm:pt-36">
			<div use:inview>
				<span
					class="inline-flex items-center gap-2 rounded-pill bg-surface-raised px-3.5 py-1.5 text-sm text-muted ring-1 ring-border"
				>
					<Icon icon={segment.heroIcon} class="size-4 text-accent-text" />
					{segment.eyebrow}
				</span>

				<h1
					class="mx-auto mt-8 max-w-4xl text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance"
				>
					{headA}
					{#if headB}<span class="text-muted">{headB}</span>{/if}
				</h1>

				<p class="mx-auto mt-7 max-w-2xl text-lg text-pretty text-muted">{segment.blurb}</p>

				<div class="mt-9 flex flex-wrap items-center justify-center gap-3">
					<Button href={resolve('/register')} size="lg" pill>
						Create a workspace
						<Icon icon={ArrowRight01Icon} class="size-4" />
					</Button>
					<Button href="{resolve('/')}#capabilities" variant="secondary" size="lg" pill>
						See everything it does
					</Button>
				</div>
			</div>

			<div class="mt-16 pb-24 sm:mt-20 sm:pb-28" use:inview={{ delay: 120 }}>
				<ProductShot
					eager
					src={segment.shot.src}
					alt={segment.shot.alt}
					path={segment.shot.path}
					class="mx-auto max-w-5xl"
				/>
			</div>
		</div>
	</section>

	<!-- ------------------------------------------------------------ the offer -->
	<Section
		eyebrow="What you get"
		title="Built for the way {segment.nav.toLowerCase()} actually work"
		lead={segment.tagline}
		class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
	>
		{#each segment.today as item, i (item.title)}
			<div use:inview={{ delay: (i % 3) * 70 }}>
				<Card float class="lift h-full p-7">
					<span
						class="flex size-10 items-center justify-center rounded-control bg-accent-surface text-accent-text"
					>
						<Icon icon={item.icon} class="size-5" />
					</span>

					<h3 class="mt-5 font-semibold">{item.title}</h3>
					<p class="mt-2.5 leading-relaxed text-muted">{item.body}</p>
				</Card>
			</div>
		{/each}
	</Section>

	<!-- ------------------------------------------------------------- highlight -->
	<section class="px-6 py-16 sm:py-20">
		<div class="hero-panel squircle mx-auto max-w-6xl overflow-hidden ring-1 ring-border">
			<div class="grid items-center gap-12 px-6 py-16 sm:px-12 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
				<div use:inview>
					<p class="text-xs font-semibold tracking-[0.14em] text-accent-text uppercase">
						{segment.highlight.label}
					</p>
					<h2 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
						{segment.highlight.title}
					</h2>
					<p class="mt-5 text-lg leading-relaxed text-pretty text-muted">
						{segment.highlight.body}
					</p>
				</div>

				<div use:inview={{ delay: 120 }}>
					<Card float class="p-7">
						<ul class="space-y-4">
							{#each segment.highlight.points as point (point)}
								<li class="flex items-start gap-3 text-[0.9375rem] leading-relaxed">
									<Icon
										icon={Tick02Icon}
										strokeWidth={2.5}
										class="mt-1 size-3.5 shrink-0 text-accent"
									/>
									{point}
								</li>
							{/each}
						</ul>
					</Card>
				</div>
			</div>
		</div>
	</section>

	<!-- The rest of the product, in the same index the landing uses. -->
	<Capabilities />
	<Closing />
</main>

<MarketingFooter />
