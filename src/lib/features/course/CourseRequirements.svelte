<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Prerequisite } from './types';

	type Props = {
		requirements: string[];
		prerequisites: Prerequisite[];
	};

	let { requirements, prerequisites }: Props = $props();
</script>

<section class="mt-12">
	<h2 class="text-xl font-semibold">Requirements</h2>

	<ul class="text-muted mt-4 space-y-2.5">
		{#each requirements as requirement (requirement)}
			<li class="flex items-start gap-3 text-sm">
				<span class="mt-2 size-1.5 shrink-0 rounded-full bg-border-strong"></span>
				<span class="text-pretty">{requirement}</span>
			</li>
		{/each}

		<!--
			A prerequisite course is a requirement with an address. It is listed here as
			well as in the panel, because this is where a reader deciding whether to start
			looks for it.
		-->
		{#each prerequisites as prerequisite (prerequisite.slug)}
			<li class="flex items-start gap-3 text-sm">
				<span class="mt-2 size-1.5 shrink-0 rounded-full bg-border-strong"></span>
				<span>
					Finish
					<a
						class="text-accent-text underline underline-offset-4"
						href={resolve(`/courses/${prerequisite.slug}`)}
					>
						{prerequisite.title}
					</a>
					{#if prerequisite.done}
						<span class="text-success-text">— done</span>
					{/if}
				</span>
			</li>
		{/each}
	</ul>
</section>
