<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { Cancel01Icon } from '@hugeicons/core-free-icons';
	import { cn } from '$lib/utils';
	import Icon from './Icon.svelte';

	type Props = {
		class?: string;
		/** The title strip. Omit for a sheet that is only content and actions. */
		header?: Snippet;
		/** The body — the fields, the reading, whatever the sheet is about. */
		children: Snippet;
		/** The action strip, pinned to the foot. Omit for a sheet with no actions. */
		footer?: Snippet;
		/**
		 * Pass this to make the sheet a right-edge slide-over that opens on demand:
		 * bind it to the trigger's state. Omit it entirely and the sheet renders as a
		 * plain inline card (the always-visible case, e.g. a register a page is *about*).
		 */
		open?: boolean;
		/** Called when the overlay is dismissed by the backdrop, Escape, or the close button. */
		onClose?: () => void;
	};

	let { class: className, header, children, footer, open = undefined, onClose }: Props = $props();

	// A sheet is a slide-over only when a caller opts in with `open`; otherwise it is
	// the inline card it always was, and nothing about those pages changes.
	const overlay = $derived(open !== undefined);

	// Closing is the caller's to do — the page owns the open flag and (usually)
	// wraps the sheet in `{#if open}`, so `onClose` unmounts it and the fly-out
	// plays. The component never fights that with a second source of truth.
	function close() {
		onClose?.();
	}

	// A dialog owns the page while it is up: the body underneath must not scroll, or
	// a long form drags the list behind it. Compensate the vanished scrollbar with
	// equal padding so the page does not jump sideways as it opens.
	$effect(() => {
		if (!overlay || !open) return;
		const gap = window.innerWidth - document.documentElement.clientWidth;
		const prevOverflow = document.body.style.overflow;
		const prevPad = document.body.style.paddingRight;
		document.body.style.overflow = 'hidden';
		if (gap > 0) document.body.style.paddingRight = `${gap}px`;
		return () => {
			document.body.style.overflow = prevOverflow;
			document.body.style.paddingRight = prevPad;
		};
	});
</script>

<!--
	A sheet: a header, a content region, and a footer, each with its own rule
	between them. A form is the case it was built for. Given `open`, it is a
	right-edge slide-over over a dimmed page; without it, the same three parts as a
	plain inline card. Either way, wrap it in a `<form>` and the footer's submit
	still submits.
-->
<svelte:window
	onkeydown={(e) => {
		if (overlay && open && e.key === 'Escape') close();
	}}
/>

{#if !overlay}
	<div class={cn('overflow-hidden rounded-card border border-border bg-surface-raised', className)}>
		{#if header}
			<div class="border-b border-border px-5 py-4 sm:px-6">{@render header()}</div>
		{/if}
		<div class="px-5 py-5 sm:px-6">{@render children()}</div>
		{#if footer}
			<div
				class="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-surface-sunken/40 px-5 py-4 sm:px-6"
			>
				{@render footer()}
			</div>
		{/if}
	</div>
{:else if open}
	<div class="fixed inset-0 z-50 flex justify-end">
		<button
			type="button"
			aria-label="Close"
			class="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
			onclick={close}
			transition:fade={{ duration: 150 }}
		></button>

		<div
			role="dialog"
			aria-modal="true"
			class={cn(
				'relative flex h-full w-full max-w-md flex-col bg-surface-raised shadow-2xl',
				className
			)}
			transition:fly={{ x: 420, duration: 220, opacity: 1 }}
		>
			<div class="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
				<div class="min-w-0 flex-1">
					{#if header}{@render header()}{/if}
				</div>
				<button
					type="button"
					onclick={close}
					aria-label="Close"
					class="-mr-1 shrink-0 rounded-control p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				>
					<Icon icon={Cancel01Icon} class="size-4" />
				</button>
			</div>

			<div class="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{@render children()}</div>

			{#if footer}
				<div
					class="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-surface-sunken/40 px-5 py-4 sm:px-6"
				>
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
