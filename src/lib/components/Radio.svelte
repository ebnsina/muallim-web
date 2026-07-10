<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type Props = { class?: string } & Omit<HTMLInputAttributes, 'class' | 'type'>;

	let { class: className, ...rest }: Props = $props();
</script>

<!--
	A real `<input type="radio">`, drawn by us. See Checkbox for why the native
	element stays.

	`bind:group` is a compiler feature of the raw input and does not cross a
	component boundary; `bind:checked` is refused on a radio outright. So this is a
	controlled radio: the caller passes `checked` and handles `onchange`, which is
	all `bind:group` ever compiled to.

	The dot is a circle, so it is a rounded span and not an icon.
-->
<span class={cn('relative inline-grid size-[18px] shrink-0 place-items-center', className)}>
	<input
		type="radio"
		class="peer col-start-1 row-start-1 size-full cursor-pointer appearance-none rounded-full
		       border border-border-control bg-surface-raised transition-colors
		       checked:border-accent hover:border-border-strong checked:hover:border-accent-hover
		       disabled:cursor-not-allowed disabled:opacity-50"
		{...rest}
	/>
	<span
		class="pointer-events-none col-start-1 row-start-1 size-2 rounded-full bg-accent opacity-0 peer-checked:opacity-100"
	></span>
</span>
