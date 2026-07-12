<script lang="ts">
	import { DURATION, EASE } from '$lib/motion';

	type Props = {
		/** 0–100. */
		value: number;
		/** What the ring means, for anyone who cannot see it. */
		label: string;
		/** The pixel size of the ring. The number inside scales with it. */
		size?: number;
		/** The enrolment states wear the chart palette, so a ring agrees with the
		 *  donut slice describing the same course. See `Progress`. */
		tone?: 'accent' | 'success' | 'active' | 'completed' | 'lapsed' | 'inverse';
		class?: string;
	};

	let { value, label, size = 80, tone = 'accent', class: className }: Props = $props();

	const STROKE: Record<string, string> = {
		accent: 'stroke-accent',
		success: 'stroke-success',
		active: 'stroke-chart-1',
		completed: 'stroke-chart-2',
		lapsed: 'stroke-chart-3',
		inverse: 'stroke-on-solid'
	};

	const clamped = $derived(Math.min(100, Math.max(0, Math.round(value))));

	// The circle's radius is chosen so its circumference is ~100, which lets the
	// dash array be the percentage itself — no arithmetic, and it reads at a glance.
	const R = 15.915;
</script>

<!--
	A ring, for a single proportion the eye should read as a whole: how far through
	a course, a course grade. A bar answers "how much of a list"; a ring answers
	"how complete is this one thing", and a dashboard's headline number is the
	second kind.
-->
<div
	class={['relative inline-grid place-items-center', className]}
	style="width: {size}px; height: {size}px;"
	role="img"
	aria-label={label}
>
	<svg viewBox="0 0 36 36" class="size-full -rotate-90">
		<circle
			cx="18"
			cy="18"
			r={R}
			fill="none"
			class={tone === 'inverse' ? 'stroke-on-solid/30' : 'stroke-border'}
			stroke-width="2.5"
		/>
		<circle
			cx="18"
			cy="18"
			r={R}
			fill="none"
			class={STROKE[tone] ?? STROKE.accent}
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-dasharray="{clamped} 100"
			style="transition: stroke-dasharray {DURATION.slow}ms {EASE.out};"
		/>
	</svg>

	<span class="numeral absolute text-sm font-semibold" style="font-size: {size / 5}px;">
		{clamped}<span class="text-muted" style="font-size: {size / 8}px;">%</span>
	</span>
</div>
