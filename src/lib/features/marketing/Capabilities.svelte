<script lang="ts">
	import { Icon } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { GROUPS } from './content';
</script>

<!-- The index of what ships. An index, not six cards: a reader scans this, they do not read it. -->
<Section
	id="capabilities"
	centred
	eyebrow="Everything that ships"
	title="No half of it is a roadmap"
	lead="Every line below is a feature you can use this afternoon. What is not built has its own list, further down, and it is short."
	class="border-t border-border"
>
	<dl class="grid gap-x-14 sm:grid-cols-2 lg:grid-cols-3">
		{#each GROUPS as group, i (group.title)}
			<div class="border-b border-border py-8" use:inview={{ delay: (i % 3) * 70 }}>
				<dt class="flex items-center gap-2.5 text-sm font-semibold">
					<Icon icon={group.icon} class="size-4 text-accent-text" />
					{group.title}
				</dt>

				<dd>
					<ul class="mt-4 space-y-3">
						{#each group.items as item (item)}
							<li
								class="relative pl-5 text-[0.9375rem] leading-relaxed text-muted before:absolute before:top-[0.7em] before:left-0 before:size-1 before:rounded-full before:bg-border-strong"
							>
								{item}
							</li>
						{/each}
					</ul>
				</dd>
			</div>
		{/each}
	</dl>
</Section>
