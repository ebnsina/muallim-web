<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import {
		Award01Icon,
		BookOpen01Icon,
		Cancel01Icon,
		ChampionIcon,
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

	type Notice = {
		id: string;
		title: string;
		body: string;
		link: string;
		read: boolean;
		created_at: string;
	};

	type Props = {
		user?: { name: string; email: string; role: string };
		/** Shown only to somebody who may author. Hiding it is a courtesy, not a control. */
		canAuthor?: boolean;
		/** Unread notification count for the bell badge. */
		unread?: number;
		/** The few notices behind the bell. Loaded with the page; see the layout. */
		notifications?: Notice[];
	};

	let { user, canAuthor = false, unread = 0, notifications = [] }: Props = $props();

	const noticeDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

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
				{ href: resolve('/teach'), label: 'Teach', icon: TeachingIcon, show: canAuthor },
				{
					href: resolve('/certificates'),
					label: 'Certificates',
					icon: Award01Icon,
					show: Boolean(user)
				},
				{
					href: resolve('/leaderboard'),
					label: 'Leaderboard',
					icon: ChampionIcon,
					show: Boolean(user)
				}
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

	// The bell's panel. Its own flag and its own element, so opening one menu does not
	// silently close the other and leave a reader wondering what they pressed.
	let bellOpen = $state(false);
	let bellRef = $state<HTMLElement>();

	// A menu that opens on a click closes on a click anywhere else, and on Escape —
	// the two ways anyone expects to dismiss one. The toggle button lives inside
	// `accountRef`, so its own click is not counted as "outside".
	function onWindowClick(event: MouseEvent) {
		if (accountOpen && accountRef && !accountRef.contains(event.target as Node)) {
			accountOpen = false;
		}
		if (bellOpen && bellRef && !bellRef.contains(event.target as Node)) {
			bellOpen = false;
		}
	}
	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			accountOpen = false;
			bellOpen = false;
		}
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
		bellOpen = false;
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
<header class="aurora aurora-6 sticky top-0 z-30 text-on-solid">
	<!-- Taller than a bar needs to be, deliberately: the band is a surface, and a surface
	     has to be big enough for its light to read as light. -->
	<div class="flex h-20 items-center gap-3 px-4 sm:h-24 sm:gap-6 sm:px-6 lg:px-8">
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
					The bell, and the few notices behind it.

					It was a link to the notifications page. A person glancing at a badge wants
					to know what it is *for*, and making them leave the page they are on to find
					out is the reason nobody read them. The page is still there, at the bottom of
					the panel, for everything the panel does not hold.
				-->
				<div class="relative" bind:this={bellRef}>
					<button
						type="button"
						class="relative rounded-control p-2 text-on-solid/80 transition-colors hover:bg-on-solid/10 hover:text-on-solid focus-visible:ring-2 focus-visible:ring-on-solid focus-visible:outline-none"
						aria-haspopup="menu"
						aria-expanded={bellOpen}
						aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
						onclick={() => (bellOpen = !bellOpen)}
					>
						<Icon icon={Notification02Icon} class="size-5" />
						{#if unread > 0}
							<!-- On a solid band the badge inverts: the accent that made it stand out
							     on a white bar is the colour it is now standing on. -->
							<span
								class="numeral absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-surface-raised px-1 text-[0.65rem] leading-4 font-semibold text-accent-text"
							>
								{unread > 9 ? '9+' : unread}
							</span>
						{/if}
					</button>

					{#if bellOpen}
						<div
							role="menu"
							aria-label="Notifications"
							class="absolute right-0 mt-2 w-80 origin-top-right rounded-card border border-border bg-surface-raised p-1.5 text-text shadow-card"
							transition:popover
						>
							{#if notifications.length === 0}
								<p class="text-muted px-3 py-6 text-center text-sm">Nothing to read.</p>
							{:else}
								<ul class="max-h-80 overflow-y-auto overscroll-contain">
									{#each notifications as notice (notice.id)}
										<li>
											<a
												href={notice.link || resolve('/notifications')}
												class="block rounded-control px-2.5 py-2 transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
											>
												<div class="flex items-start gap-2">
													<!-- The unread dot, because "unread" is a state and a state that
													     only bold type carries is a state a tired eye misses. -->
													<span
														class={cn(
															'mt-1.5 size-1.5 shrink-0 rounded-full',
															notice.read ? 'bg-transparent' : 'bg-accent'
														)}
													></span>

													<div class="min-w-0">
														<p
															class={cn(
																'truncate text-sm',
																notice.read ? 'text-muted' : 'font-medium'
															)}
														>
															{notice.title}
														</p>
														<p class="text-muted numeral mt-0.5 text-xs">
															{noticeDate.format(new Date(notice.created_at))}
														</p>
													</div>
												</div>
											</a>
										</li>
									{/each}
								</ul>

								<div class="mt-1 border-t border-border pt-1">
									<a
										href={resolve('/notifications')}
										class="block rounded-control px-2.5 py-2 text-sm font-medium text-accent-text transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
									>
										All notifications
									</a>
								</div>
							{/if}
						</div>
					{/if}
				</div>

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
							class="absolute right-0 mt-2 w-60 origin-top-right rounded-card border border-border bg-surface-raised p-1.5 text-text shadow-card"
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
