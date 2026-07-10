<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import Icon from './Icon.svelte';

	type Props = {
		icon?: IconSvgElement;
		title: string;
		description?: string;
		/** A next action, when there is one. An empty state with no way out is a dead end. */
		action?: Snippet;
	};

	let { icon, title, description, action }: Props = $props();
</script>

<div
	class="flex flex-col items-center rounded-card border border-dashed border-border px-6 py-12 text-center"
>
	{#if icon}
		<Icon {icon} class="size-8 text-muted" />
	{/if}
	<p class="mt-3 font-medium">{title}</p>
	{#if description}
		<p class="mt-1 max-w-sm text-sm text-muted">{description}</p>
	{/if}
	{#if action}
		<div class="mt-5">{@render action()}</div>
	{/if}
</div>
