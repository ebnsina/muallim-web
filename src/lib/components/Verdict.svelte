<script lang="ts" module>
	/** What a graded answer, or a whole attempt, came to. */
	export type VerdictKind = 'correct' | 'partial' | 'incorrect' | 'pending';
</script>

<script lang="ts">
	import { Cancel01Icon, Clock01Icon, MinusSignIcon, Tick02Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';

	type Props = { kind: VerdictKind; label?: string };

	let { kind, label }: Props = $props();

	/*
		The word is not decoration. Roughly one man in twelve cannot separate this
		green from this red by hue, so the icon and the word are what carry the
		meaning and the colour merely reinforces it (WCAG 1.4.1). The tokens are
		also separated in *lightness*, so it survives a greyscale print — there is a
		test for that in contrast.spec.ts.
	*/
	const KINDS = {
		correct: { icon: Tick02Icon, word: 'Correct', class: 'text-success-text' },
		partial: { icon: MinusSignIcon, word: 'Partly right', class: 'text-warning-text' },
		incorrect: { icon: Cancel01Icon, word: 'Not right', class: 'text-danger-text' },
		pending: { icon: Clock01Icon, word: 'Not marked yet', class: 'text-muted' }
	} as const;
</script>

<span class="inline-flex items-center gap-1.5 text-sm font-medium {KINDS[kind].class}">
	<Icon icon={KINDS[kind].icon} class="size-4 shrink-0" strokeWidth={2} />
	{label ?? KINDS[kind].word}
</span>
