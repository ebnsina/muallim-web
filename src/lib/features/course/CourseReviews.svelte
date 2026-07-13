<script lang="ts">
	import { enhance } from '$app/forms';
	import { Delete02Icon, SentIcon } from '@hugeicons/core-free-icons';
	import { Alert, Button, Card, Icon, Stars, Textarea } from '$lib/components';
	import type { Review, ReviewSummary } from './types';

	type Props = {
		reviews: Review[];
		summary: ReviewSummary;
		/** This reader's own review, when they have left one. */
		mine: Review | null;
		enrolled: boolean;
		/** An API failure from the last submission — about the act, not about a field. */
		message?: string;
		/** A refused rating. It belongs under the stars, not in a banner above them. */
		ratingMessage?: string;
	};

	let { reviews, summary, mine, enrolled, message, ratingMessage }: Props = $props();

	const mediumDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
	const hasReviews = $derived(summary.count > 0);

	// The star input's live value, seeded from any review the learner already left.
	// A writable $derived: it resettles to the loaded review, and the form writes to it.
	let myRating = $derived(mine?.rating ?? 0);
</script>

<section id="reviews" class="mt-12 scroll-mt-24">
	<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
		<h2 class="text-xl font-semibold">Reviews</h2>
		{#if hasReviews}
			<span class="text-muted flex items-center gap-2 text-sm">
				<Stars value={summary.average} size="sm" />
				<span>
					<span class="numeral">{summary.average.toFixed(1)}</span> from
					<span class="numeral">{summary.count}</span>
					{summary.count === 1 ? 'learner' : 'learners'}
				</span>
			</span>
		{/if}
	</div>

	{#if message}
		<Alert tone="danger" class="mt-4" role="alert">{message}</Alert>
	{/if}

	<!--
		Only an enrolled learner may review, and muallim-api enforces it. The form shows
		for them; everyone else reads the wall.
	-->
	{#if enrolled}
		<Card float class="mt-4 p-5">
			<form method="POST" action="?/review" use:enhance>
				<p class="text-sm font-medium">
					{mine ? 'Your review' : 'Share what you thought'}
				</p>
				<div class="mt-3">
					<Stars name="rating" bind:value={myRating} />

					<!-- The refusal sits under the control it names, in plain text. -->
					{#if ratingMessage}
						<p id="rating-error" class="text-danger-text mt-2 text-xs font-medium" role="alert">
							{ratingMessage}
						</p>
					{/if}
				</div>
				<Textarea
					name="body"
					class="mt-4"
					rows={3}
					maxlength={4000}
					placeholder="What would you tell someone deciding whether to take this course? (optional)"
					value={mine?.body ?? ''}
				/>
				<!-- The commit sits at the end of the form, where the eye leaves it. -->
				<div class="mt-4 flex items-center justify-end gap-3">
					{#if mine}
						<Button formaction="?/unreview" type="submit" variant="ghost" size="sm">
							<Icon icon={Delete02Icon} class="size-4" />
							Remove
						</Button>
					{/if}
					<Button type="submit" size="sm">
						<Icon icon={SentIcon} class="size-4" />
						{mine ? 'Update review' : 'Post review'}
					</Button>
				</div>
			</form>
		</Card>
	{/if}

	{#if hasReviews}
		<ul class="mt-6 space-y-4">
			{#each reviews as review (review.created_at + review.author_name)}
				<li>
					<Card float class="p-5">
						<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
							<div class="flex items-center gap-2">
								<Stars value={review.rating} size="sm" />
								<span class="text-sm font-medium">
									{review.author_name || 'A learner'}
								</span>
							</div>
							<time class="text-muted numeral shrink-0 text-xs">
								{mediumDate.format(new Date(review.created_at))}
							</time>
						</div>
						{#if review.body}
							<p class="text-muted mt-2 text-sm whitespace-pre-wrap">{review.body}</p>
						{/if}
					</Card>
				</li>
			{/each}
		</ul>
	{:else if !enrolled}
		<p class="text-muted mt-4 text-sm">No reviews yet.</p>
	{/if}
</section>
