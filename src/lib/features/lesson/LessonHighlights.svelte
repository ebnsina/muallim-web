<script lang="ts">
	import { Delete02Icon } from '@hugeicons/core-free-icons';
	import { Icon, Textarea } from '$lib/components';
	import { cn } from '$lib/utils';
	import { REVEAL_ON_HOVER } from './tabs';
	import type { Highlight } from './types';

	type Props = {
		highlights: Highlight[];
		/** The mark just made, lit so a reader can see where their note goes. */
		focused: string | null;
		onedit: (id: string, note: string) => void;
		onremove: (id: string) => void;
	};

	let { highlights, focused, onedit, onremove }: Props = $props();
</script>

<!--
	The passages marked in the text, each with its own remark. Select any words in the
	lesson to add one; the quote is the anchor, kept so the passage is recognisable
	even after the lesson is edited under it.
-->
<div id="panel-highlights" role="tabpanel" aria-labelledby="tab-highlights" class="mt-5 max-w-2xl">
	{#if highlights.length > 0}
		<ul class="space-y-3">
			{#each highlights as highlight (highlight.id)}
				<li
					id="highlight-{highlight.id}"
					class={cn(
						'group rounded-card border p-4 transition-colors',
						focused === highlight.id
							? 'border-warning-border bg-warning-surface/40'
							: 'border-border'
					)}
				>
					<div class="flex items-start justify-between gap-3">
						<blockquote
							class="border-l-2 border-warning-border pl-3 text-sm text-pretty text-muted italic"
						>
							{highlight.quote}
						</blockquote>

						<button
							type="button"
							class={cn(REVEAL_ON_HOVER, 'text-muted hover:text-danger-text')}
							aria-label="Remove this highlight"
							onclick={() => onremove(highlight.id)}
						>
							<Icon icon={Delete02Icon} class="size-4" />
						</button>
					</div>

					<Textarea
						class="mt-3"
						rows={2}
						value={highlight.note}
						aria-label="Note on this passage"
						placeholder="Add a note on this passage…"
						onblur={(event) => onedit(highlight.id, event.currentTarget.value)}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-muted text-sm">
			Select any passage in the lesson above to mark it, and add a note against it.
		</p>
	{/if}
</div>
