<script lang="ts">
	/*
		A card's object: one bold form, cropped by the bottom-right corner, that draws
		itself in.

		Bold and open rather than shaded — a heavy stroke reads at a glance where a
		rendered ball just sits there, and it costs nothing to load. It does not move:
		a picture in the corner of somebody's eye should not perform while they read.

		Abstract on purpose. The mock register it replaced drew a screenshot of a
		feature; a drawn ring promises nothing it cannot keep.
	*/
	type Props = {
		/** `ring` — a day going round. `orb` — a globe, for selling past the gate. */
		kind: 'ring' | 'orb';
		/** `lime` on the dark card, `brand` on paper. */
		tone?: 'lime' | 'brand';
		/** Which corner it hangs off. Put it where the card's words are not. */
		corner?: 'bottom' | 'top';
	};
	let { kind, tone = 'brand', corner = 'bottom' }: Props = $props();
</script>

<span class="object {tone} {corner}" aria-hidden="true">
	{#if kind === 'ring'}
		<svg viewBox="0 0 200 200" fill="none">
			<circle class="p a" cx="100" cy="100" r="76" pathLength="100" />
			<circle class="p b" cx="100" cy="100" r="40" pathLength="100" />
			<path class="p c" d="M100 46v54l38 22" pathLength="100" stroke-linecap="round" />
		</svg>
	{:else}
		<svg viewBox="0 0 200 200" fill="none">
			<circle class="p a" cx="100" cy="100" r="76" pathLength="100" />
			<ellipse class="p b" cx="100" cy="100" rx="32" ry="76" pathLength="100" />
			<path class="p c" d="M26 74h148M26 126h148" pathLength="100" stroke-linecap="round" />
		</svg>
	{/if}
</span>

<style>
	/*
		Hung off the bottom-right and clipped by the card, behind the words — the card
		stands in front of it, so nothing it does can cost a sentence its legibility.
	*/
	.object {
		position: absolute;
		right: -2.6rem;
		z-index: 0;
		display: block;
		width: 17.5rem;
		height: 17.5rem;
		transform: rotate(-10deg);
		pointer-events: none;
	}
	.object svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.bottom {
		bottom: -3.8rem;
	}
	.top {
		top: -2.2rem;
	}

	.brand {
		color: var(--brand);
		opacity: 0.22;
	}
	.lime {
		color: var(--accent);
		opacity: 0.5;
	}

	/*
		pathLength normalises every path to 100 units, so one dash rule draws a circle,
		an ellipse and a line at the same rate without measuring any of them.
	*/
	.p {
		stroke: currentColor;
		stroke-width: 11;
	}
</style>
