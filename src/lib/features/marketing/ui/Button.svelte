<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * The marketing button — large, rounded‑xl, flat. Separation is a border's job,
	 * not a shadow's; the only motion is a small lift on hover. Solid is berry, ghost
	 * is bordered. Renders an <a> when given href, a <button> otherwise.
	 */
	type Props = {
		children: Snippet;
		href?: string;
		variant?: 'solid' | 'ghost';
		size?: 'md' | 'sm';
		type?: 'button' | 'submit';
		onclick?: () => void;
		class?: string;
	};
	let {
		children,
		href,
		variant = 'solid',
		size = 'md',
		type = 'button',
		onclick,
		class: cls = ''
	}: Props = $props();
</script>

{#if href}
	<a {href} class="btn {variant} {size} {cls}">{@render children()}</a>
{:else}
	<button {type} {onclick} class="btn {variant} {size} {cls}">{@render children()}</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.95rem 1.9rem;
		border: 0;
		border-radius: 0.75rem;
		font: inherit;
		font-weight: 600;
		font-size: 1.02rem;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
		transition:
			transform 0.12s ease,
			background 0.12s ease,
			border-color 0.12s ease,
			color 0.12s ease;
	}
	.sm {
		padding: 0.55rem 1.1rem;
		font-size: 0.9rem;
	}
	.solid {
		background: var(--brand);
		color: #fff;
	}
	.solid:hover {
		background: var(--brand-strong);
		transform: translateY(-1px);
	}
	.ghost {
		background: var(--surface);
		color: var(--ink);
		border: 1px solid var(--line);
	}
	.ghost:hover {
		border-color: var(--brand);
		color: var(--brand);
		transform: translateY(-1px);
	}
	@media (prefers-reduced-motion: reduce) {
		.btn {
			transition: none;
		}
	}
</style>
