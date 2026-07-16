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
		/** Which corner it hangs off. Put it where the card's words are not. */
		corner?: 'bottom' | 'top';
	};
	let { kind, tone = 'brand', corner = 'bottom' }: Props = $props();

	let el: HTMLElement | undefined = $state();
	let seen = $state(false);

	// It draws once, so it draws when somebody is there to watch: a card two screens
	// down would otherwise finish long before anybody scrolled to it.
	$effect(() => {
		if (!el || seen) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					seen = true;
					io.disconnect();
				}
			},
			{ threshold: 0.4 }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<span class="object {tone} {corner}" class:seen bind:this={el} aria-hidden="true">
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
		right: -3.4rem;
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
		top: -3.8rem;
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
		stroke-dasharray: 100;
		stroke-dashoffset: 100;
	}
	/* Once, on the way past, and then it stays drawn. A loop turns a flourish into a
	   thing flickering in the corner of the eye while somebody is trying to read. */
	.seen .p {
		animation: draw 1.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
	}
	.seen .b {
		animation-delay: 0.22s;
	}
	.seen .c {
		animation-delay: 0.44s;
	}

	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* Asked for less motion: the drawing, finished, holding still. */
	@media (prefers-reduced-motion: reduce) {
		.p,
		.seen .p {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
