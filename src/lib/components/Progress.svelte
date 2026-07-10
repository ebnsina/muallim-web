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
		tone?: 'accent' | 'success';
		class?: string;
	};

	let { value, max = 100, label, tone = 'accent', class: className }: Props = $props();

	// A bar that renders 130% of itself is a layout bug, not a celebration.
	const percent = $derived(max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100)));
</script>

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
			'h-full rounded-full transition-[width]',
			tone === 'success' ? 'bg-success' : 'bg-accent'
		)}
		style="width: {percent}%"
	></div>
</div>
