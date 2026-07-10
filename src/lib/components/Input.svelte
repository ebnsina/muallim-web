<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { controlClass } from './control';

	type Props = { class?: string; invalid?: boolean } & Omit<HTMLInputAttributes, 'class'>;

	let { class: className, invalid = false, value = $bindable(), ...rest }: Props = $props();
</script>

<input
	bind:value
	aria-invalid={invalid || undefined}
	class={cn(controlClass, 'h-10', className)}
	{...rest}
/>
