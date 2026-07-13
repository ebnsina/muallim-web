<script lang="ts">
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { LIFECYCLE } from './content';
</script>

<Section
	id="how"
	eyebrow="The loop"
	title="One workspace carries a course from an idea to a certificate."
	lead="No second tool for the quiz, no spreadsheet for the grades, no third party for the checkout."
	class="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4"
>
	{#each LIFECYCLE as stage, i (stage.step)}
		<div class="relative" use:inview={{ delay: i * 70 }}>
			<!-- The rail: a hairline through the numbers, cut off after the last one. -->
			{#if i < LIFECYCLE.length - 1}
				<span
					aria-hidden="true"
					class="absolute top-4 left-8 hidden h-px w-[calc(100%-1rem)] bg-border lg:block"
				></span>
			{/if}

			<span
				class="relative flex size-8 items-center justify-center rounded-pill bg-accent text-sm font-semibold text-on-solid"
			>
				<span class="numeral">{i + 1}</span>
			</span>

			<h3 class="mt-4 font-semibold">{stage.step}</h3>
			<p class="mt-1.5 text-sm text-pretty text-muted">{stage.line}</p>
		</div>
	{/each}
</Section>
