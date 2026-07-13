<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon, ShoppingBag01Icon } from '@hugeicons/core-free-icons';
	import { AuroraBackdrop, Button, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import ProductShot from './ProductShot.svelte';
	import { LIFECYCLE } from './content';

	const here = resolve('/v2');
</script>

<section class="hero-blue relative isolate overflow-hidden text-white">
	<AuroraBackdrop />
	<div
		class="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
		aria-hidden="true"
	></div>

	<div class="mx-auto max-w-6xl px-6 pt-28 text-center sm:pt-36">
		<div use:inview>
			<a
				href="{here}#sales"
				class="inline-flex items-center gap-2 rounded-pill bg-white/10 py-1.5 pr-3.5 pl-1.5 text-sm text-white/85 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
			>
				<span class="rounded-pill bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
					New
				</span>
				<Icon icon={ShoppingBag01Icon} class="size-4" />
				Sell a course from your own payment account
			</a>

			<h1
				class="mx-auto mt-8 max-w-4xl text-[clamp(2.75rem,7vw,5.25rem)] leading-[0.95] font-semibold tracking-[-0.03em] text-balance"
			>
				Teach it. Mark it.<br class="hidden sm:block" />
				<span class="text-white/55">Certify it. Sell it.</span>
			</h1>

			<p class="mx-auto mt-7 max-w-xl text-lg text-pretty text-white/70">
				A learning platform for a school, an academy, or one person with something to teach — from
				the first lesson to the certificate, and the payment that came before it.
			</p>

			<div class="mt-9 flex flex-wrap items-center justify-center gap-3">
				<Button href={resolve('/register')} size="lg" pill>
					Create a workspace
					<Icon icon={ArrowRight01Icon} class="size-4" />
				</Button>
				<Button href="{here}#capabilities" variant="glass" size="lg" pill>
					See everything it does
				</Button>
			</div>
		</div>

		<!-- The dashboard as it renders: a screenshot of the app, not a drawing of one. -->
		<div class="relative mt-16 sm:mt-20" use:inview={{ delay: 120 }}>
			<div
				class="pointer-events-none absolute -inset-x-24 -top-12 bottom-0 -z-10 rounded-[50%] bg-white/10 blur-3xl"
				aria-hidden="true"
			></div>

			<ProductShot
				eager
				src="/marketing/dashboard.webp"
				alt="A learner's dashboard: courses in progress, lessons completed, average progress, and a calendar of what is due."
				path="muallim.app/dashboard"
				class="mx-auto max-w-5xl !ring-white/15"
			/>

			<div class="hero-fade pointer-events-none absolute inset-x-0 -bottom-px h-28 sm:h-36"></div>
		</div>
	</div>

	<!-- The loop a course runs, along the seam where the hero ends. -->
	<div class="hero-foot mt-20 border-t border-white/10">
		<ol class="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
			{#each LIFECYCLE as stage, i (stage.step)}
				<li class="hero-foot px-6 py-8 text-left" use:inview={{ delay: i * 60 }}>
					<span class="numeral text-xs text-white/40">0{i + 1}</span>
					<p class="mt-2 font-medium">{stage.step}</p>
					<p class="mt-1.5 text-sm leading-relaxed text-white/55">{stage.line}</p>
				</li>
			{/each}
		</ol>
	</div>
</section>

<style>
	/* The screenshot dissolves into the hero instead of ending on an edge. The stop
	   colour is the hero's own gradient where the frame ends, or the fade reads as a panel. */
	.hero-fade {
		background: linear-gradient(180deg, transparent, oklch(0.21 0.06 245) 88%);
	}

	/* One flat surface under the rail: the hero's own gradient, repeated per cell, banded. */
	.hero-foot {
		background: oklch(0.25 0.085 244);
	}
</style>
