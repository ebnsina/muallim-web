<script lang="ts">
	import { PlusSignIcon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import { cn } from '$lib/utils';

	type Highlight = { id: string; quote: string; note: string; start: number; end: number };

	type Props = {
		/** The lesson text, rendered whitespace-preserving. Offsets index into it. */
		content: string;
		highlights: Highlight[];
		/** A passage was selected and confirmed. Offsets are into `content`, end exclusive. */
		onadd?: (selection: { quote: string; start: number; end: number }) => void;
		class?: string;
	};

	let { content, highlights, onadd, class: className }: Props = $props();

	let root = $state<HTMLElement>();
	let popover = $state<{ x: number; y: number; quote: string; start: number; end: number } | null>(
		null
	);

	// Only marks whose text still matches the lesson are drawn in place. When an
	// author edits a lesson, the offsets no longer land on the same words; rather
	// than paint the mark over the wrong sentence, the passage drops out of the text
	// and lives on only in the list, where its quote still says what it was.
	const anchored = $derived(
		highlights.filter(
			(h) => h.start >= 0 && h.end <= content.length && content.slice(h.start, h.end) === h.quote
		)
	);

	// The text cut at every mark boundary. A run covered by any mark is wrapped; one
	// covered by several carries all their ids, and a click picks the first.
	const segments = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a local set built and consumed inside this derived, never reactive state
		const points = new Set<number>([0, content.length]);
		for (const h of anchored) {
			points.add(h.start);
			points.add(h.end);
		}
		const sorted = [...points].filter((p) => p >= 0 && p <= content.length).sort((a, b) => a - b);

		const out: { text: string; marked: boolean; note: string }[] = [];
		for (let i = 0; i < sorted.length - 1; i++) {
			const start = sorted[i];
			const end = sorted[i + 1];
			if (start >= end) continue;
			const covering = anchored.filter((h) => h.start <= start && h.end >= end);
			// The note of the first mark over this run, shown as its tooltip.
			const note = covering.find((h) => h.note !== '')?.note ?? '';
			out.push({ text: content.slice(start, end), marked: covering.length > 0, note });
		}
		return out;
	});

	// The character offset of a DOM position within the whole text, measured by the
	// length of everything before it. Robust to the marks already in the DOM: it
	// reads text, not nodes.
	function offsetOf(node: Node, nodeOffset: number): number {
		if (!root) return 0;
		const range = document.createRange();
		range.selectNodeContents(root);
		range.setEnd(node, nodeOffset);
		return range.toString().length;
	}

	function onSelectionChange() {
		const selection = window.getSelection();
		if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !root) {
			popover = null;
			return;
		}

		const range = selection.getRangeAt(0);
		if (!root.contains(range.commonAncestorContainer)) {
			popover = null;
			return;
		}

		const start = offsetOf(range.startContainer, range.startOffset);
		const end = offsetOf(range.endContainer, range.endOffset);
		if (end <= start) {
			popover = null;
			return;
		}

		const rect = range.getBoundingClientRect();
		popover = {
			x: rect.left + rect.width / 2,
			y: rect.top,
			quote: content.slice(start, end),
			start,
			end
		};
	}

	function confirm() {
		if (!popover) return;
		onadd?.({ quote: popover.quote, start: popover.start, end: popover.end });
		popover = null;
		window.getSelection()?.removeAllRanges();
	}
</script>

<svelte:document onselectionchange={onSelectionChange} />

<div bind:this={root} class={cn('whitespace-pre-wrap', className)}>
	{#each segments as segment, index (index)}
		{#if segment.marked}
			<!-- Visual only, and keyboard-neutral: the mark shows where a passage is
			     kept and hovers up its note; editing and removing it live in the list,
			     which every reader can reach. -->
			<mark
				class="rounded-[3px] bg-warning-surface px-0.5 text-text"
				title={segment.note || 'Your highlight'}
			>
				{segment.text}
			</mark>
		{:else}{segment.text}{/if}
	{/each}
</div>

{#if popover}
	<!--
		A pill above the selection, in fixed coordinates from the selection's own
		rectangle. It disappears the moment the selection collapses, so it never
		lingers over text nobody is choosing.
	-->
	<div
		class="fixed z-40 -translate-x-1/2 -translate-y-full pb-2"
		style="left: {popover.x}px; top: {popover.y}px"
	>
		<button
			type="button"
			class="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm font-medium shadow-md transition-colors hover:bg-surface-sunken"
			onmousedown={(event) => event.preventDefault()}
			onclick={confirm}
		>
			<Icon icon={PlusSignIcon} class="size-4" />
			Add note
		</button>
	</div>
{/if}
