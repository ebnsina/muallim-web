<script lang="ts">
	import { Message01Icon, QuoteDownIcon, StickyNote02Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import { Pill } from '$lib/pill.svelte';
	import { cn } from '$lib/utils';
	import type { Tab } from './tabs';

	type Props = {
		tab: Tab;
		highlightCount: number;
		questionCount: number;
	};

	let { tab = $bindable(), highlightCount, questionCount }: Props = $props();

	const TABS = $derived([
		{ id: 'notes' as const, label: 'Notes', icon: StickyNote02Icon, count: 0 },
		{ id: 'highlights' as const, label: 'Highlights', icon: QuoteDownIcon, count: highlightCount },
		{ id: 'discussion' as const, label: 'Discussion', icon: Message01Icon, count: questionCount }
	]);

	/*
		The same sliding pill the band's nav wears, and for the same reason: the mark
		travels to the tab you picked instead of one fill going out while another comes
		on. A segmented control is the one place the motion is almost the whole point —
		it is what says these three are one track and not three buttons.
	*/
	const pill = new Pill();

	$effect(() => {
		pill.measure(tab);
	});

	$effect(() => {
		document.fonts?.ready.then(() => pill.measure(tab));
	});

	// Left and right walk the tabs, as a tablist is expected to. Without it the
	// arrow keys do nothing and the widget is a row of buttons wearing a role.
	function moveTab(event: KeyboardEvent, current: Tab) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();

		const order = TABS.map((t) => t.id);
		const step = event.key === 'ArrowRight' ? 1 : -1;
		const next = order[(order.indexOf(current) + step + order.length) % order.length];

		tab = next;
		document.getElementById(`tab-${next}`)?.focus();
	}
</script>

<!--
	One track, three segments. Separate pills read as three unrelated buttons; a
	segmented control says these are the same question asked three ways, and only
	one of them can be the answer.

	A tablist, not a row of buttons: the roles are what make the arrow keys work and
	what tells a screen reader that picking one replaces the panel below rather than
	navigating away.
-->
<div class="mt-12 max-w-2xl">
	<div
		bind:this={pill.track}
		role="tablist"
		aria-label="About this lesson"
		class="relative inline-flex gap-1 rounded-pill bg-surface-sunken p-1"
	>
		<!--
			The fill, and it is `aria-hidden`: `aria-selected` on the tab is what says
			which one is chosen. This is the picture of that, for people who can see it.
		-->
		<span
			aria-hidden="true"
			class={cn(
				'squircle pointer-events-none absolute inset-y-1 left-0 bg-accent',
				'transition-[transform,width,opacity] duration-260 ease-out',
				pill.pos.measured ? 'opacity-100' : 'opacity-0'
			)}
			style={pill.style}
		></span>

		{#each TABS as t (t.id)}
			{@const active = tab === t.id}
			<button
				bind:this={pill.items[t.id]}
				type="button"
				role="tab"
				id="tab-{t.id}"
				aria-selected={active}
				aria-controls="panel-{t.id}"
				tabindex={active ? 0 : -1}
				class={cn(
					'squircle relative z-10 flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					active ? 'text-on-solid' : 'text-muted hover:text-text',

					// Until the pill has been measured — the server-rendered frame — the chosen
					// tab wears its own fill, or the control arrives with nothing selected.
					active && !pill.pos.measured && 'bg-accent'
				)}
				onclick={() => (tab = t.id)}
				onkeydown={(event) => moveTab(event, t.id)}
			>
				<Icon icon={t.icon} class="size-4" />
				{t.label}

				{#if t.count > 0}
					<span
						class={cn(
							'numeral rounded-pill px-1.5 text-xs',
							active ? 'bg-on-solid/20' : 'bg-surface-raised'
						)}
					>
						{t.count}
					</span>
				{/if}
			</button>
		{/each}
	</div>
</div>
