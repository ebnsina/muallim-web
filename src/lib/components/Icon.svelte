<script lang="ts">
	import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/svelte';

	type Props = {
		icon: IconSvgElement;
		class?: string;
		strokeWidth?: number;
		/** Set only when the icon is the *only* thing carrying the meaning. */
		title?: string;
	};

	let { icon, class: className = 'size-4', strokeWidth = 1.75, title }: Props = $props();
</script>

<!--
	The one place an icon is drawn.

	Every glyph comes from @hugeicons/core-free-icons, which ships them as data. A
	hand-copied `<svg>` in a component is a viewBox somebody got wrong, a stroke
	that does not match its neighbours, and a `fill` that ignores `currentColor` —
	each of which is invisible until it is not.

	`size` is left at its default and the dimensions come from the class, so an icon
	scales with the text it sits beside. Hidden from assistive tech unless given a
	title: an icon in this system always has a word next to it, and a screen reader
	announcing "tick, Correct" says the same thing twice.

	The props are listed rather than spread. `HugeiconsIcon` takes a narrower set
	than `SVGAttributes` allows, and forwarding the difference is a type error that
	only shows up in whichever component happens to pass the wrong one.
-->
<HugeiconsIcon
	{icon}
	{strokeWidth}
	class={className}
	role={title ? 'img' : undefined}
	aria-label={title}
	aria-hidden={title ? undefined : 'true'}
/>
