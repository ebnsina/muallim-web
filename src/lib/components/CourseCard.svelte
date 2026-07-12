<script lang="ts">
	import { auroraFor, cn } from '$lib/utils';
	import Difficulty from './Difficulty.svelte';
	import TintCard from './TintCard.svelte';

	type Props = {
		title: string;
		summary?: string;
		difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
		lessonCount?: number;
		href: string;
		/**
		 * What the card's cover light is drawn from — the slug, so a course wears the
		 * same one everywhere. Falls back to the title, which is nearly as stable.
		 */
		seed?: string;
	};

	let { title, summary, difficulty, lessonCount, href, seed }: Props = $props();

	// A course has no picture, and inventing one — a stock photo of a laptop — is worse
	// than having none. The cover is light instead: its own, and the same on every
	// screen, so a catalogue reads as a set of things rather than a list of rows.
	const cover = $derived(auroraFor(seed ?? title));
</script>

<!--
	A catalogue course. The whole card is the link, so there is no "Open" button to
	press — a button that only repeats what clicking the card already does.

	Everything that identifies the course lives on the cover: its name, how hard it
	is, how long it is. That was three tiers before — a title on the light, a
	summary on paper, and a strip of meta under a rule — and three tiers is two
	horizons the eye has to cross to learn one thing. The paper below carries the
	one thing the cover cannot: what the course is actually about, in prose.
-->
<TintCard {href} panelClass="overflow-hidden bg-surface-raised p-0">
	<!--
		The title at the top and the meta at the foot, with the light between them.

		Bottom-aligned, the title moved: a one-line name sat where a two-line name's
		second line went, so no two covers in a row agreed about where a course's name
		is. It is the first thing read on every card, so it is in the same place on
		every card, and the gradient is what fills the gap rather than the type.
	-->
	<div class={cn('relative flex h-56 flex-col rounded-card p-4', cover)}>
		<h2 class="line-clamp-2 text-lg font-semibold text-on-solid text-pretty">{title}</h2>

		<!--
			The meta, in the cover's own ink. `inverse` on the bars for the same reason the
			button on the aurora is glass: the accent is a blue chosen against white paper,
			and on the brand's light it is a mark nobody sees.
		-->
		<div class="mt-auto flex items-center justify-between gap-3 pt-4">
			<Difficulty level={difficulty} tone="inverse" />

			{#if lessonCount != null}
				<span class="text-sm text-on-solid/85">
					<span class="numeral">{lessonCount}</span>
					{lessonCount === 1 ? 'lesson' : 'lessons'}
				</span>
			{/if}
		</div>
	</div>

	<!-- Always two lines, even when empty, so every card is the same height and a
	     grid of them reads as one block rather than a ragged run. -->
	<div class="p-4">
		<p class="text-muted line-clamp-2 min-h-[2.5rem] text-sm text-pretty">{summary ?? ''}</p>
	</div>
</TintCard>
