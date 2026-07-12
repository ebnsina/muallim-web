<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { DURATION, prefersReducedMotion } from '$lib/motion';
	import { cn } from '$lib/utils';

	type Props = {
		/** Where it lands. The number is the truth; the roll is only how it arrives. */
		value: number;
		/** Anything the figure wears — a percent sign, a `+`. Rendered after it. */
		suffix?: string;
		/** How long the roll takes. A figure nobody is waiting for may take its time. */
		duration?: number;
		class?: string;
	};

	// `reveal`, the one duration the system allows past 300ms — and for the same
	// reason it exists: this is explanatory, seen once on arrival, and nobody is
	// waiting behind it. A figure that took a UI duration would not read as a roll.
	let { value, suffix = '', duration = DURATION.reveal, class: className }: Props = $props();

	/*
		The roll.

		It starts at zero and lands on the value, in one `requestAnimationFrame` loop
		per figure, eased so it decelerates into place rather than stopping dead.
		`cubicOut` and not a spring: a number that overshoots and settles back has said
		something false, however briefly, and a dashboard's whole job is to not do that.

		Under `prefers-reduced-motion` there is no loop at all — the figure is simply
		there. That is not a degraded version of this; for that reader it is the right
		one, and a counter racing at somebody who asked for stillness is the exact thing
		the setting exists to stop.
	*/
	let shown = $state(0);

	$effect(() => {
		const target = value;

		if (prefersReducedMotion()) {
			shown = target;
			return;
		}

		const from = shown;
		const start = performance.now();
		let frame = 0;

		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / duration);
			shown = Math.round(from + (target - from) * cubicOut(t));
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(frame);
	});
</script>

<!--
	`aria-live` is deliberately absent, and `aria-hidden` is not the answer either.
	A screen reader reads the element's text once, when it reaches it — by which
	time the roll has landed on the real number. Announcing every frame would be
	the same figure read forty times.

	The value is in the DOM from the first frame under reduced motion, and within a
	second otherwise. Nothing here is ever the only place a number is said.
-->
<span class={cn('numeral tabular-nums', className)}>{shown}{suffix}</span>
