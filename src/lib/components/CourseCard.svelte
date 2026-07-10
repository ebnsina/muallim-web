<script lang="ts">
	import { ArrowRight01Icon, BookOpen01Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import { courseHue } from '$lib/tint';

	type Props = {
		title: string;
		summary?: string;
		difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
		href: string;
		/** Its place in the list, to spread the tints across the grid. */
		index?: number;
	};

	let { title, summary, difficulty, href, index = 0 }: Props = $props();

	const hue = $derived(courseHue(title, index));
	const level = $derived(difficulty.charAt(0).toUpperCase() + difficulty.slice(1));
</script>

<!--
	The card the reference draws: a tinted panel inset within a lighter frame, over
	a plain strip that gives the one plain action. The whole thing is the link, so
	the click target is the card and not the line of text inside it. It answers a
	hover by lifting a little — a scale, not a shadow.

	What the tag and strip say is only what the listing knows — a title, a summary,
	a difficulty. The reference's task and module counts are absent because the
	catalogue endpoint does not return them, and a number with nothing behind it is
	worse than no number.
-->
<a
	{href}
	style="--h: {hue}"
	class="group block rounded-2xl border border-border/60 bg-surface-raised p-1 transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
>
	<div class="panel relative overflow-hidden rounded-xl px-5 pt-5 pb-6">
		<!-- A large, faint mark on the far side — the reference's illustration, kept
		     as decoration rather than dressed up as a fact. The icon strokes with
		     currentColor, so the hue is set on the wrapper. -->
		<span class="ink pointer-events-none absolute -right-4 -bottom-5 block size-32 opacity-20">
			<Icon icon={BookOpen01Icon} class="size-full" strokeWidth={1.5} />
		</span>

		<!-- Frosted, not solid: a translucent pill that lets the tint show through it. -->
		<span
			class="relative inline-flex rounded-full bg-surface-raised/50 px-3 py-1 text-xs font-medium backdrop-blur-sm"
		>
			{level}
		</span>

		<h2 class="relative mt-4 text-lg font-semibold text-pretty">{title}</h2>

		{#if summary}
			<p class="text-muted relative mt-1.5 line-clamp-2 max-w-[38ch] text-sm text-pretty">
				{summary}
			</p>
		{/if}
	</div>

	<div class="flex items-center justify-between gap-3 px-3.5 py-3">
		<span class="text-muted text-sm">Read the syllabus</span>
		<span
			class="text-muted flex items-center gap-1 text-sm transition-transform group-hover:translate-x-0.5 group-hover:text-text"
		>
			Open
			<Icon icon={ArrowRight01Icon} class="size-4" />
		</span>
	</div>
</a>

<style>
	/*
		The wash and its ink, from the one hue the script hands down. Light and dark
		are two different jobs: a pale tint on a bright page, a muted one on a dark
		one — same hue, so a course looks like itself in either.
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
