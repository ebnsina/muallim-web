<script lang="ts">
	import type { Snippet } from 'svelte';

	export type PageWidth = 'prose' | 'wide' | 'full';

	type Props = {
		/**
		 * `prose` for something to read, `wide` for a list or a form with a lot in it,
		 * `full` for a page with a sidebar. Three, because a fourth would be somebody
		 * picking a number.
		 */
		width?: PageWidth;
		class?: string;
		children: Snippet;
	};

	let { width = 'prose', class: className, children }: Props = $props();

	const WIDTHS: Record<PageWidth, string> = {
		prose: 'max-w-2xl',
		wide: 'max-w-5xl',

		/*
			`full` is the widest of the three, not the window. The sheet under it runs to
			both edges; the page on it keeps a gutter, because text with none runs into
			the window and a line 1400px long is a line nobody can find their way back
			across.
		*/
		full: 'max-w-7xl'
	};
</script>

<!--
	The frame every page inside the app sits in.

	It existed before, copied: `mx-auto max-w-2xl px-6 py-16` on nine pages,
	`max-w-3xl px-6 py-16` on four, and two more that had drifted to `py-12` and
	`py-10`. Nobody chose the difference; it accumulated. A page's width is a
	decision about what is on it, and the three that were meant are named here.

	No `min-h-dvh`. The app layout owns the viewport, and a `<main>` that claims a
	full screen height beneath a 4rem header makes every page scroll by 4rem.
-->
<main class={['mx-auto w-full px-6 py-10', WIDTHS[width], className]}>
	{@render children()}
</main>
