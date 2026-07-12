<script lang="ts">
	type Props = { description: string };
	let { description }: Props = $props();

	// The description is long by design, so it is clamped until asked for.
	let expanded = $state(false);
</script>

<section class="mt-12">
	<h2 class="text-xl font-semibold">Description</h2>

	<div class="relative mt-4">
		<div
			id="course-description"
			class="text-muted max-w-2xl space-y-4 text-sm leading-relaxed whitespace-pre-wrap"
			class:max-h-64={!expanded}
			class:overflow-hidden={!expanded}
		>
			{description}
		</div>

		{#if !expanded}
			<!-- The fade says there is more, before the button has to. -->
			<div
				class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent"
			></div>
		{/if}
	</div>

	<button
		type="button"
		class="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent-text underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
		aria-expanded={expanded}
		aria-controls="course-description"
		onclick={() => (expanded = !expanded)}
	>
		{expanded ? 'Show less' : 'Show more'}
	</button>
</section>
