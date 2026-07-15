<script lang="ts">
	/**
	 * Plot points on a coordinate plane — the learner's answer to a `graph` question.
	 *
	 * The plane runs from −range to +range on both axes; a click snaps to the nearest
	 * whole coordinate and drops a point, and clicking a point again removes it. The
	 * points are stored in graph coordinates (not pixels) as JSON, which is what the
	 * author's expected points are compared against — so the tolerance the author set
	 * is measured in the same units the learner plotted in.
	 */
	interface Point {
		x: number;
		y: number;
	}

	let { name, range = 10 }: { name: string; range?: number } = $props();

	let points = $state<Point[]>([]);

	const SIZE = 320; // the SVG's pixel side; the plane is drawn to fill it.
	const span = $derived(range * 2);
	const step = $derived(SIZE / span);

	// Graph coordinate → SVG pixel. y grows upward in maths, downward on screen.
	const px = (gx: number) => (gx + range) * step;
	const py = (gy: number) => (range - gy) * step;

	function toGraph(clientX: number, clientY: number, rect: DOMRect): Point {
		const gx = Math.round(((clientX - rect.left) / rect.width) * span - range);
		const gy = Math.round(range - ((clientY - rect.top) / rect.height) * span);
		return { x: clamp(gx), y: clamp(gy) };
	}

	const clamp = (n: number) => Math.min(range, Math.max(-range, n));

	function plot(event: MouseEvent) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLElement)) return;
		const rect = target.getBoundingClientRect();
		const at = toGraph(event.clientX, event.clientY, rect);

		// A second click on the same spot lifts the point back off.
		const existing = points.findIndex((p) => p.x === at.x && p.y === at.y);
		points = existing >= 0 ? points.filter((_, i) => i !== existing) : [...points, at];
	}

	// The whole-number gridlines, from −range to +range.
	const lines = $derived(Array.from({ length: span + 1 }, (_, i) => i - range));
</script>

<div class="space-y-2">
	<button
		type="button"
		onclick={plot}
		aria-label="Coordinate plane. Click to plot a point; click a point to remove it."
		class="block max-w-full rounded-card border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
	>
		<svg
			viewBox="0 0 {SIZE} {SIZE}"
			width={SIZE}
			height={SIZE}
			aria-hidden="true"
			class="block max-w-full touch-none rounded-card bg-surface-raised"
		>
			{#each lines as g (g)}
				<line x1={px(g)} y1={0} x2={px(g)} y2={SIZE} class="stroke-border" stroke-width="0.5" />
				<line x1={0} y1={py(g)} x2={SIZE} y2={py(g)} class="stroke-border" stroke-width="0.5" />
			{/each}

			<!-- The axes, heavier than the grid. -->
			<line
				x1={px(0)}
				y1={0}
				x2={px(0)}
				y2={SIZE}
				class="stroke-muted-foreground"
				stroke-width="1.5"
			/>
			<line
				x1={0}
				y1={py(0)}
				x2={SIZE}
				y2={py(0)}
				class="stroke-muted-foreground"
				stroke-width="1.5"
			/>

			{#each points as p (`${p.x},${p.y}`)}
				<circle
					cx={px(p.x)}
					cy={py(p.y)}
					r="5"
					class="fill-accent stroke-on-solid"
					stroke-width="1.5"
				/>
			{/each}
		</svg>
	</button>

	<input type="hidden" {name} value={JSON.stringify(points)} />

	<p class="text-muted text-xs" role="status">
		{#if points.length > 0}
			Plotted: {points.map((p) => `(${p.x}, ${p.y})`).join(', ')}. Click a point to remove it.
		{:else}
			Click the grid to plot a point.
		{/if}
	</p>
</div>
