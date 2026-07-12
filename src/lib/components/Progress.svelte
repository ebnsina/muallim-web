<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		value: number;
		max?: number;
		/**
		 * What the bar means, in words. Required: a bar is a picture of a number, and
		 * a picture of a number is not readable by anyone who cannot see it.
		 */
		label: string;
		/**
		 * `active`, `completed` and `lapsed` are the three states of an enrolment, and
		 * they wear the chart palette — the same hues the donut gives those slices. A
		 * bar and a slice describing the same course must agree, or the reader has two
		 * colour systems to learn instead of one.
		 *
		 * `accent` and `success` remain for bars that are not an enrolment: a score, a
		 * quota, anything whose full is not a finished course.
		 */
		tone?: 'accent' | 'success' | 'active' | 'completed' | 'lapsed';
		class?: string;
	};

	let { value, max = 100, label, tone = 'accent', class: className }: Props = $props();

	const FILL: Record<string, string> = {
		accent: 'bg-accent',
		success: 'bg-success',
		active: 'bg-chart-1',
		completed: 'bg-chart-2',
		lapsed: 'bg-chart-3'
	};

	// A bar that renders 130% of itself is a layout bug, not a celebration.
	const percent = $derived(max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100)));
</script>

<!--
	The bar is full-width and slid into place from the left, rather than grown by its
	`width`. Width is a layout property: animating it re-runs layout, paint and
	composite on every frame, for every bar on the page — and a dashboard of six
	courses is six of them. A transform is composited alone, on the GPU.

	It also keeps the shape honest. `scaleX` — the other transform people reach for
	here — squashes the pill's rounded ends into ellipses as it shrinks. Translating
	a full-width bar moves the left cap out of the track instead, where the track's
	own `overflow-hidden` clips it, and the right cap stays a circle at every value.
-->
<div
	role="progressbar"
	aria-valuenow={value}
	aria-valuemin={0}
	aria-valuemax={max}
	aria-label={label}
	class={cn('h-2 w-full overflow-hidden rounded-full bg-surface-active', className)}
>
	<div
		class={cn(
			'h-full w-full rounded-full transition-transform duration-(--duration-slow) ease-out',
			FILL[tone] ?? FILL.accent
		)}
		style="transform: translateX({percent - 100}%)"
	></div>
</div>
