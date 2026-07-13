<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon, CheckmarkCircle02Icon, Clock01Icon } from '@hugeicons/core-free-icons';
	import { AuroraBackdrop, Button, Icon, MarketingFooter, MarketingHeader } from '$lib/components';
	import { ProductShot, Section } from '$lib/features/marketing';
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
	<!-- The same dark hero as the landing, and the same rule: the picture is the product. -->
	<section class="hero-blue relative isolate overflow-hidden text-white">
		<AuroraBackdrop />
		<div
			class="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
			aria-hidden="true"
		></div>

		<div class="mx-auto max-w-6xl px-6 pt-28 text-center sm:pt-36">
			<div use:inview>
				<span
					class="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-sm text-white/85 ring-1 ring-white/10 backdrop-blur-sm"
				>
					<Icon icon={segment.heroIcon} class="size-4" />
					{segment.eyebrow}
				</span>

				<h1
					class="mx-auto mt-8 max-w-4xl text-[clamp(2.25rem,5.5vw,4rem)] leading-[1] font-semibold tracking-[-0.03em] text-balance"
				>
					{headA}
					{#if headB}<span class="text-white/55">{headB}</span>{/if}
				</h1>

				<p class="mx-auto mt-7 max-w-xl text-lg text-pretty text-white/70">{segment.blurb}</p>

				<div class="mt-9 flex flex-wrap items-center justify-center gap-3">
					<Button href={resolve('/register')} size="lg" pill>
						Create a workspace
						<Icon icon={ArrowRight01Icon} class="size-4" />
					</Button>
					<Button href="{resolve('/')}#capabilities" variant="glass" size="lg" pill>
						See everything it does
					</Button>
				</div>
			</div>

			<div class="mt-16 pb-24 sm:mt-20 sm:pb-28" use:inview={{ delay: 120 }}>
				<ProductShot
					eager
					glow="light"
					src={segment.shot.src}
					alt={segment.shot.alt}
					path={segment.shot.path}
					class="mx-auto max-w-5xl"
				/>
			</div>
		</div>
	</section>

	<!-- ------------------------------------------------------- what works today -->
	<Section
		eyebrow="Working today"
		title="What you can do this afternoon"
		lead="Built, tested, and running. Not a plan with a date on it."
	>
		<dl class="grid gap-x-14 sm:grid-cols-2 lg:grid-cols-3">
			{#each segment.today as item, i (item.title)}
				<div class="border-t border-border py-7" use:inview={{ delay: (i % 3) * 70 }}>
					<dt class="flex items-center gap-2.5 font-semibold">
						<Icon icon={item.icon} class="size-4 shrink-0 text-accent-text" />
						{item.title}
					</dt>
					<dd class="mt-3 leading-relaxed text-muted">{item.body}</dd>
				</div>
			{/each}
		</dl>
	</Section>

	<!-- ------------------------------------------------------------- highlight -->
	<section class="px-6 py-20 sm:py-24">
		<div class="squircle mx-auto max-w-6xl bg-surface-sunken px-6 py-16 sm:px-12">
			<div class="grid items-center gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
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

				<ul class="border-t border-border" use:inview={{ delay: 120 }}>
					{#each segment.highlight.points as point (point)}
						<li class="flex items-start gap-3 border-b border-border py-4 text-[0.9375rem]">
							<Icon icon={CheckmarkCircle02Icon} class="mt-0.5 size-4 shrink-0 text-success-text" />
							<span class="leading-relaxed">{point}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>

	<!-- --------------------------------------------------------------- roadmap -->
	<Section
		eyebrow="On the roadmap"
		title="What is still ahead"
		lead="Written down where you can see it. Nothing is promised by leaving it out."
		class="grid gap-x-14 sm:grid-cols-2 lg:grid-cols-3"
	>
		{#each segment.roadmap as item, i (item.title)}
			<div class="border-t border-border py-7" use:inview={{ delay: (i % 3) * 70 }}>
				<h3 class="flex items-center gap-2.5 font-semibold">
					<Icon icon={item.icon} class="size-4 shrink-0 text-muted" />
					{item.title}
				</h3>
				<p class="mt-3 leading-relaxed text-muted">{item.body}</p>
			</div>
		{/each}
	</Section>

	<!-- --------------------------------------------------------------- verdict -->
	<Section
		eyebrow="The honest bottom line"
		title="Ready for you today?"
		class="grid gap-px overflow-hidden bg-border sm:grid-cols-2"
	>
		<div class="bg-surface p-7 sm:p-8" use:inview>
			<h3 class="flex items-center gap-2.5 font-semibold">
				<Icon icon={CheckmarkCircle02Icon} class="size-5 text-success-text" />
				Yes, for this
			</h3>
			<p class="mt-3 leading-relaxed text-pretty text-muted">{segment.verdict.ready}</p>
		</div>

		<div class="bg-surface p-7 sm:p-8" use:inview={{ delay: 100 }}>
			<h3 class="flex items-center gap-2.5 font-semibold">
				<Icon icon={Clock01Icon} class="size-5 text-muted" />
				Wait, if you need this
			</h3>
			<p class="mt-3 leading-relaxed text-pretty text-muted">{segment.verdict.wait}</p>
		</div>
	</Section>

	<!-- ------------------------------------------------------------------- CTA -->
	<section class="px-6 pb-24">
		<div
			class="hero-blue squircle relative isolate mx-auto max-w-6xl overflow-hidden px-6 py-20 text-center text-white sm:py-24"
			use:inview
		>
			<div
				class="grain pointer-events-none absolute inset-0 opacity-[0.06]"
				aria-hidden="true"
			></div>

			<h2
				class="mx-auto max-w-2xl text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] font-semibold tracking-tight text-balance"
			>
				Start with one course.
			</h2>
			<p class="mx-auto mt-5 max-w-lg text-lg text-pretty text-white/70">
				Everything that works today is here to use. The rest arrives as it lands, and this page will
				say so.
			</p>

			<div class="mt-9 flex flex-wrap items-center justify-center gap-3">
				<Button href={resolve('/register')} size="lg" pill>
					Create a workspace
					<Icon icon={ArrowRight01Icon} class="size-4" />
				</Button>
				<Button href={resolve('/')} variant="glass" size="lg" pill>Back to the overview</Button>
			</div>
		</div>
	</section>
</main>

<MarketingFooter />
