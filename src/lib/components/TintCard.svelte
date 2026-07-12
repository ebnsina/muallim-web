<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		/** When set, the whole card is that link and lifts on hover. */
		href?: string;
		/** Lift on hover. Defaults to true for a link, false otherwise. */
		interactive?: boolean;
		/** Extra classes on the outer frame. */
		class?: string;
		/**
		 * Replaces the panel's own fill and padding. For a card whose panel *is* the
		 * picture — a cover that runs to the edges — rather than a tinted box with text
		 * inside it.
		 */
		panelClass?: string;
		/** The panel's contents — a badge, a title, a line of meta. */
		children: Snippet;
		/** The plain strip below the panel. Omit it for a card with no footer. */
		footer?: Snippet;
	};

	let { href, interactive, class: className, panelClass, children, footer }: Props = $props();

	const lifts = $derived(interactive ?? href != null);

	/*
		`motion-safe:` on both transforms, so a reduced-motion reader gets a card that
		simply does not move — rather than one that jumps, which is what a killed
		transition on a live `:hover` transform leaves behind.

		The press is a hair under the resting size while the hover is a hair over, so
		clicking a raised card pushes it back *through* its own resting state. That is
		the direction a physical thing moves when you press it, and getting the sign
		wrong is what makes a card feel like it is fleeing the cursor.
	*/
	const frame = $derived(
		cn(
			'group flex h-full flex-col rounded-2xl border border-border/60 bg-surface-raised p-1',
			lifts &&
				'transition-transform duration-(--duration-base) ease-out ' +
					'motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.99] ' +
					'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
			className
		)
	);
</script>

<!--
	The reusable shell behind every card: a lighter frame with a small inset, a
	`rounded-xl` slate panel, and an optional strip below. One neutral colour, on
	purpose — a card's colour is not a place to encode anything, so it encodes
	nothing and lets a badge or a bar carry the meaning. What goes in the panel and
	the strip is the caller's, so the same frame carries a catalogue card, a
	management row, or anything else.
-->
{#snippet body()}
	<div class={cn('flex-1 rounded-xl bg-surface-sunken px-5 pt-5 pb-6', panelClass)}>
		{@render children()}
	</div>

	{#if footer}
		<div class="flex items-center justify-between gap-3 px-3.5 py-3">
			{@render footer()}
		</div>
	{/if}
{/snippet}

{#if href}
	<a {href} class={frame} data-tint-card>
		{@render body()}
	</a>
{:else}
	<div class={frame} data-tint-card>
		{@render body()}
	</div>
{/if}
