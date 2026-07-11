<script lang="ts">
	import { StarIcon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';

	type Props = {
		/** The filled count, 0..5. Fractions round to the nearest whole star. */
		value: number;
		/** When set, the stars become radio buttons that write to this field. */
		name?: string;
		size?: 'sm' | 'md';
		class?: string;
	};

	let { name, value = $bindable(0), size = 'md', class: className }: Props = $props();

	const STARS = [1, 2, 3, 4, 5];
	const px = $derived(size === 'sm' ? 'size-3.5' : 'size-5');
	const filled = $derived(Math.round(value));
</script>

{#if name}
	<!-- Interactive: a fieldset of radios, so it is keyboard- and label-accessible. -->
	<fieldset class={['inline-flex items-center gap-1', className]}>
		{#each STARS as star (star)}
			<label class="cursor-pointer" title="{star} of 5">
				<input
					type="radio"
					{name}
					value={star}
					checked={value === star}
					onchange={() => (value = star)}
					class="peer sr-only"
				/>
				<Icon
					icon={StarIcon}
					class="{px} transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring {star <=
					value
						? 'text-accent [&_*]:fill-current'
						: 'text-border-strong hover:text-muted'}"
				/>
				<span class="sr-only">{star} {star === 1 ? 'star' : 'stars'}</span>
			</label>
		{/each}
	</fieldset>
{:else}
	<span
		class={['inline-flex items-center gap-0.5', className]}
		role="img"
		aria-label="Rated {filled} out of 5"
	>
		{#each STARS as star (star)}
			<Icon
				icon={StarIcon}
				class="{px} {star <= filled ? 'text-accent [&_*]:fill-current' : 'text-border-strong'}"
			/>
		{/each}
	</span>
{/if}
