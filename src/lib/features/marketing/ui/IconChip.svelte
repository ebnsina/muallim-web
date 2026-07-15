<script lang="ts">
	import { Icon, type IconSvgElement } from '$lib/components';

	/**
	 * A rounded tinted square holding an icon. `tone` picks a hue from the marketing
	 * spectrum, so a grid of chips reads as variety rather than one repeated color.
	 */
	type Tone = 'brand' | 'gold' | 'indigo' | 'teal' | 'violet' | 'amber' | 'rose';
	let { icon, tone = 'brand' }: { icon: IconSvgElement; tone?: Tone } = $props();
</script>

<span class="chip tone-{tone}"><Icon {icon} class="size-5" /></span>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 12px;
	}
	.tone-brand {
		background: var(--brand-tint);
		color: var(--brand);
	}
	.tone-gold {
		background: var(--gold-tint);
		color: var(--gold);
	}
	.tone-indigo {
		background: var(--indigo-tint);
		color: var(--indigo);
	}
	.tone-teal {
		background: var(--teal-tint);
		color: var(--teal);
	}
	.tone-violet {
		background: var(--violet-tint);
		color: var(--violet);
	}
	.tone-amber {
		background: var(--amber-tint);
		color: var(--amber);
	}
	.tone-rose {
		background: var(--rose-tint);
		color: var(--rose);
	}
</style>
