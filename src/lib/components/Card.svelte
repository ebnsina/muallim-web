<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		/**
		 * `raised` draws the eye — the primary plan, the thing being demonstrated.
		 * Lists of cards stay flat, or the list becomes a texture.
		 */
		elevation?: 'flat' | 'raised';
		/**
		 * The plane this card sits on.
		 *
		 * `raised` is the working surface: white, bordered, the thing to act on.
		 * `sunken` recedes into the page — a summary you read rather than work in.
		 * A page where everything is a white box is a page with one plane, and one
		 * plane is no hierarchy at all: the eye has nowhere to land.
		 */
		surface?: 'raised' | 'sunken';
		/** A soft aurora tint over the surface — the marketing look, theme-aware. */
		aurora?: boolean;
		class?: string;
		children: Snippet;
	};

	let {
		elevation = 'flat',
		surface = 'raised',
		aurora = false,
		class: className,
		children
	}: Props = $props();
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
		'rounded-card border',
		aurora && 'card-aurora border-border',

		// The sunken plane carries no border: it is *below* the page, and a border
		// would draw the outline of a hole. Its fill is the only edge it needs.
		!aurora &&
			(surface === 'sunken' ? 'border-transparent bg-surface-sunken' : 'bg-surface-raised'),

		!aurora &&
			surface === 'raised' &&
			(elevation === 'raised' ? 'border-border-strong' : 'border-border'),
		className
	)}
>
	{@render children()}
</div>
