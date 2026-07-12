<script lang="ts">
	import { Message01Icon, QuoteDownIcon, StickyNote02Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
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
		role="tablist"
		aria-label="About this lesson"
		class="inline-flex gap-1 rounded-pill bg-surface-sunken p-1"
	>
		{#each TABS as t (t.id)}
			{@const active = tab === t.id}
			<button
				type="button"
				role="tab"
				id="tab-{t.id}"
				aria-selected={active}
				aria-controls="panel-{t.id}"
				tabindex={active ? 0 : -1}
				class={cn(
					'flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					active ? 'bg-accent text-on-solid' : 'text-muted hover:bg-surface-hover hover:text-text'
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
