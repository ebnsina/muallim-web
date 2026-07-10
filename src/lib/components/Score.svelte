<script lang="ts">
	import { CancelCircleIcon, CheckmarkCircle02Icon, Clock01Icon } from '@hugeicons/core-free-icons';
	import Badge from './Badge.svelte';
	import Numeral from './Numeral.svelte';

	type Props = {
		points: number;
		maxPoints: number;
		/** Absent while a person still has to mark something. A pass is not a thing to guess at. */
		passed?: boolean | null;
	};

	let { points, maxPoints, passed = null }: Props = $props();

	const percent = $derived(maxPoints <= 0 ? 0 : Math.floor((points / maxPoints) * 100));
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
	<p class="flex items-center gap-1.5 text-lg">
		<Numeral value={points} class="font-semibold" />
		<span class="text-muted">of</span>
		<Numeral value={maxPoints} />
		<span class="ml-1 flex items-center text-muted">
			(<Numeral value={percent} label="{percent} percent" />%)
		</span>
	</p>

	{#if passed === null || passed === undefined}
		<Badge tone="neutral" icon={Clock01Icon}>Awaiting a mark</Badge>
	{:else if passed}
		<Badge tone="success" icon={CheckmarkCircle02Icon}>Passed</Badge>
	{:else}
		<!-- "Not passed", not "Failed". The learner may have another attempt. -->
		<Badge tone="danger" icon={CancelCircleIcon}>Not passed</Badge>
	{/if}
</div>
