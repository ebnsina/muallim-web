<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { controlClass } from './control';

	type Props = { class?: string; invalid?: boolean } & Omit<HTMLTextareaAttributes, 'class'>;

	let {
		class: className,
		invalid = false,
		value = $bindable(),
		rows = 4,
		...rest
	}: Props = $props();
</script>

<textarea
	bind:value
	{rows}
	aria-invalid={invalid || undefined}
	class={cn(controlClass, 'min-h-20 py-2 leading-normal', className)}
	{...rest}></textarea>
