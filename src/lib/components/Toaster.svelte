<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import {
		Alert02Icon,
		CancelCircleIcon,
		Cancel01Icon,
		CheckmarkCircle02Icon,
		InformationCircleIcon
	} from '@hugeicons/core-free-icons';

	import { DURATION, easeInOut, easeOut, prefersReducedMotion } from '$lib/motion';
	import { toast, VISIBLE, type ToastTone } from '$lib/toast.svelte';
	import Icon from './Icon.svelte';

	const TONES: Record<ToastTone, { icon: typeof Alert02Icon; word: string; class: string }> = {
		info: {
			icon: InformationCircleIcon,
			word: 'Information',
			class: 'border-info-border bg-info-surface text-info-text'
		},
		success: {
			icon: CheckmarkCircle02Icon,
			word: 'Success',
			class: 'border-success-border bg-success-surface text-success-text'
		},
		warning: {
			icon: Alert02Icon,
			word: 'Warning',
			class: 'border-warning-border bg-warning-surface text-warning-text'
		},
		danger: {
			icon: CancelCircleIcon,
			word: 'Error',
			class: 'border-danger-border bg-danger-surface text-danger-text'
		}
	};

	/**
	 * Collapsed until the reader reaches for it.
	 *
	 * A stack of four notices in a corner is four things to read. Collapsed, it is
	 * one thing with a hint that there are more behind it; hovering or tabbing into
	 * it fans them out. This is the behavior every good toast library converged on
	 * independently, which is usually a sign it is the right one.
	 */
	let expanded = $state(false);

	// Where each toast sits, by its position in the stack. Index 0 is the front.
	const OFFSET = 14; // px, between the peeking edges when collapsed
	const GAP = 8; // px, between cards when fanned out
	const SCALE = 0.05; // each card behind is 5% smaller

	/** Measured, so an expanded stack knows how far to push the ones behind it. */
	let heights = $state<number[]>([]);

	/*
		The stack is anchored to the bottom-right of the window, so everything behind
		the front card travels *up*. Fanning downward would push the oldest notice off
		the bottom of the screen, where the only way to read it is to not have moved
		the mouse there in the first place.
	*/
	function placement(index: number) {
		if (index >= VISIBLE) {
			// Behind the stack: parked at the back edge and invisible, but still in the
			// DOM so its own dismissal animates rather than popping.
			return { y: -(VISIBLE - 1) * OFFSET, scale: 1 - VISIBLE * SCALE, opacity: 0 };
		}

		if (!expanded) {
			return { y: -index * OFFSET, scale: 1 - index * SCALE, opacity: 1 };
		}

		// Fanned out: each card clears the full height of the ones in front of it.
		const ahead = heights.slice(0, index).reduce((total, height) => total + height + GAP, 0);
		return { y: -ahead, scale: 1, opacity: 1 };
	}

	function transform(index: number) {
		const { y, scale, opacity } = placement(index);
		return `transform: translateY(${y}px) scale(${scale}); opacity: ${opacity};`;
	}

	// Svelte's own transitions compile to CSS animations, which the global
	// reduced-motion rule already collapses. `flip` and the inline transform do not,
	// so they are switched off here rather than merely shortened.
	const motion = $derived(prefersReducedMotion() ? 0 : DURATION.base);
</script>

<!--
	One live region for the whole stack, not one per toast.

	A region announces its own additions; a region created *with* content is often
	announced by nothing at all. `polite` waits for a pause in whatever the reader
	is doing — an error that interrupts is an error the reader loses their place to.

	The list is `aria-relevant="additions"` so removing an expired toast is not read
	out as an event. Nobody needs to hear that a notice went away on its own.
-->
<section
	aria-label="Notifications"
	class="pointer-events-none fixed right-4 bottom-4 z-50 w-[min(24rem,calc(100vw-2rem))]"
	onpointerenter={() => {
		expanded = true;
		toast.pause();
	}}
	onpointerleave={() => {
		expanded = false;
		toast.resume();
	}}
	onfocusin={() => {
		expanded = true;
		toast.pause();
	}}
	onfocusout={() => {
		expanded = false;
		toast.resume();
	}}
>
	<ol
		aria-live="polite"
		aria-relevant="additions"
		class="relative list-none"
		style="height: {heights[0] ?? 0}px"
	>
		{#each toast.toasts as item, index (item.id)}
			<!--
				Enter at 180ms, leave at 120ms. A notice that is arriving is worth watching
				land; one that is leaving has already been read, and holding the reader
				there for the full entrance again is the animation charging rent.
			-->
			<!-- The flip is the stack closing up after a dismissal — cards that were
			     already on screen changing places, so `easeInOut`. Arriving and leaving
			     are entrances, so those are `easeOut`. Same list, two different jobs. -->
			<li
				animate:flip={{ duration: motion, easing: easeInOut }}
				in:fly={{ y: 24, duration: DURATION.base, easing: easeOut }}
				out:fly={{ y: 24, duration: DURATION.instant, easing: easeOut }}
				bind:clientHeight={heights[index]}
				aria-hidden={index >= VISIBLE ? 'true' : undefined}
				class="pointer-events-auto absolute inset-x-0 bottom-0 origin-bottom
				       transition-[transform,opacity] duration-(--duration-base) ease-out"
				style="{transform(index)} z-index: {toast.toasts.length - index};"
			>
				<!--
					A toast is the one thing here that genuinely floats, and it still gets no
					shadow. Its tinted fill against the page, and its own colored border, are
					what lift it — and unlike a shadow, both of them theme.
				-->
				<div
					class="flex items-start gap-3 rounded-card border px-4 py-3 text-sm
					       {TONES[item.tone].class}"
				>
					<Icon icon={TONES[item.tone].icon} class="mt-0.5 size-4 shrink-0" />

					<div class="min-w-0 flex-1">
						<span class="sr-only">{TONES[item.tone].word}:</span>
						{#if item.title}
							<p class="font-semibold">{item.title}</p>
						{/if}
						<p class={item.title ? 'mt-0.5' : undefined}>{item.message}</p>
					</div>

					<button
						type="button"
						onclick={() => toast.dismiss(item.id)}
						aria-label="Dismiss: {item.title ?? item.message}"
						class="-m-1 shrink-0 rounded-pill p-1 opacity-60 transition-opacity hover:opacity-100"
					>
						<Icon icon={Cancel01Icon} class="size-4" />
					</button>
				</div>
			</li>
		{/each}
	</ol>
</section>
