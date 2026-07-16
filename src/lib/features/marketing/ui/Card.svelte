<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Paper, not glass — the marketing surface: a flat white card on cream with a
	 * hairline border and the 24px corner. `subtle` is the nested variant, a warmer
	 * flat tint on a tighter radius, for a panel sitting inside another card.
	 */
	type Props = {
		children: Snippet;
		subtle?: boolean;
		pad?: boolean;
		class?: string;
	};
	let { children, subtle = false, pad = true, class: cls = '' }: Props = $props();
</script>

<div class="card {cls}" class:subtle class:pad>
	{@render children()}
</div>

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		box-shadow: var(--glass-shadow);
	}
	.card.pad {
		padding: 1.5rem;
	}
	.subtle {
		background: var(--surface-2);
		border-color: var(--line);
		border-radius: var(--r-sm);
		box-shadow: none;
	}
	.subtle.pad {
		padding: 1rem;
	}
</style>
