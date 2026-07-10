<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import { BookOpen01Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import { cn } from '$lib/utils';

	type Props = {
		/** When set, the whole card is that link and lifts on hover. */
		href?: string;
		/** The faint mark in the far corner. Set to `null` for none. */
		glyph?: IconSvgElement | null;
		/** Lift on hover. Defaults to true for a link, false otherwise. */
		interactive?: boolean;
		/** Extra classes on the outer frame. */
		class?: string;
		/** The panel's contents — a badge, a title, a line of meta. */
		children: Snippet;
		/** The plain strip below the panel. Omit it for a card with no footer. */
		footer?: Snippet;
	};

	let {
		href,
		glyph = BookOpen01Icon,
		interactive,
		class: className,
		children,
		footer
	}: Props = $props();

	const lifts = $derived(interactive ?? href != null);

	const frame = $derived(
		cn(
			'group flex h-full flex-col rounded-2xl border border-border/60 bg-surface-raised p-1',
			lifts &&
				'transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
			className
		)
	);
</script>

<!--
	The reusable shell behind every card: a lighter frame with a small inset, a
	`rounded-xl` slate panel, an optional faint mark, and an optional strip below.
	One neutral colour, on purpose — a card's colour is not a place to encode
	anything, so it encodes nothing and lets a badge or a bar carry the meaning.
	What goes in the panel and the strip is the caller's, so the same frame carries
	a catalogue card, a management row, or anything else.
-->
{#snippet body()}
	<div class="relative flex-1 overflow-hidden rounded-xl bg-surface-sunken px-5 pt-5 pb-6">
		{#if glyph}
			<span
				class="text-border-strong pointer-events-none absolute -right-4 -bottom-5 block size-32 opacity-60"
			>
				<Icon icon={glyph} class="size-full" strokeWidth={1.5} />
			</span>
		{/if}
		<div class="relative">{@render children()}</div>
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
