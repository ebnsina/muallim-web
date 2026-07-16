<script lang="ts">
	/*
		A card's object: one bold form, cropped by the bottom-right corner, that draws
		itself in.

		Bold and open rather than shaded — a heavy stroke reads at a glance where a
		rendered ball just sits there, and it costs nothing to load. The drawing is the
		motion: the path lays itself down, waits, and starts again. Nothing rotates,
		nothing bounces.

		Abstract on purpose. The mock register it replaced drew a screenshot of a
		feature; a drawn ring promises nothing it cannot keep.
	*/
	type Props = {
		/** `ring` — a day going round. `orb` — a globe, for selling past the gate. */
		kind: 'ring' | 'orb';
		/** `lime` on the dark card, `brand` on paper. */
		tone?: 'lime' | 'brand';
	};
	let { kind, tone = 'brand' }: Props = $props();
</script>

<span class="object {tone}" aria-hidden="true">
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
		right: -2.4rem;
		bottom: -2.8rem;
		z-index: 0;
		display: block;
		width: 13rem;
		height: 13rem;
		transform: rotate(-10deg);
		pointer-events: none;
	}
	.object svg {
		width: 100%;
		height: 100%;
		overflow: visible;
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
		stroke-width: 7;
		stroke-dasharray: 100;
		stroke-dashoffset: 100;
		animation: draw 9s ease-in-out infinite;
	}
	.b {
		animation-delay: 0.5s;
	}
	.c {
		animation-delay: 1s;
	}

	@keyframes draw {
		0% {
			stroke-dashoffset: 100;
		}
		18%,
		78% {
			stroke-dashoffset: 0;
		}
		96%,
		100% {
			stroke-dashoffset: -100;
		}
	}

	/* Asked for less motion: the drawing, finished, holding still. */
	@media (prefers-reduced-motion: reduce) {
		.p {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
