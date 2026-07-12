<script lang="ts">
	import { Tick02Icon } from '@hugeicons/core-free-icons';
	import { Card, Icon } from '$lib/components';

	type Props = { objectives: string[] };
	let { objectives }: Props = $props();
</script>

<!-- What a learner walks away able to do. The first thing anyone deciding reads. -->
<section>
	<Card class="p-6 sm:p-8">
		<h2 class="text-xl font-semibold">What you'll learn</h2>
		<ul class="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
			{#each objectives as objective (objective)}
				<li class="flex items-start gap-3 text-sm">
					<Icon icon={Tick02Icon} class="text-muted mt-0.5 size-4 shrink-0" />
					<span class="text-pretty">{objective}</span>
				</li>
			{/each}
		</ul>
	</Card>
</section>
