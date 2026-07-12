<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/**
		 * Renders the whole row as a link. A row whose only clickable target is the
		 * title inside it is a row people click and miss.
		 */
		href?: string;
		/**
		 * Held up by a shadow instead of outlined by a border — for a list of rows lying
		 * *on* the page rather than in it. Same exception, and same reasoning, as
		 * `Card float`: a dozen loose rows each drawn with a box is a dozen boxes.
		 */
		float?: boolean;
		class?: string;
		children: Snippet;
	};

	let { href, float = false, class: className, children }: Props = $props();

	// `focus-visible:ring-inset`, because a ring drawn outside a bordered row in a
	// divided list is a ring clipped by its neighbours.
	const base = $derived([
		'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-control border px-4 py-3',
		float ? 'border-transparent bg-surface-raised shadow-card' : 'border-border'
	]);

	// The press is a shade, not a scale. A row runs the width of the page, and a
	// full-width element that scales under the pointer reads as the page flexing —
	// the transform that flatters a card makes a list wobble.
	// A floating row deepens its shadow where a bordered one darkens its edge: the
	// hover has to answer the thing that is actually holding the row up.
	const interactive = $derived([
		'duration-(--duration-press) ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
		float
			? 'transition-shadow hover:shadow-card-hover'
			: 'transition-colors hover:border-border-strong hover:bg-surface-sunken active:bg-surface-active'
	]);
</script>

<!--
	One item in a list of things: a course, a submission, a question.

	Written out by hand in five places, with the padding and the border and the
	gap each slightly different in each. What varies between them is what is in
	them, which is the part that belongs in the page.
-->
{#if href}
	<a {href} class={[base, interactive, className]}>
		{@render children()}
	</a>
{:else}
	<div class={[base, className]}>
		{@render children()}
	</div>
{/if}
