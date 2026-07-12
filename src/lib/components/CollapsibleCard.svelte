<script lang="ts">
	import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import Card from './Card.svelte';
	import Icon from './Icon.svelte';

	type Props = {
		title: string;
		/** Shown beside the title while collapsed, so the card still says something. */
		summary?: string;
		open?: boolean;
		class?: string;
		children: Snippet;
	};

	let { title, summary, open = $bindable(true), class: className, children }: Props = $props();

	// A stable id, so the header can name the region it opens.
	const id = $props.id();
</script>

<Card class={className}>
	<h2>
		<button
			type="button"
			class="flex w-full items-center gap-3 rounded-card px-5 py-4 text-left transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
			aria-expanded={open}
			aria-controls="panel-{id}"
			onclick={() => (open = !open)}
		>
			<span class="font-medium">{title}</span>

			{#if summary && !open}
				<span class="text-muted truncate text-sm">{summary}</span>
			{/if}

			<Icon
				icon={ArrowDown01Icon}
				class={cn(
					'text-muted ml-auto size-4 shrink-0 transition-transform duration-150',
					!open && '-rotate-90'
				)}
			/>
		</button>
	</h2>

	{#if open}
		<div id="panel-{id}" class="border-t border-border px-5 py-5">
			{@render children()}
		</div>
	{/if}
</Card>
