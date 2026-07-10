<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/**
		 * Renders the whole row as a link. A row whose only clickable target is the
		 * title inside it is a row people click and miss.
		 */
		href?: string;
		class?: string;
		children: Snippet;
	};

	let { href, class: className, children }: Props = $props();

	// `focus-visible:ring-inset`, because a ring drawn outside a bordered row in a
	// divided list is a ring clipped by its neighbours.
	const base =
		'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-control border border-border px-4 py-3';
	const interactive =
		'transition-colors hover:border-border-strong hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none';
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
