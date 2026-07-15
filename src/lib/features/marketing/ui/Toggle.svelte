<script lang="ts">
	/**
	 * A switch — the trailing control of a settings list item. `checked` is bindable;
	 * the knob slides and the track fills berry when on.
	 */
	let { checked = $bindable(false), label }: { checked?: boolean; label?: string } = $props();
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	class="toggle"
	class:on={checked}
	onclick={() => (checked = !checked)}
>
	<span class="knob"></span>
</button>

<style>
	.toggle {
		flex: 0 0 auto;
		width: 3rem;
		height: 1.65rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--surface-2);
		padding: 0;
		cursor: pointer;
		position: relative;
		transition:
			background 0.16s ease,
			border-color 0.16s ease;
	}
	.toggle.on {
		background: var(--brand);
		border-color: var(--brand);
	}
	.toggle:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: 2px;
	}
	.knob {
		position: absolute;
		top: 50%;
		left: 0.18rem;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 999px;
		background: #fff;
		transform: translateY(-50%);
		box-shadow: 0 1px 2px rgba(33, 24, 32, 0.25);
		transition: left 0.16s ease;
	}
	.toggle.on .knob {
		left: calc(100% - 1.43rem);
	}
	@media (prefers-reduced-motion: reduce) {
		.toggle,
		.knob {
			transition: none;
		}
	}
</style>
