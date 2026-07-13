<script lang="ts">
	import { ComputerIcon, Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons';
	import { theme } from '$lib/theme.svelte';
	import { cn } from '$lib/utils';
	import Icon from './Icon.svelte';

	type Props = {
		/** Three labelled buttons instead of one cycling icon. For a settings row or a footer. */
		segmented?: boolean;
		class?: string;
	};

	let { segmented = false, class: className }: Props = $props();

	const MODES = [
		{ mode: 'system', label: 'Auto', icon: ComputerIcon },
		{ mode: 'light', label: 'Light', icon: Sun03Icon },
		{ mode: 'dark', label: 'Dark', icon: Moon02Icon }
	] as const;

	const index = $derived(MODES.findIndex((m) => m.mode === theme.mode));
	const current = $derived(MODES[index] ?? MODES[0]);
	const next = $derived(MODES[(index + 1) % MODES.length]);
</script>

{#if segmented}
	<div
		class={cn(
			'inline-flex items-center gap-0.5 rounded-pill border border-border bg-surface-raised p-0.5',
			className
		)}
		role="group"
		aria-label="Theme"
	>
		{#each MODES as option (option.mode)}
			{@const on = theme.mode === option.mode}
			<button
				type="button"
				onclick={() => theme.set(option.mode)}
				aria-pressed={on}
				class={cn(
					'inline-flex cursor-pointer items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors',
					on ? 'bg-accent text-on-solid' : 'text-muted hover:bg-surface-hover hover:text-text'
				)}
			>
				<Icon icon={option.icon} class="size-3.5" />
				{option.label}
			</button>
		{/each}
	</div>
{:else}
	<!-- One button, cycling auto → light → dark. The icon says which is in force. -->
	<button
		type="button"
		onclick={() => theme.set(next.mode)}
		aria-label="Theme: {current.label}. Switch to {next.label}."
		title="Theme: {current.label}. Switch to {next.label}."
		class={cn(
			'inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-muted transition-colors hover:bg-surface-hover hover:text-text',
			className
		)}
	>
		<Icon icon={current.icon} class="size-4" />
	</button>
{/if}
