<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import {
		BookOpen01Icon,
		Cancel01Icon,
		Menu01Icon,
		Mortarboard02Icon,
		Notification02Icon,
		TeachingIcon,
		UserGroupIcon,
		DashboardSquare01Icon
	} from '@hugeicons/core-free-icons';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import { DURATION, easeOut, popover } from '$lib/motion';
	import { cn } from '$lib/utils';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	type Props = {
		user?: { name: string; email: string; role: string };
		/** Shown only to somebody who may author. Hiding it is a courtesy, not a control. */
		canAuthor?: boolean;
		/** Unread notification count for the bell badge. */
		unread?: number;
	};

	let { user, canAuthor = false, unread = 0 }: Props = $props();

	type Tab = { href: string; label: string; icon: IconSvgElement; show: boolean };

	const links = $derived(
		(
			[
				{
					href: resolve('/dashboard'),
					label: 'Dashboard',
					icon: DashboardSquare01Icon,
					show: Boolean(user)
				},
				{ href: resolve('/courses'), label: 'Courses', icon: BookOpen01Icon, show: true },
				{
					href: resolve('/forum'),
					label: 'Community',
					icon: UserGroupIcon,
					show: Boolean(user)
				},
				{ href: resolve('/teach'), label: 'Teach', icon: TeachingIcon, show: canAuthor }
			] satisfies Tab[]
		).filter((link) => link.show)
	);

	// `startsWith` on a trailing slash, not equality: /teach/algebra lights up
	// "Teach", and /teaching does not.
	const current = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

	// A monogram, from the first letters of the name. A face nobody uploaded is a
	// grey silhouette; two initials in the accent are a person.
	const initials = $derived(
		(user?.name ?? '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase() ?? '')
			.join('')
	);

	let open = $state(false);

	// The account menu, behind the avatar. Its own flag: the phone menu and this one
	// are two panels, and closing one should not close the other.
	let accountOpen = $state(false);
	let accountRef = $state<HTMLElement>();

	// A menu that opens on a click closes on a click anywhere else, and on Escape —
	// the two ways anyone expects to dismiss one. The toggle button lives inside
	// `accountRef`, so its own click is not counted as "outside".
	function onWindowClick(event: MouseEvent) {
		if (accountOpen && accountRef && !accountRef.contains(event.target as Node)) {
			accountOpen = false;
		}
	}
	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') accountOpen = false;
	}

	/*
		Navigating closes both panels.

		Left open they cover the page they just took you to, along with the button
		that would have closed them. `afterNavigate` rather than an `$effect` that
		reads the pathname for its dependency: both work, and only one of them says
		when it means to run.
	*/
	afterNavigate(() => {
		open = false;
		accountOpen = false;
	});
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<!--
	A band, not a bar. It runs the width of the window and the page lies on it as a
	sheet with its top corners rounded off, so the brand colour is the surface the
	product rests on rather than a stripe drawn across it. The sections sit in the
	band itself — one row, not a bar with a tab strip under it.
-->
<!--
	Sticky, and above the sheet. The sheet is painted after the band, so without a
	stacking order it covers the account menu that hangs out of the band — and a menu
	you cannot press is worse than no menu at all.
-->
<header class="sticky top-0 z-30 bg-accent text-on-solid">
	<div class="flex h-16 items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:px-8">
		<a href={resolve('/')} class="flex shrink-0 items-center gap-2.5 font-semibold">
			<span class="flex size-8 items-center justify-center rounded-control bg-on-solid/15">
				<Icon icon={Mortarboard02Icon} class="size-5" />
			</span>
			<span class="hidden text-[0.95rem] tracking-tight sm:inline">Muallim</span>
		</a>

		<!-- ------------------------------------------------------------ sections -->
		<!--
			In the band, where they read as the product's own sections. The current one is
			a filled pill rather than an underline: on a solid colour an underline is a
			scratch, and the fill is the only mark that survives.
		-->
		<nav aria-label="Main" class="hidden items-center gap-1 sm:flex">
			{#each links as link (link.href)}
				{@const active = current(link.href)}
				<a
					href={link.href}
					aria-current={active ? 'page' : undefined}
					class={cn(
						'flex items-center gap-2 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-on-solid focus-visible:outline-none',
						active
							? 'bg-on-solid/15 text-on-solid'
							: 'text-on-solid/75 hover:bg-on-solid/10 hover:text-on-solid'
					)}
				>
					<Icon icon={link.icon} class="size-4" />
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-2 sm:gap-3">
			{#if user}
				<!--
					The bell. A link to the notifications page rather than a dropdown — one
					place notices live, reachable on a phone too. The badge caps at 9+ so a
					busy count does not stretch the bar.
				-->
				<a
					href={resolve('/notifications')}
					class="relative rounded-control p-2 text-on-solid/80 transition-colors hover:bg-on-solid/10 hover:text-on-solid focus-visible:ring-2 focus-visible:ring-on-solid focus-visible:outline-none"
					aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
				>
					<Icon icon={Notification02Icon} class="size-5" />
					{#if unread > 0}
						<span
							class="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-surface-raised px-1 text-[0.65rem] leading-4 font-semibold text-accent-text"
						>
							{unread > 9 ? '9+' : unread}
						</span>
					{/if}
				</a>

				<!--
					The account, behind its avatar. Who you are and how you stop being them —
					name, theme, sign out — are one person's business, so they gather under one
					control rather than spreading across the bar.
				-->
				<div class="relative hidden sm:block" bind:this={accountRef}>
					<button
						type="button"
						class="flex items-center rounded-full transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						aria-haspopup="menu"
						aria-expanded={accountOpen}
						aria-label="Account"
						onclick={() => (accountOpen = !accountOpen)}
					>
						<span
							class="flex size-9 items-center justify-center rounded-full bg-on-solid/15 text-sm font-semibold text-on-solid"
						>
							{initials}
						</span>
					</button>

					{#if accountOpen}
						<div
							role="menu"
							aria-label="Account"
							class="absolute right-0 mt-2 w-60 origin-top-right rounded-card border border-border bg-surface-raised p-1.5 shadow-lg"
							transition:popover
						>
							<div class="px-2.5 py-2">
								<p class="truncate text-sm font-medium">{user.name}</p>
								<p class="text-muted truncate text-xs">{user.email}</p>
								<p class="text-muted mt-1 text-xs capitalize">{user.role}</p>
							</div>

							<div class="my-1 border-t border-border"></div>

							<div class="flex items-center justify-between gap-3 px-2.5 py-1.5">
								<span class="text-sm">Theme</span>
								<ThemeToggle />
							</div>

							<div class="my-1 border-t border-border"></div>

							<!--
								Its own route, not `/dashboard?/logout`. Signing out from the lesson
								you were reading should not deposit you on the dashboard on the way.
							-->
							<form method="POST" action="/logout" use:enhance class="p-0.5">
								<Button type="submit" variant="ghost" size="sm" class="w-full">Sign out</Button>
							</form>
						</div>
					{/if}
				</div>
			{:else}
				<div class="hidden items-center gap-3 sm:flex">
					<ThemeToggle />
					<Button href={resolve('/login')} variant="ghost" size="sm">Sign in</Button>
					<Button href={resolve('/register')} size="sm">Get started</Button>
				</div>
			{/if}

			<!-- On a phone the theme toggle stays on the bar; the rest is in the menu. -->
			<div class="sm:hidden"><ThemeToggle /></div>

			<!--
				A button that says what it controls and whether it is open. An icon that
				swaps between two glyphs tells that to whoever is looking at it and to
				nobody else.
			-->
			<button
				type="button"
				class="rounded-control p-2 text-on-solid/80 transition-colors hover:bg-on-solid/10 hover:text-on-solid focus-visible:ring-2 focus-visible:ring-on-solid focus-visible:outline-none sm:hidden"
				aria-expanded={open}
				aria-controls="mobile-nav"
				aria-label={open ? 'Close menu' : 'Open menu'}
				onclick={() => (open = !open)}
			>
				<Icon icon={open ? Cancel01Icon : Menu01Icon} class="size-5" />
			</button>
		</div>
	</div>

	{#if open}
		<div
			id="mobile-nav"
			class="border-t border-border bg-surface sm:hidden"
			transition:slide={{ duration: DURATION.instant, easing: easeOut }}
		>
			<nav aria-label="Main" class="flex flex-col p-3">
				{#each links as link (link.href)}
					<a
						href={link.href}
						aria-current={current(link.href) ? 'page' : undefined}
						class={cn(
							'flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm font-medium transition-colors',
							current(link.href) ? 'bg-surface-active text-text' : 'text-muted hover:text-text'
						)}
					>
						<Icon icon={link.icon} class="size-4" />
						{link.label}
					</a>
				{/each}
			</nav>

			<div class="border-t border-border p-3">
				{#if user}
					<p class="px-3 text-sm font-medium">{user.name}</p>
					<p class="text-muted px-3 text-xs">{user.email}</p>

					<form method="POST" action="/logout" use:enhance class="mt-3">
						<Button type="submit" variant="secondary" size="sm" class="w-full">Sign out</Button>
					</form>
				{:else}
					<div class="flex flex-col gap-2">
						<Button href={resolve('/login')} variant="secondary" size="sm">Sign in</Button>
						<Button href={resolve('/register')} size="sm">Get started</Button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</header>
