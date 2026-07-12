<script lang="ts">
	export const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

	type Props = {
		level: string;
		/** Hidden on a dense card, where the bars and a tooltip are enough. */
		showLabel?: boolean;
		/**
		 * `inverse` for the bars standing on an aurora: the accent is a blue chosen
		 * against white paper, and on the brand's own light it is a bar nobody sees.
		 * There the mark is the surface's own ink, and the unfilled steps are that ink
		 * at a low alpha.
		 */
		tone?: 'accent' | 'inverse';
		class?: string;
	};

	let { level, showLabel = true, tone = 'accent', class: className }: Props = $props();

	// An unknown level fills nothing rather than throwing, and still names itself.
	const filled = $derived(LEVELS.indexOf(level as (typeof LEVELS)[number]) + 1);
</script>

<!--
	Four bars, filled to the level.

	Not a Badge. The tones this system ships mean things — `success` is a pass,
	`danger` is a failure — and colouring "expert" red says a hard course is a
	broken one. Difficulty is a magnitude, so it is drawn as one, in the accent
	colour that means nothing but "this".

	The bars are decoration. The label carries the meaning, and when it is hidden
	the `title` and the `aria-label` still do.
-->
<span
	class={['inline-flex items-center gap-2', className]}
	title={showLabel ? undefined : `Difficulty: ${level}`}
>
	<span class="flex items-end gap-0.5" role="img" aria-label="Difficulty: {level}">
		{#each LEVELS as step, index (step)}
			<span
				class={[
					'w-1 rounded-[1px] transition-colors',
					index === 0 && 'h-1.5',
					index === 1 && 'h-2',
					index === 2 && 'h-2.5',
					index === 3 && 'h-3',
					index < filled
						? tone === 'inverse'
							? 'bg-on-solid'
							: 'bg-accent'
						: tone === 'inverse'
							? 'bg-on-solid/30'
							: 'bg-border-strong'
				]}
			></span>
		{/each}
	</span>

	{#if showLabel}
		<span class={['text-xs capitalize', tone === 'inverse' ? 'text-on-solid/85' : 'text-muted']}>
			{level}
		</span>
	{/if}
</span>
