<script lang="ts">
	import { cn } from '$lib/utils';
	import { DURATION, prefersReducedMotion } from '$lib/motion';

	type Props = {
		value: number;
		class?: string;
		/** Announced instead of the digits, when the number alone is not the meaning. */
		label?: string;
	};

	let { value, class: className, label }: Props = $props();

	const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

	/*
		Split into characters so a minus sign or a decimal point stays put while the
		digits beside it roll. Keyed by position from the *right*, so 9 → 10 rolls the
		units column from 9 to 0 and slides a new tens column in beside it, rather
		than renumbering every column and rolling all of them.
	*/
	const characters = $derived(
		[...String(value)].map((character, index, all) => ({
			character,
			place: all.length - index,
			digit: /\d/.test(character) ? Number(character) : null
		}))
	);

	// Rolling is decoration on a number that is already correct in the DOM. Under
	// reduced motion the column simply jumps, which is what a number does.
	const duration = $derived(prefersReducedMotion() ? 0 : DURATION.slow);
</script>

<!--
	A number that rolls when it changes.

	The digits are real text, stacked in a column and translated: at any moment the
	DOM contains 0–9 for every place, and the one on screen is the one the transform
	brought into the window. That is why the whole thing is `aria-hidden` and a
	single readable copy sits beside it — a screen reader given the column would
	read "zero one two three four five six seven eight nine".

	`overflow-clip` and not `overflow-hidden`: the former does not make the element a
	scroll container, so a rolling score inside a scrollable page cannot be scrolled
	to reveal the digits behind it.
-->
<span class={cn('numeral inline-flex leading-none', className)}>
	<span class="sr-only">{label ?? value}</span>

	<span aria-hidden="true" class="inline-flex">
		{#each characters as { character, place, digit } (place)}
			{#if digit === null}
				<span>{character}</span>
			{:else}
				<span class="inline-block h-[1.1em] w-[1ch] overflow-clip">
					<span
						class="flex flex-col ease-out"
						style="transform: translateY(-{digit * 1.1}em); transition: transform {duration}ms"
					>
						{#each DIGITS as candidate (candidate)}
							<span class="flex h-[1.1em] items-center justify-center">{candidate}</span>
						{/each}
					</span>
				</span>
			{/if}
		{/each}
	</span>
</span>
