<script lang="ts">
	import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import TintCard from './TintCard.svelte';

	type Props = {
		title: string;
		summary?: string;
		difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
		href: string;
		/** Its place in the list, to spread the tints across the grid. */
		index?: number;
	};

	let { title, summary, difficulty, href, index = 0 }: Props = $props();

	const level = $derived(difficulty.charAt(0).toUpperCase() + difficulty.slice(1));
</script>

<!--
	A catalogue course, in the shared tinted shell. Only what the listing knows — a
	title, a summary, a difficulty. The reference's task and module counts are
	absent because the endpoint does not return them, and a number with nothing
	behind it is worse than no number.
-->
<TintCard {href} {title} {index}>
	<!-- Frosted, not solid: a translucent pill that lets the tint show through it. -->
	<span
		class="inline-flex rounded-full bg-surface-raised/50 px-3 py-1 text-xs font-medium backdrop-blur-sm"
	>
		{level}
	</span>

	<h2 class="mt-4 text-lg font-semibold text-pretty">{title}</h2>

	{#if summary}
		<p class="text-muted mt-1.5 line-clamp-2 max-w-[38ch] text-sm text-pretty">{summary}</p>
	{/if}

	{#snippet footer()}
		<span class="text-muted text-sm">Read the syllabus</span>
		<span
			class="text-muted flex items-center gap-1 text-sm transition-transform group-hover:translate-x-0.5 group-hover:text-text"
		>
			Open
			<Icon icon={ArrowRight01Icon} class="size-4" />
		</span>
	{/snippet}
</TintCard>
