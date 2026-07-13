<script lang="ts">
	import { Tick02Icon } from '@hugeicons/core-free-icons';
	import { Card, Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { GROUPS } from './content';
</script>

<Section
	id="capabilities"
	centred
	eyebrow="Everything in one place"
	title="The whole of teaching, under one login"
	lead="Authoring, assessment, marking, community, certificates and sales — no plugin to buy, no second tool to reconcile against."
>
	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each GROUPS as group, i (group.title)}
			<div use:inview={{ delay: (i % 3) * 70 }}>
				<Card float class="lift h-full p-7">
					<span
						class="flex size-10 items-center justify-center rounded-control bg-accent-surface text-accent-text"
					>
						<Icon icon={group.icon} class="size-5" />
					</span>

					<h3 class="mt-5 font-semibold">{group.title}</h3>

					<ul class="mt-4 space-y-3">
						{#each group.items as item (item)}
							<li class="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-muted">
								<Icon
									icon={Tick02Icon}
									strokeWidth={2.5}
									class="mt-1 size-3.5 shrink-0 text-accent"
								/>
								{item}
							</li>
						{/each}
					</ul>
				</Card>
			</div>
		{/each}
	</div>
</Section>
