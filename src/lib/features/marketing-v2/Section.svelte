<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { inview } from '$lib/actions/inview';

	type Props = {
		id?: string;
		/** Text, not a Badge — the marketing site's eyebrows are words. */
		eyebrow: string;
		title: string;
		lead?: string;
		/** Centre the header. The default is left, which is what most sections want. */
		centred?: boolean;
		class?: string;
		children: Snippet;
	};

	let { id, eyebrow, title, lead, centred = false, class: className, children }: Props = $props();
</script>

<section {id} class="px-6 py-20 sm:py-28">
	<div class="mx-auto max-w-6xl">
		<div class={cn('max-w-2xl', centred && 'mx-auto text-center')} use:inview>
			<p
				class={cn(
					'flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-accent-text uppercase',
					centred && 'justify-center'
				)}
			>
				<span class="h-px w-6 bg-accent-border" aria-hidden="true"></span>
				{eyebrow}
			</p>

			<h2 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-[2.75rem]/[1.1]">
				{title}
			</h2>

			{#if lead}
				<p class="mt-5 text-lg leading-relaxed text-pretty text-muted">{lead}</p>
			{/if}
		</div>

		<div class={cn('mt-14', className)}>
			{@render children()}
		</div>
	</div>
</section>
