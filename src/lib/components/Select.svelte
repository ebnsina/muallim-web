<script lang="ts">
	import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { controlClass } from './control';
	import Icon from './Icon.svelte';

	type Props = { class?: string; invalid?: boolean; children: Snippet } & Omit<
		HTMLSelectAttributes,
		'class'
	>;

	let {
		class: className,
		invalid = false,
		value = $bindable(),
		children,
		...rest
	}: Props = $props();
</script>

<!--
	A native `<select>`. A custom listbox is a keyboard implementation, a mobile
	implementation, and a screen-reader implementation to get wrong; the platform
	has all three, and on a phone it opens the wheel a person expects.

	Only the chevron is ours. It is a real icon component sitting over the control,
	not an inline SVG encoded into a background-image — which cannot inherit
	`currentColor`, so it stays gray when the theme goes dark.
-->
<div class={cn('relative', className)}>
	<select
		bind:value
		aria-invalid={invalid || undefined}
		class={cn(controlClass, 'h-10 cursor-pointer appearance-none pr-10')}
		{...rest}
	>
		{@render children()}
	</select>

	<Icon
		icon={ArrowDown01Icon}
		class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
	/>
</div>
