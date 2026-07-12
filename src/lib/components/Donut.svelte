<script lang="ts">
	export type Segment = {
		/** Stable across filters: colour follows the entity, never its rank. */
		key: string;
		label: string;
		value: number;
		/** A `--color-chart-*` utility class, e.g. `text-chart-1`. */
		tone: string;
	};

	type Props = {
		segments: Segment[];
		/** What the number in the middle counts. */
		centreLabel: string;
		/** Which segment the pointer or keyboard is on. Bound, so a legend beside this
		 *  chart lights the same slice — the highlighting is linked, not duplicated. */
		hovered?: string | null;
		size?: number;
	};

	let { segments, centreLabel, hovered = $bindable(null), size = 176 }: Props = $props();

	const total = $derived(segments.reduce((sum, s) => sum + s.value, 0));

	/*
		Geometry. One circle per slice, drawn with a dash the length of its arc and an
		offset that walks around the ring — no path arithmetic, and no dependency.

		The 2px gap is not decoration: two fills that touch read as one shape, and the
		boundary between them is exactly what a reader is trying to see.
	*/
	const RADIUS = 70;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const GAP = 2;

	const arcs = $derived.by(() => {
		let walked = 0;
		return segments.map((segment) => {
			const share = total === 0 ? 0 : segment.value / total;
			const length = Math.max(0, share * CIRCUMFERENCE - GAP);
			const arc = { ...segment, share, length, offset: -walked };
			walked += share * CIRCUMFERENCE;
			return arc;
		});
	});

	// The middle answers the question the pointer is asking. With no pointer, it
	// answers the whole: a donut whose centre is empty is a donut with a hole in it.
	const focused = $derived(arcs.find((a) => a.key === hovered) ?? null);
	const centreValue = $derived(focused ? focused.value : total);
	const centreCaption = $derived(focused ? focused.label : centreLabel);
</script>

<!--
	`aria-hidden`, deliberately. The legend beside this is a table of the same numbers
	with the labels attached, and it is the accessible rendering: a screen reader gets
	the figures rather than a description of a picture of them.
-->
<div class="relative shrink-0" style="width: {size}px; height: {size}px;" aria-hidden="true">
	<svg viewBox="0 0 176 176" class="size-full -rotate-90">
		<!-- The track. Without it, a course with two enrolments is two lonely dashes. -->
		<circle
			cx="88"
			cy="88"
			r={RADIUS}
			fill="none"
			stroke="currentColor"
			stroke-width="14"
			class="text-surface-sunken"
		/>

		{#each arcs as arc (arc.key)}
			{#if arc.value > 0}
				<circle
					cx="88"
					cy="88"
					r={RADIUS}
					fill="none"
					stroke="currentColor"
					stroke-width={hovered === arc.key ? 20 : 14}
					stroke-dasharray="{arc.length} {CIRCUMFERENCE - arc.length}"
					stroke-dashoffset={arc.offset}
					stroke-linecap="butt"
					class={[
						arc.tone,
						'transition-all duration-150',
						hovered && hovered !== arc.key && 'opacity-25'
					]}
				/>
			{/if}
		{/each}
	</svg>

	<div class="absolute inset-0 flex flex-col items-center justify-center">
		<span class="numeral text-3xl font-semibold">{centreValue}</span>
		<span class="text-muted mt-0.5 text-xs">{centreCaption}</span>
	</div>
</div>
