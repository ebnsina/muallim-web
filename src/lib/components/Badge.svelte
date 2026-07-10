<script lang="ts" module>
	export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import Icon from './Icon.svelte';

	type Props = {
		tone?: BadgeTone;
		/** Optional, but a status badge without one leans on colour alone. */
		icon?: IconSvgElement;
		class?: string;
		children: Snippet;
	};

	let { tone = 'neutral', icon, class: className, children }: Props = $props();

	const TONES: Record<BadgeTone, string> = {
		neutral: 'border-border bg-surface-sunken text-muted',
		accent: 'border-accent-border bg-accent-surface text-accent-text',
		success: 'border-success-border bg-success-surface text-success-text',
		warning: 'border-warning-border bg-warning-surface text-warning-text',
		danger: 'border-danger-border bg-danger-surface text-danger-text'
	};
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
		TONES[tone],
		className
	)}
>
	{#if icon}
		<Icon {icon} class="size-3.5 shrink-0" strokeWidth={2} />
	{/if}
	{@render children()}
</span>
