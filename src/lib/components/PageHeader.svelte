<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		/** One sentence on what this page is for. Omit rather than pad. */
		description?: string;
		/** Sits under the title: a status badge, a count, a duration. */
		meta?: Snippet;
		/** Sits opposite the title, right-aligned: the page's primary action. */
		actions?: Snippet;
		class?: string;
	};

	let { title, description, meta, actions, class: className }: Props = $props();
</script>

<!--
	One `h1` per page, at one size, with the description at one size beneath it.

	Every page had its own: `text-2xl font-semibold` here, `text-3xl tracking-tight`
	there, `mt-1 text-sm` on one description and `mt-3 text-lg` on another. The
	heading is the first thing on the page and it was the least consistent thing
	about it.

	`actions` wraps under the title rather than shrinking it. A course called "An
	Introduction to the Optics of Ibn al-Haytham" should not be truncated so that a
	button can sit beside it.
-->
<header class={['flex flex-wrap items-start justify-between gap-x-6 gap-y-4', className]}>
	<div class="min-w-0">
		<h1 class="text-2xl font-semibold tracking-tight text-pretty sm:text-3xl">{title}</h1>

		{#if description}
			<p class="text-muted mt-2 max-w-2xl text-pretty">{description}</p>
		{/if}

		{#if meta}
			<div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
				{@render meta()}
			</div>
		{/if}
	</div>

	{#if actions}
		<div class="flex shrink-0 items-center gap-3">
			{@render actions()}
		</div>
	{/if}
</header>
