<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { inview } from '$lib/actions/inview';

	type Props = {
		id?: string;
		/** Text, not a Badge — the marketing site's eyebrows are words. */
		eyebrow: string;
		title: string;
		lead?: string;
		/** A shaded panel instead of open page. Sections separate by tint, never a rule. */
		tinted?: boolean;
		class?: string;
		children: Snippet;
	};

	let { id, eyebrow, title, lead, tinted = false, class: className, children }: Props = $props();
</script>

<section {id} class="px-4 py-16 sm:px-6 sm:py-24">
	<div
		class={cn('mx-auto max-w-6xl', tinted && 'rounded-3xl bg-surface-sunken px-4 py-16 sm:px-10')}
	>
		<div class="max-w-2xl" use:inview>
			<p class="text-sm font-semibold text-accent-text">{eyebrow}</p>
			<h2 class="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
			{#if lead}
				<p class="mt-4 text-lg text-pretty text-muted">{lead}</p>
			{/if}
		</div>

		<div class={cn('mt-12', className)}>
			{@render children()}
		</div>
	</div>
</section>
