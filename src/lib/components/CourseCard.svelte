<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CheckmarkCircle02Icon, PencilEdit02Icon } from '@hugeicons/core-free-icons';
	import { auroraFor, cn } from '$lib/utils';
	import Icon from './Icon.svelte';
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
		/** Where their other courses are. Absent leaves the name as plain text. */
		instructorHref?: string;
		/** Studying it plus finished it. Absent, or zero, draws nothing. */
		learnerCount?: number;
		/** The mean rating, and how many gave it. No reviews draws no stars. */
		ratingAverage?: number;
		ratingCount?: number;
		/**
		 * `draft` or `published`, for an author looking at their own shelf. A learner
		 * never sees an unpublished course, so a listing that omits this is a listing
		 * where every course is live and the badge would say nothing.
		 */
		status?: string;
		/**
		 * What an author can do to the course from here — an edit link, a publish form.
		 * Rendered above the card's own link, which is a stretched overlay: a button
		 * inside an anchor is not a thing HTML has an answer for.
		 */
		actions?: Snippet;
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
		instructorHref,
		learnerCount,
		ratingAverage,
		ratingCount,
		status,
		actions,
		href,
		seed
	}: Props = $props();

	// A course has no picture, and inventing one — a stock photo of a laptop — is worse
	// than having none. The cover is light instead: its own, and the same on every
	// screen, so a catalog reads as a set of things rather than a list of rows.
	const cover = $derived(auroraFor(seed ?? title));

	// Unrated is not rated nought. A course nobody has reviewed shows no stars at
	// all — five empty ones read as a verdict, and there is no verdict yet.
	const rated = $derived((ratingCount ?? 0) > 0);

	const learners = $derived(
		(learnerCount ?? 0) > 0 ? new Intl.NumberFormat().format(learnerCount!) : ''
	);
</script>

<!--
	A catalog course. The whole card is the link, so there is no "Open" button to
	press — a button that only repeats what clicking the card already does.

	The cover carries what a course *is*: its name, how hard it is, how long. The
	paper below carries what other people made of it — who taught it, how many took
	it, what they gave it. Nothing here is invented: an unrated course shows no
	stars, a course nobody has enrolled on shows no count, and a course whose author
	has been erased shows no name.
-->
<!--
	The inset stays; the numbers behind it are what were wrong.

	TintCard's ring of paper around the panel is the shell's own idea and it belongs
	here — it is what makes the cover read as something laid *on* the card. But it
	was four pixels wide with the panel drawn at the frame's own radius, so the two
	arcs were the same curve four pixels apart, and they wobbled at the corner. A
	radius is only concentric with the one outside it when it is smaller by exactly
	the gap: 2px in, 14px against the frame's 16.
-->
<TintCard
	interactive
	class="relative p-0.5"
	panelClass="flex flex-col overflow-hidden rounded-[14px] bg-surface-raised p-0"
>
	<!--
		The card's link is an overlay, not a wrapper.

		Wrapping the card in an anchor was right until the byline became a link of its
		own: an anchor inside an anchor is not something HTML has an answer for —
		browsers unnest them, and which of the two a click lands on is anybody's guess.
		A stretched overlay gives the whole card one hit area, and the byline sits above
		it on its own.

		It carries the accessible name, so a screen reader hears the course's title and
		not "link, link".
	-->
	<a
		{href}
		aria-label={title}
		class="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
	></a>
	<!--
		The title at the top and the meta at the foot, with the light between them.

		Bottom-aligned, the title moved: a one-line name sat where a two-line name's
		second line went, so no two covers in a row agreed about where a course's name
		is. It is the first thing read on every card, so it is in the same place on
		every card, and the gradient is what fills the gap rather than the type.

		A portrait, not a banner — `aspect-square` rather than a pixel height, so the
		cover is a proportion of the card and holds its shape at every column count
		instead of being a letterbox at four and a tower at two. It was 3:4, then 4:5:
		the paper below now carries a rating and a byline, the card's height is the sum
		of both, and the cover is the half that could afford to give.
	-->
	<div class={cn('relative flex aspect-square flex-col rounded-[14px] p-4', cover)}>
		{#if status}
			<!--
				Glass, not a filled badge. A solid amber lozenge on the cover is a sticker
				somebody put on the picture; the state is said in ink, on the light the card
				already has, and the two states differ by their color and their word alone.
			-->
			{@const live = status === 'published'}
			<span
				class="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-pill bg-on-solid/15 px-2.5 py-1 text-xs font-medium capitalize backdrop-blur-sm"
			>
				<Icon
					icon={live ? CheckmarkCircle02Icon : PencilEdit02Icon}
					class={cn('size-3.5', live ? 'text-success' : 'text-warning')}
					strokeWidth={2}
				/>
				<span class={live ? 'text-success' : 'text-warning'}>{live ? 'Live' : status}</span>
			</span>
		{/if}

		<h2 class="line-clamp-2 pr-20 text-lg font-semibold text-on-solid text-pretty">{title}</h2>

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
				{#if instructor && instructorHref}
					<!--
						A link inside a card that is itself a link — which is why the card's link is
						a stretched overlay and this one sits above it. An anchor nested in an anchor
						is not something HTML has an answer for: browsers unnest them, and which of
						the two a click lands on is anybody's guess.
					-->
					<a class="underline-grow relative z-20 truncate font-medium" href={instructorHref}>
						{instructor}
					</a>
				{:else if instructor}
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

		{#if actions}
			<!-- Above the overlay, or the card's own link swallows every press. -->
			<div
				class="relative z-20 mt-4 flex items-center justify-between gap-3 border-t border-border pt-3"
			>
				{@render actions()}
			</div>
		{/if}
	</div>
</TintCard>
