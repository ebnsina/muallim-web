<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
		/** The title strip. Omit for a sheet that is only content and actions. */
		header?: Snippet;
		/** The body — the fields, the reading, whatever the sheet is about. */
		children: Snippet;
		/** The action strip, pinned to the foot. Omit for a sheet with no actions. */
		footer?: Snippet;
	};

	let { class: className, header, children, footer }: Props = $props();
</script>

<!--
	A sheet: a card split into a header, a content region, and a footer, each with
	its own rule between them. A form is the case it was built for — a title at the
	top, the fields in the middle, the submit pinned to the foot where a reader
	looks for it — but it holds anything that wants those three parts. Wrap it in a
	`<form>` and the footer's submit button still submits, wherever it sits.
-->
<div class={cn('overflow-hidden rounded-card border border-border bg-surface-raised', className)}>
	{#if header}
		<div class="border-b border-border px-5 py-4 sm:px-6">
			{@render header()}
		</div>
	{/if}

	<div class="px-5 py-5 sm:px-6">
		{@render children()}
	</div>

	{#if footer}
		<div
			class="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-surface-sunken/40 px-5 py-4 sm:px-6"
		>
			{@render footer()}
		</div>
	{/if}
</div>
