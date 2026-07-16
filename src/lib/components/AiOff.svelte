<script lang="ts">
	import { SparklesIcon } from '@hugeicons/core-free-icons';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	// Stands in for an AI control when no provider key is set. The control keeps its
	// place and says why it is off — a vanished button is a feature nobody finds.
	type Props = {
		label?: string;
		/** The private env key an admin sets to switch this control on. */
		envKey?: string;
	};

	let { label = 'Draft with AI', envKey = 'ANTHROPIC_API_KEY' }: Props = $props();
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
	<Button type="button" variant="ghost" size="sm" disabled title="AI is not configured">
		<Icon icon={SparklesIcon} class="size-4" />
		{label}
	</Button>
	<p class="text-xs text-muted">
		AI is not configured — set
		<code class="rounded bg-surface-hover px-1 py-0.5 font-mono text-[0.7rem]">{envKey}</code>
		to switch this on.
	</p>
</div>
