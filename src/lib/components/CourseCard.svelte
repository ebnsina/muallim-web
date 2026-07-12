<script lang="ts">
	import { auroraFor, cn } from '$lib/utils';
	import Difficulty from './Difficulty.svelte';
	import Stars from './Stars.svelte';
	import TintCard from './TintCard.svelte';

	type Props = {
		title: string;
		summary?: string;
		difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
		lessonCount?: number;
		/** The author's display name. Absent for a course whose author was erased. */
		instructor?: string;
		/** Studying it plus finished it. Absent, or zero, draws nothing. */
		learnerCount?: number;
		/** The mean rating, and how many gave it. No reviews draws no stars. */
		ratingAverage?: number;
		ratingCount?: number;
		href: string;
		/**
		 * What the card's cover light is drawn from — the slug, so a course wears the
		 * same one everywhere. Falls back to the title, which is nearly as stable.
		 */
		seed?: string;
	};

	let {
		title,
		summary,
		difficulty,
		lessonCount,
		instructor,
		learnerCount,
		ratingAverage,
		ratingCount,
		href,
		seed
	}: Props = $props();

	// A course has no picture, and inventing one — a stock photo of a laptop — is worse
	// than having none. The cover is light instead: its own, and the same on every
	// screen, so a catalogue reads as a set of things rather than a list of rows.
	const cover = $derived(auroraFor(seed ?? title));

	// Unrated is not rated nought. A course nobody has reviewed shows no stars at
	// all — five empty ones read as a verdict, and there is no verdict yet.
	const rated = $derived((ratingCount ?? 0) > 0);

	const learners = $derived(
		(learnerCount ?? 0) > 0 ? new Intl.NumberFormat().format(learnerCount!) : ''
	);
</script>

<!--
	A catalogue course. The whole card is the link, so there is no "Open" button to
	press — a button that only repeats what clicking the card already does.

	The cover carries what a course *is*: its name, how hard it is, how long. The
	paper below carries what other people made of it — who taught it, how many took
	it, what they gave it. Nothing here is invented: an unrated course shows no
	stars, a course nobody has enrolled on shows no count, and a course whose author
	has been erased shows no name.
-->
<TintCard {href} panelClass="overflow-hidden bg-surface-raised p-0">
	<!--
		The title at the top and the meta at the foot, with the light between them.

		Bottom-aligned, the title moved: a one-line name sat where a two-line name's
		second line went, so no two covers in a row agreed about where a course's name
		is. It is the first thing read on every card, so it is in the same place on
		every card, and the gradient is what fills the gap rather than the type.

		A portrait, not a banner — `aspect-[4/5]` rather than a pixel height, so the
		cover is a proportion of the card and stays a poster at every column count
		instead of a letterbox at four and a square at two. Shorter than 3:4, because
		the paper below now carries a rating and a byline: the card's height is the sum
		of both, and it was the cover that could afford to give.
	-->
	<div class={cn('relative flex aspect-[4/5] flex-col rounded-card p-4', cover)}>
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

	<div class="flex flex-1 flex-col p-4">
		<!-- Always two lines, even when empty, so every card is the same height and a
		     grid of them reads as one block rather than a ragged run. -->
		<p class="text-muted line-clamp-2 min-h-[2.5rem] text-sm text-pretty">{summary ?? ''}</p>

		{#if rated}
			<!--
				The rating, and never without the number behind it. 4.9 from two reviewers is
				not a better course than 4.4 from three hundred, and stars with no count beside
				them invite exactly that reading — the count is half the fact, not a footnote.
			-->
			<p
				class="mt-3 flex items-center gap-2"
				aria-label="Rated {ratingAverage!.toFixed(1)} out of 5, from {ratingCount} {ratingCount ===
				1
					? 'review'
					: 'reviews'}"
			>
				<span class="numeral text-warning-text text-sm font-semibold" aria-hidden="true">
					{ratingAverage!.toFixed(1)}
				</span>
				<Stars value={ratingAverage!} size="sm" />
				<span class="text-muted numeral text-xs" aria-hidden="true">({ratingCount})</span>
			</p>
		{/if}

		{#if instructor || learners}
			<p class="text-muted mt-2 flex items-center gap-1.5 text-xs">
				{#if instructor}
					<span class="truncate">{instructor}</span>
				{/if}
				{#if instructor && learners}
					<span aria-hidden="true">·</span>
				{/if}
				{#if learners}
					<span class="shrink-0">
						<span class="numeral">{learners}</span>
						{learnerCount === 1 ? 'learner' : 'learners'}
					</span>
				{/if}
			</p>
		{/if}
	</div>
</TintCard>
