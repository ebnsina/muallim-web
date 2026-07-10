<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import { BookOpen01Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import { cn } from '$lib/utils';
	import { courseHue } from '$lib/tint';

	type Props = {
		/** When set, the whole card is that link and lifts on hover. */
		href?: string;
		/** Seeds the tint when no explicit `hue` is given. */
		title?: string;
		/** Its place in a list, to spread the tints across a grid. */
		index?: number;
		/** An explicit hue in degrees, overriding the one derived from the title. */
		hue?: number;
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
		title,
		index = 0,
		hue,
		glyph = BookOpen01Icon,
		interactive,
		class: className,
		children,
		footer
	}: Props = $props();

	const resolvedHue = $derived(hue ?? courseHue(title ?? '', index));
	const lifts = $derived(interactive ?? href != null);

	const frame = $derived(
		cn(
			'group block rounded-2xl border border-border/60 bg-surface-raised p-1',
			lifts &&
				'transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
			className
		)
	);
</script>

<!--
	The reusable shell behind every tinted card: a lighter frame with a small inset,
	a `rounded-xl` panel washed in one generated hue, an optional faint mark, and an
	optional strip below. What goes in the panel and the strip is the caller's, so
	the same frame carries a marketing card, a management row, or anything else
	without any of them re-deriving the wash, the inset, or the hover.
-->
{#snippet body()}
	<div class="panel relative overflow-hidden rounded-xl px-5 pt-5 pb-6" style="--h: {resolvedHue}">
		{#if glyph}
			<!-- The icon strokes with currentColor, so the hue is set on the wrapper. -->
			<span class="ink pointer-events-none absolute -right-4 -bottom-5 block size-32 opacity-20">
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

<style>
	/*
		The wash and its ink, from the one hue the caller hands down. Light and dark
		are two different jobs: a pale tint on a bright page, a muted one on a dark
		one — same hue, so a thing looks like itself in either.
	*/
	.panel {
		background-color: oklch(0.955 0.035 var(--h));
	}
	.ink {
		color: oklch(0.5 0.13 var(--h));
	}

	:global(html[data-theme='dark']) .panel {
		background-color: oklch(0.3 0.045 var(--h));
	}
	:global(html[data-theme='dark']) .ink {
		color: oklch(0.8 0.09 var(--h));
	}
</style>
