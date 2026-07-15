<script lang="ts">
	import type { Snippet } from 'svelte';

	/** The small gold pill above a hero headline — an announcement or a "New" note. */
	let { children }: { children: Snippet } = $props();
</script>

<span class="tag">{@render children()}</span>

<style>
	.tag {
		display: inline-block;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--gold);
		border: 1px solid color-mix(in oklab, var(--gold) 35%, var(--line));
		border-radius: 999px;
		padding: 0.35rem 0.85rem;
		background: var(--gold-tint);
	}
</style>
