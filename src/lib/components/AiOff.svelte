<script lang="ts">
	import { SparklesIcon } from '@hugeicons/core-free-icons';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	// Stands in for an AI control when the server has no provider key. The control
	// keeps its place and says it is off in the reader's terms — a vanished button
	// is a feature nobody finds, and the key's name is the admin's problem, not the
	// teacher's.
	type Props = { label?: string };

	let { label = 'Draft with AI' }: Props = $props();
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
	<Button type="button" variant="ghost" size="sm" disabled title="AI isn’t set up yet">
		<Icon icon={SparklesIcon} class="size-4" />
		{label}
	</Button>
	<p class="text-xs text-muted">AI isn’t set up yet. Ask your administrator to turn it on.</p>
</div>
