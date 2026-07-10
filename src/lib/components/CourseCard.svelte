<script lang="ts">
	import Difficulty from './Difficulty.svelte';
	import TintCard from './TintCard.svelte';

	type Props = {
		title: string;
		summary?: string;
		difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
		lessonCount?: number;
		href: string;
	};

	let { title, summary, difficulty, lessonCount, href }: Props = $props();
</script>

<!--
	A catalogue course. The whole card is the link, so there is no "Open" button to
	press — a button that only repeats what clicking the card already does. The
	strip below carries what the listing actually knows instead: the difficulty,
	drawn by the design-system components. (Lesson and module counts are not in the
	list payload, so they are not invented here.)
-->
<TintCard {href}>
	<h2 class="line-clamp-2 min-h-[3.5rem] text-lg font-semibold text-pretty">{title}</h2>

	<!-- Always two lines, even when empty, so every card is the same height and a
	     grid of them reads as one block rather than a ragged run. -->
	<p class="text-muted mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-pretty">{summary ?? ''}</p>

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
