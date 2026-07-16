<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * The marketing button — a pill, as on the landing. Solid is olive carrying the
	 * weight; ghost is white paper behind a hairline border; lime is the call to
	 * action on a dark band, where olive on olive cannot be read. The only motion is
	 * a small lift. Renders an <a> when given href, a <button> otherwise.
	 */
	type Props = {
		children: Snippet;
		href?: string;
		variant?: 'solid' | 'ghost' | 'lime';
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
		gap: 0.45rem;
		padding: 0.8rem 1.35rem;
		border: 1px solid transparent;
		border-radius: 999px;
		font: inherit;
		font-weight: 600;
		font-size: 0.98rem;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
		transition:
			transform 0.14s ease,
			background 0.14s ease,
			box-shadow 0.14s ease;
	}
	.sm {
		padding: 0.55rem 1.05rem;
		font-size: 0.9rem;
	}
	.solid {
		background: var(--brand);
		color: var(--accent-tint);
	}
	.solid:hover {
		background: var(--brand-soft);
		transform: translateY(-1px);
	}
	/* The landing's hero pill: lime with olive on it, the one thing that carries a
	   dark hero. */
	.lime {
		background: var(--accent);
		color: var(--brand);
		font-weight: 700;
	}
	.lime:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 30px -12px rgba(23, 23, 15, 0.5);
	}
	.ghost {
		background: var(--surface);
		color: var(--ink);
		border-color: var(--line);
	}
	.ghost:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(23, 23, 15, 0.07);
	}
	@media (prefers-reduced-motion: reduce) {
		.btn {
			transition: none;
		}
	}
</style>
