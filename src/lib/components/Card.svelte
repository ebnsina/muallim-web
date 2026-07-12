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
		/**
		 * Lifted by a shadow instead of outlined by a border.
		 *
		 * The system's rule is that a border separates and nothing else does, and it is
		 * still the rule for a form, a table, a panel — anything that sits *in* the page.
		 * A card that floats *on* it is the exception: a dozen loose cards each drawn
		 * with a box is a dozen boxes, and the shadow says "off the page" where the box
		 * only says "here is an edge".
		 *
		 * The shadow is two tokens, and in dark mode they resolve to a hairline ring —
		 * a shadow on a dark surface is a smudge nobody can see. See tokens.css.
		 */
		float?: boolean;
		/** A soft aurora tint over the surface — the marketing look, theme-aware. */
		aurora?: boolean;
		class?: string;
		children: Snippet;
	};

	let {
		elevation = 'flat',
		surface = 'raised',
		float = false,
		aurora = false,
		class: className,
		children
	}: Props = $props();
</script>

<!--
	A border separates, and mostly nothing else does: a blurred grey rectangle under
	an element does not theme — the same blur that reads as depth on white reads as
	grime on a dark surface — and forty of them down a marking queue is a queue
	nobody can read. So `raised` is a heavier border, not a drop shadow, and `flat`
	is the default because most cards are not the thing to look at.

	`float` is the one exception, and it is spent where the rule stops paying: a
	scatter of loose cards on one surface, each of which a border would draw a box
	around. It resolves to a hairline ring in dark mode, where a shadow is nothing.
-->
<div
	class={cn(
		'rounded-card border',
		aurora && 'card-aurora border-border',

		// The sunken plane carries no border: it is *below* the page, and a border
		// would draw the outline of a hole. Its fill is the only edge it needs.
		!aurora &&
			(surface === 'sunken' ? 'border-transparent bg-surface-sunken' : 'bg-surface-raised'),

		// A floating card is held up by its shadow, so it has no border to hold it in.
		!aurora && float && 'border-transparent shadow-card',

		!aurora &&
			!float &&
			surface === 'raised' &&
			(elevation === 'raised' ? 'border-border-strong' : 'border-border'),
		className
	)}
>
	{@render children()}
</div>
