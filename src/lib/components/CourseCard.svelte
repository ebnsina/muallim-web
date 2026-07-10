<script lang="ts">
	import { ArrowRight01Icon, BookOpen01Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import { cn } from '$lib/utils';

	type Tone = 'accent' | 'success' | 'warning' | 'danger';

	type Props = {
		title: string;
		summary?: string;
		difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
		href: string;
		/** Its place in the list, to spread the tints across the grid. */
		index?: number;
	};

	let { title, summary, difficulty, href, index = 0 }: Props = $props();

	/*
		A soft wash per card, for the reference's spread of colour. Four genuinely
		different hues — `info` is dropped because it shares the accent's blue, and
		`danger` is kept: at this lightest step it is a rose, not an alarm, and it is
		the pink the reference leans on.

		The tint is chosen from the position and the title together. Position alone
		paints a three-column grid in three stripes; the title breaks that up, so
		neighbours differ and the colour does not march down a column. Deterministic,
		so the server and the browser agree on it.
	*/
	const TONES: Tone[] = ['accent', 'success', 'warning', 'danger'];
	function hash(text: string): number {
		let h = 0;
		for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
		return Math.abs(h);
	}
	const tone = $derived(TONES[(index + hash(title)) % TONES.length]);

	const PANEL: Record<Tone, string> = {
		accent: 'bg-accent-surface',
		success: 'bg-success-surface',
		warning: 'bg-warning-surface',
		danger: 'bg-danger-surface'
	};
	const GLYPH: Record<Tone, string> = {
		accent: 'text-accent-text',
		success: 'text-success-text',
		warning: 'text-warning-text',
		danger: 'text-danger-text'
	};

	const level = $derived(difficulty.charAt(0).toUpperCase() + difficulty.slice(1));
</script>

<!--
	The card the reference draws: a tinted panel inset within a lighter frame, over a
	plain strip that gives the one plain action. The whole thing is the link, so the
	click target is the card and not the line of text inside it.

	What the tag and strip say is only what the listing knows — a title, a summary,
	a difficulty. The reference's task and module counts are absent because the
	catalogue endpoint does not return them, and a number with nothing behind it is
	worse than no number.
-->
<a
	{href}
	class="group block rounded-2xl border border-border/60 bg-surface-raised p-1.5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
>
	<div class={cn('relative overflow-hidden rounded-xl px-5 pt-5 pb-6', PANEL[tone])}>
		<!-- A large, faint mark on the far side — the reference's illustration, kept
		     as decoration rather than dressed up as a fact. -->
		<Icon
			icon={BookOpen01Icon}
			class={cn('pointer-events-none absolute -right-4 -bottom-5 size-32 opacity-15', GLYPH[tone])}
			strokeWidth={1.5}
		/>

		<span class="relative inline-flex rounded-full bg-surface-raised px-3 py-1 text-xs font-medium">
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
