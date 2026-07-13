<script lang="ts">
	import { Tick02Icon } from '@hugeicons/core-free-icons';
	import { Card, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { GROUPS } from './content';
</script>

<Section
	id="capabilities"
	eyebrow="What ships"
	title="Everything below is built, today."
	lead="Not a roadmap, not a beta flag. This is the list of what a workspace can do the hour you open it."
	tinted
	class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
>
	{#each GROUPS as group, i (group.title)}
		<div use:inview={{ delay: (i % 3) * 80 }} class="h-full">
			<Card aurora class="flex h-full flex-col p-6">
				<div class="flex size-10 items-center justify-center squircle-sm bg-accent-surface">
					<Icon icon={group.icon} class="size-5 text-accent-text" />
				</div>

				<h3 class="mt-4 text-lg font-semibold">{group.title}</h3>

				<ul class="mt-4 space-y-3 text-sm text-muted">
					{#each group.items as item (item)}
						<li class="flex gap-2.5">
							<Icon icon={Tick02Icon} class="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2} />
							<span class="text-pretty">{item}</span>
						</li>
					{/each}
				</ul>
			</Card>
		</div>
	{/each}
</Section>
