<script lang="ts">
	/*
		A landing feature card: a two-tone headline top-left, one recognisable object
		bleeding off the right, and a single arrow affordance at the foot. The whole
		card is the link — the disc is what says so, not a second target.

		A set of these gets its rhythm from one bold step, not from a colour each: three
		paper cards and one olive. Four near-identical surfaces read as sorted by
		nothing, and a wash over them only lowers the contrast that was doing the work.
	*/
	import { Icon } from '$lib/components';
	import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
	import CardArt from './CardArt.svelte';

	type Props = {
		/** The headline's first line, in ink. */
		title: string;
		/** Its second line, in muted — the half that qualifies the first. */
		tail: string;
		kind: 'clipboard' | 'medal' | 'note' | 'plane';
		/** `dark` is the set's one bold step, and the only card that carries lime. */
		tone?: 'paper' | 'dark';
		href: string;
		/** Read out to a screen reader in place of the shared "Learn more". */
		label: string;
	};
	let { title, tail, kind, tone = 'paper', href, label }: Props = $props();

	// Flat fields. Neither lifts on hover — a shadow on paper is the one thing this
	// look does not do — they deepen a step instead.
	const skin = $derived(
		tone === 'dark'
			? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-strong)]'
			: 'border-[color-mix(in_oklab,var(--ink)_9%,transparent)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--brand-tint)]'
	);
	const tail_ink = $derived(
		tone === 'dark'
			? 'text-[color-mix(in_oklab,var(--on-brand)_58%,var(--brand))]'
			: 'text-[var(--muted)]'
	);
	const disc = $derived(
		tone === 'dark'
			? 'bg-[var(--accent)] text-[var(--brand)]'
			: 'bg-[var(--brand)] text-[var(--on-brand)]'
	);
</script>

<a
	class="relative flex min-h-60 flex-col overflow-hidden rounded-[var(--r-lg)] border p-6 no-underline transition duration-200 hover:scale-[1.012] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--accent-ink)] motion-reduce:transition-none motion-reduce:hover:scale-100 {skin}"
	{href}
	aria-label={label}
>
	<!-- The words sit in front of the object, so nothing it does costs them legibility. -->
	<h3 class="relative z-1 grid max-w-[58%] text-2xl leading-[1.1] tracking-tight sm:text-3xl">
		<span class="font-extrabold">{title}</span>
		<span class="font-semibold {tail_ink}">{tail}</span>
	</h3>

	<CardArt {kind} tone={tone === 'dark' ? 'lime' : 'brand'} />

	<span class="relative z-1 mt-auto flex items-center gap-2.5 pt-10">
		<span class="grid size-8 shrink-0 place-items-center rounded-full {disc}">
			<Icon icon={ArrowUpRight01Icon} class="size-4" />
		</span>
		<span class="text-xs font-bold tracking-[0.12em] uppercase">Learn more</span>
	</span>
</a>
