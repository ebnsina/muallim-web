<script lang="ts">
	/*
		A feature card's object: one recognisable thing, drawn in a heavy open stroke,
		bleeding off the card's right edge and clipped by it.

		Outlined, and large. The presence comes from size, not from shouting: at full
		strength the object competed with the headline it sits beside, so the stroke is
		mixed back toward the card rather than faded with opacity — one colour to reason
		about, and the detail lines keep their own relationship to it. It does not move:
		a picture beside somebody's sentence should not perform.

		These are drawings, not renders. The references they answer are lit 3D models,
		which needs a modelling tool or an asset pack rather than a cleverer SVG.
	*/
	type Props = {
		kind: 'clipboard' | 'medal' | 'note' | 'plane';
		/** `lime` on the olive card. */
		tone?: 'brand' | 'lime';
	};
	let { kind, tone = 'brand' }: Props = $props();

	// Off the right edge, clear of the words, clipped by the card.
	const art =
		'pointer-events-none absolute right-[-0.5rem] bottom-[-1rem] z-0 block size-56 -rotate-6 max-[520px]:size-40 max-[520px]:opacity-60';
	const ink = $derived(
		// The olive card needs a stronger mix than paper for the same softness — the
		// same step toward the background costs more when the background is dark.
		tone === 'lime'
			? 'text-[color-mix(in_oklab,var(--accent)_74%,var(--brand))]'
			: 'text-[color-mix(in_oklab,var(--brand)_38%,var(--surface))]'
	);
	const p = 'stroke-11 [stroke-linejoin:round]';
	const round = `${p} [stroke-linecap:round]`;
</script>

<span class="{art} {ink}" aria-hidden="true">
	<svg class="size-full overflow-visible" viewBox="0 0 200 200" fill="none" stroke="currentColor">
		{#if kind === 'clipboard'}
			<rect class={p} x="42" y="32" width="116" height="144" rx="16" />
			<rect class={p} x="76" y="14" width="48" height="32" rx="16" />
			<path class={round} d="M66 88l10 10 21-23" />
			<path class={round} d="M66 130l10 10 21-23" />
			<path class="{round} opacity-55" d="M116 92h24M116 134h24" />
		{:else if kind === 'medal'}
			<path class={round} d="M78 94 52 18M122 94l26-76" />
			<circle class={p} cx="100" cy="128" r="48" />
			<path class={round} d="M82 128l12 13 22-25" />
		{:else if kind === 'note'}
			<rect class={p} x="18" y="58" width="164" height="96" rx="16" />
			<circle class={p} cx="100" cy="106" r="28" />
			<!-- The taka glyph, filled — the one place a stroke would not read. -->
			<text
				class="fill-current stroke-none text-[34px] font-extrabold"
				x="100"
				y="106"
				text-anchor="middle"
				dominant-baseline="central">৳</text
			>
			<path class="{round} opacity-55" d="M42 82v48M158 82v48" />
		{:else}
			<path class={p} d="M12 92 188 20 134 182 94 120Z" />
			<path class={p} d="M12 92 94 120 188 20" />
		{/if}
	</svg>
</span>
