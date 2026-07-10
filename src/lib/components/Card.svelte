<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		/** `raised` genuinely floats. Lists of cards should stay flat and use the border. */
		elevation?: 'flat' | 'raised';
		class?: string;
		children: Snippet;
	};

	let { elevation = 'flat', class: className, children }: Props = $props();
</script>

<!--
	A border separates; a shadow means the surface floats. Forty rows in a marking
	queue with forty shadows is a queue nobody can read, so `flat` is the default.
-->
<div
	class={cn(
		'rounded-card border border-border bg-surface-raised',
		elevation === 'raised' && 'shadow-raised',
		className
	)}
>
	{@render children()}
</div>
