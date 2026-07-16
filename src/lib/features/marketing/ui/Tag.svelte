<script lang="ts">
	import type { Snippet } from 'svelte';

	/** The small pill above a hero headline. Brand tint, not lime — the accent is
	    spent on one thing per screen, and this is never it. */
	let { children }: { children: Snippet } = $props();
</script>

<span class="tag">{@render children()}</span>

<style>
	.tag {
		display: inline-block;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--accent-ink);
		border: 1px solid color-mix(in oklab, var(--accent-ink) 18%, var(--line));
		border-radius: 999px;
		padding: 0.35rem 0.85rem;
		background: var(--brand-tint);
	}
</style>
