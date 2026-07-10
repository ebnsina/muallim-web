<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		/**
		 * `raised` draws the eye — the primary plan, the thing being demonstrated.
		 * Lists of cards stay flat, or the list becomes a texture.
		 */
		elevation?: 'flat' | 'raised';
		class?: string;
		children: Snippet;
	};

	let { elevation = 'flat', class: className, children }: Props = $props();
</script>

<!--
	A border separates, and nothing else does. This system ships no shadow: a
	blurred grey rectangle under an element does not theme — the same blur that
	reads as depth on white reads as grime on a dark surface — and forty of them
	down a marking queue is a queue nobody can read.

	So `raised` is a heavier border, not a drop shadow. It is a way of saying "look
	here", and `flat` is the default because most cards are not the thing to look at.
-->
<div
	class={cn(
		'rounded-card border bg-surface-raised',
		elevation === 'raised' ? 'border-border-strong' : 'border-border',
		className
	)}
>
	{@render children()}
</div>
