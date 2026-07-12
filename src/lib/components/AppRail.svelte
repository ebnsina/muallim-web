<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import {
		Award01Icon,
		ChampionIcon,
		DashboardSquare01Icon,
		Notification02Icon
	} from '@hugeicons/core-free-icons';
	import { cn } from '$lib/utils';
	import Icon from './Icon.svelte';

	/*
		The rail carries what the band does not.

		Dashboard, Courses, Community and Teach are the sections, and they live in the
		band. Repeating them here would be two navigations disagreeing about which is
		the way to a place — so this is everything else a signed-in person can reach,
		and nothing the band already offers.

		The board is the one exception, and it is here because it is a view of the
		dashboard rather than a section of its own.
	*/
	const items = [
		{ icon: DashboardSquare01Icon, label: 'Board', href: resolve('/dash') },
		{ icon: Notification02Icon, label: 'Notifications', href: resolve('/notifications') },
		{ icon: Award01Icon, label: 'Certificates', href: resolve('/certificates') },
		{ icon: ChampionIcon, label: 'Leaderboard', href: resolve('/leaderboard') }
	];

	const current = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<!--
	Icons, with the name behind a tooltip — and the name is also the `aria-label`, so
	the rail is not a rebus to anyone who cannot hover it: a screen reader and a
	keyboard both get the word rather than the picture. The tooltip answers focus as
	well as hover, or it is a tooltip half the readers never see.
-->
<nav aria-label="Shortcuts" class="hidden shrink-0 lg:block">
	<ul class="sticky top-24 flex flex-col gap-1.5">
		{#each items as item (item.href)}
			{@const active = current(item.href)}
			<li class="group relative">
				<a
					href={item.href}
					aria-label={item.label}
					aria-current={active ? 'page' : undefined}
					class={cn(
						'flex size-11 items-center justify-center rounded-card transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
						active
							? 'bg-accent-surface text-accent-text'
							: 'text-muted hover:bg-surface-sunken hover:text-text'
					)}
				>
					<Icon icon={item.icon} class="size-5" />
				</a>

				<span
					role="tooltip"
					class="pointer-events-none absolute top-1/2 left-full z-10 ml-2 -translate-y-1/2 rounded-control bg-text px-2 py-1 text-xs whitespace-nowrap text-surface opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
				>
					{item.label}
				</span>
			</li>
		{/each}
	</ul>
</nav>
