<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import { cn } from '$lib/utils';

	type Props = {
		href: string;
		/**
		 * `accent` for the link that is the point of the section — the one thing to do
		 * next. `muted` for the one beside a heading that says "there is more of this
		 * elsewhere": it is a way out, not an invitation, and it should not compete
		 * with what is under it.
		 */
		tone?: 'accent' | 'muted';
		class?: string;
		children: Snippet;
	};

	let { href, tone = 'accent', class: className, children }: Props = $props();
</script>

<!--
	A link that leaves — "See the leaderboard", "All courses", "Your certificates".

	The arrow is the whole reason this exists. Twenty of these were written by hand,
	each deciding its own colour and its own hover, and none of them said what they
	were: text that reads like a label until you happen to hover it. The arrow says
	*this goes somewhere* before anybody has to try.

	It nudges out on hover — the direction it is pointing, one pixel. The link is
	underlined at the same moment, so the motion is confirmation and never the only
	signal; a reader who has asked for less of it still gets the underline.
-->
<a
	{href}
	class={cn(
		'group inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline',
		tone === 'accent' ? 'text-accent-text' : 'text-muted hover:text-text',
		className
	)}
>
	{@render children()}
	<Icon
		icon={ArrowUpRight01Icon}
		class="size-4 transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
		strokeWidth={2}
	/>
</a>
