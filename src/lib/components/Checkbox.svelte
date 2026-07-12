<script lang="ts">
	import { Tick02Icon } from '@hugeicons/core-free-icons';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import Icon from './Icon.svelte';

	type Props = { class?: string } & Omit<HTMLInputAttributes, 'class' | 'type'>;

	let { class: className, checked = $bindable(), ...rest }: Props = $props();
</script>

<!--
	A real `<input type="checkbox">`, drawn by us.

	`appearance-none` removes the platform's box and nothing else: the element keeps
	its role, its label association, its keyboard behavior, and its participation
	in the form. Replacing it with a `<div role="checkbox">` would mean
	reimplementing all four, and getting one of them subtly wrong.

	The tick is stacked over the input in the same grid cell, revealed by
	`peer-checked`. It is `pointer-events-none`, so the whole square remains the
	input's own hit area.
-->
<span
	class={cn(
		'relative inline-grid size-[18px] shrink-0 place-items-center',
		'transition-transform duration-(--duration-press) ease-out motion-safe:active:scale-95',
		className
	)}
>
	<input
		type="checkbox"
		bind:checked
		class="peer col-start-1 row-start-1 size-full cursor-pointer appearance-none rounded-[0.375rem]
		       border border-border-control bg-surface-raised transition-colors
		       checked:border-accent checked:bg-accent
		       hover:border-border-strong checked:hover:border-accent-hover checked:hover:bg-accent-hover
		       disabled:cursor-not-allowed disabled:opacity-50"
		{...rest}
	/>
	<!--
		The tick fades and settles rather than blinking on. It starts at 90% and not at
		nothing: an object that scales up from zero is an object that came from nowhere,
		and the eye reads it as a glitch even when it cannot say why.

		The list names `scale` because it is hand-written and therefore literal — a
		Tailwind `scale-*` sets the standalone `scale` property, not `transform`. The
		`transition-transform` utility handles this for you; an arbitrary list does not.
	-->
	<Icon
		icon={Tick02Icon}
		strokeWidth={3}
		class="pointer-events-none col-start-1 row-start-1 size-3 scale-90 text-on-solid opacity-0
		       transition-[opacity,scale] duration-(--duration-instant) ease-out
		       peer-checked:scale-100 peer-checked:opacity-100"
	/>
</span>
