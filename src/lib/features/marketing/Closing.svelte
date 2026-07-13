<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
	import { Button, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
</script>

<section class="px-6 pb-24">
	<div
		class="hero-blue squircle relative isolate mx-auto max-w-6xl overflow-hidden px-6 py-20 text-center text-white sm:py-24"
		use:inview
	>
		<div class="grain pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true"></div>

		<h2
			class="mx-auto max-w-2xl text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] font-semibold tracking-tight text-balance"
		>
			Your workspace is one form away.
		</h2>

		<p class="mx-auto mt-5 max-w-lg text-lg text-pretty text-white/70">
			Claim it, author the first course, and invite the first cohort. Nothing here is a trial that
			expires while you are still writing lesson two.
		</p>

		<div class="mt-9 flex flex-wrap items-center justify-center gap-3">
			<Button href={resolve('/register')} size="lg" pill>
				Create a workspace
				<Icon icon={ArrowRight01Icon} class="size-4" />
			</Button>
			<Button href={resolve('/courses')} variant="glass" size="lg" pill>Browse the catalog</Button>
		</div>
	</div>
</section>
