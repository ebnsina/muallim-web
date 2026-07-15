<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Frosted glass — the locked marketing surface. Translucent, blurred over the
	 * fixed aurora, with a lit top edge. `subtle` is the nested variant: a translucent
	 * tint with no blur of its own, for a panel that sits inside another card.
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
		background: var(--glass);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border: 1px solid var(--glass-border);
		border-radius: var(--r-lg);
		box-shadow: var(--glass-shadow);
	}
	.card.pad {
		padding: 1.5rem;
	}
	.subtle {
		background: var(--tint);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border-color: var(--tint-border);
		border-radius: var(--r-sm);
		box-shadow: none;
	}
	.subtle.pad {
		padding: 1rem;
	}
</style>
