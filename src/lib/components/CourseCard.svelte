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
	press — a button that only repeats what clicking the card already does. The
	strip below carries what the listing actually knows instead: the difficulty,
	drawn by the design-system components. (Lesson and module counts are not in the
	list payload, so they are not invented here.)
-->
<TintCard {href} panelClass="overflow-hidden bg-surface-raised p-0">
	<div class={cn('relative h-24 rounded-card', cover)}>
		<!-- The title sits on its own cover, where a course's picture would be. -->
		<div class="absolute inset-x-0 bottom-0 p-4">
			<h2 class="line-clamp-2 text-lg font-semibold text-on-solid text-pretty">{title}</h2>
		</div>
	</div>

	<div class="p-4 pt-3">
		<!-- Always two lines, even when empty, so every card is the same height and a
	     grid of them reads as one block rather than a ragged run. -->
		<p class="text-muted line-clamp-2 min-h-[2.5rem] text-sm text-pretty">{summary ?? ''}</p>
	</div>

	{#snippet footer()}
		<Difficulty level={difficulty} />
		{#if lessonCount != null}
			<span class="text-muted text-sm">
				<span class="numeral">{lessonCount}</span>
				{lessonCount === 1 ? 'lesson' : 'lessons'}
			</span>
		{/if}
	{/snippet}
</TintCard>
