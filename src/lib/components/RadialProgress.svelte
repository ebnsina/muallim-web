<script lang="ts">
	import { DURATION, EASE } from '$lib/motion';
	import Numeral from './Numeral.svelte';

	type Props = {
		/** 0–100. */
		value: number;
		/** What the ring means, for anyone who cannot see it. */
		label: string;
		/** The pixel size of the ring. The number inside scales with it. */
		size?: number;
		/** The enrollment states wear the chart palette, so a ring agrees with the
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

	/*
		The ring draws itself. It renders empty and fills to the value on the frame
		after mount, so the arc sweeps round rather than being there already — the one
		motion on this page that says "this is a proportion" before the number is read.

		A plain `$state` set from an effect, because the transition is CSS: the browser
		interpolates the dash array between the two paints. Under reduced motion the
		global stylesheet drops `stroke-dasharray` from the transitionable properties
		and the arc is simply drawn, complete, in one frame.
	*/
	let drawn = $state(0);
	$effect(() => {
		drawn = clamped;
	});

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
			stroke-dasharray="{drawn} 100"
			style="transition: stroke-dasharray {DURATION.reveal}ms {EASE.out};"
		/>
	</svg>

	<!--
		The sign is the number's own ink at 70%, not `text-muted`. Muted is a gray
		chosen against white paper, and this ring is drawn on an aurora as often as on
		a card — there the sign faded into the gradient and read as a smudge. Opacity
		recedes against whatever it is standing on.
	-->
	<!-- The figure counts up while the arc sweeps — one motion, said twice, so the
	     ring and the number arrive together rather than one after the other. -->
	<span class="numeral absolute text-sm font-semibold" style="font-size: {size / 5}px;">
		<Numeral countUp value={clamped} /><span class="opacity-70" style="font-size: {size / 6.5}px;"
			>%</span
		>
	</span>
</div>
