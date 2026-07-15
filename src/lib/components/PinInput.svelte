<script lang="ts">
	/**
	 * Place one marker on an image — the learner's answer to a `pin` question.
	 *
	 * The point is stored as a percentage of the image (0–100 on each axis), so it
	 * is independent of how big the image is drawn: the same click means the same
	 * answer on a phone and on a desktop, and it lines up with the hotspot regions
	 * the author drew in the same units. A hidden field carries it as JSON, which is
	 * exactly what quiz.ts reads back.
	 */
	let {
		image,
		name,
		label = 'Click the image to place your marker'
	}: { image: string; name: string; label?: string } = $props();

	let point = $state<{ x: number; y: number } | null>(null);

	function place(event: MouseEvent) {
		const rect =
			event.currentTarget instanceof HTMLElement && event.currentTarget.getBoundingClientRect();
		if (!rect) return;

		const x = ((event.clientX - rect.left) / rect.width) * 100;
		const y = ((event.clientY - rect.top) / rect.height) * 100;
		// Two decimals is finer than any click is, and keeps the JSON small.
		point = { x: round(x), y: round(y) };
	}

	const round = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 100) / 100;
</script>

<div class="space-y-2">
	<button
		type="button"
		onclick={place}
		aria-label={label}
		class="relative block w-full overflow-hidden rounded-card border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
	>
		<img src={image} alt="" class="block w-full select-none" draggable="false" />

		{#if point}
			<!-- The marker sits where the click landed, in the same percentage units the
			     point is stored in, so it never drifts when the image is resized. -->
			<span
				class="pointer-events-none absolute z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-on-solid bg-accent shadow-lg ring-2 ring-accent/40"
				style="left: {point.x}%; top: {point.y}%"
			></span>
		{/if}
	</button>

	<input type="hidden" {name} value={point ? JSON.stringify(point) : ''} />

	<p class="text-muted text-xs" role="status">
		{#if point}
			Marker placed. Click again to move it.
		{:else}
			{label}.
		{/if}
	</p>
</div>
