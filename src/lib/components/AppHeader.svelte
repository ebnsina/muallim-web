<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		Invoice01Icon,
		Menu01Icon,
		Mortarboard02Icon,
		Logout01Icon,
		Notification02Icon,
		PaintBoardIcon,
		Settings02Icon,
		UserIcon
	} from '@hugeicons/core-free-icons';
	import { popover } from '$lib/motion';
	import { cn } from '$lib/utils';
	import Badge from './Badge.svelte';
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
		/** Unread notification count for the bell badge. */
		unread?: number;
		/** The few notices behind the bell. Loaded with the page; see the layout. */
		notifications?: Notice[];
		/** The sidebar drawer's open state, shared with `AppSidebar` below `lg`. */
		menuOpen?: boolean;
	};

	let { user, unread = 0, notifications = [], menuOpen = $bindable(false) }: Props = $props();

	const noticeDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	// A monogram, from the first letters of the name. A face nobody uploaded is a
	// gray silhouette; two initials in the accent are a person.
	const initials = $derived(
		(user?.name ?? '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase() ?? '')
			.join('')
	);

	// The account menu, behind the avatar.
	let accountOpen = $state(false);
	let accountRef = $state<HTMLElement>();

	// The bell's panel. Its own flag and element, so opening one menu does not
	// silently close the other and leave a reader wondering what they pressed.
	let bellOpen = $state(false);
	let bellRef = $state<HTMLElement>();

	// A menu that opens on a click closes on a click anywhere else, and on Escape.
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

	// Navigating closes the panels; left open they cover the page they just reached.
	afterNavigate(() => {
		accountOpen = false;
		bellOpen = false;
	});
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<!--
	A band, not a bar. It runs the width of the window and the page lies on it as a
	sheet with its top corners rounded off. It carries the quick actions only — the
	brand, the bell, and the account. The sections live in the sidebar on the sheet.
-->
<header class="aurora aurora-frame sticky top-0 z-30 text-on-solid">
	<div class="flex h-20 items-center gap-3 px-4 sm:h-24 sm:gap-6 sm:px-6 lg:px-8">
		<!-- The menu button, below `lg`. It toggles the sidebar drawer; above `lg` the
		     sidebar is a rail on the sheet and this is gone. -->
		<button
			type="button"
			class="rounded-control p-2 text-on-solid/80 transition-colors hover:bg-on-solid/10 hover:text-on-solid focus-visible:ring-2 focus-visible:ring-on-solid focus-visible:outline-none lg:hidden"
			aria-expanded={menuOpen}
			aria-label="Menu"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<Icon icon={Menu01Icon} class="size-5" />
		</button>

		<a href={resolve('/')} class="flex shrink-0 items-center gap-2.5 font-semibold">
			<span class="flex size-8 items-center justify-center rounded-control bg-on-solid/15">
				<Icon icon={Mortarboard02Icon} class="size-5" />
			</span>
			<span class="hidden text-[0.95rem] tracking-tight sm:inline">Muallim</span>
		</a>

		<div class="ml-auto flex items-center gap-2 sm:gap-3">
			{#if user}
				<!--
					The bell, and the few notices behind it. The notifications page is still
					there, at the bottom of the panel, for everything the panel does not hold.
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
							     on a white bar is the color it is now standing on. -->
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
					name, theme, sign out — gather under one control rather than spreading
					across the band.
				-->
				<div class="relative" bind:this={accountRef}>
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
							class="absolute right-0 mt-2 w-64 origin-top-right rounded-card border border-border bg-surface-raised p-1.5 text-text shadow-card"
							transition:popover
						>
							<!-- Who you are, on the menu that acts as you. A workspace with two people
						     called Ahmed is a workspace where the name alone is not an answer. -->
							<div class="flex items-center gap-3 px-2.5 py-2.5">
								<span
									class="bg-accent-surface text-accent-text flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
								>
									{initials}
								</span>

								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{user.name}</p>
									<p class="text-muted truncate text-xs">{user.email}</p>
								</div>
							</div>

							<div class="px-2.5 pb-2">
								<Badge tone="neutral" class="capitalize">{user.role}</Badge>
							</div>

							<div class="my-1 border-t border-border"></div>

							<!-- The places, then the switch, then the way out — the order every account
						     menu on the web uses, because it is the order people reach for them. -->
							<a
								role="menuitem"
								href={resolve('/profile')}
								class="hover:bg-surface-hover flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								<Icon icon={UserIcon} class="text-muted size-4" />
								Your profile
							</a>

							<!-- What you bought, beside who you are: a receipt is personal, not a section. -->
							<a
								role="menuitem"
								href={resolve('/receipts')}
								class="hover:bg-surface-hover flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								<Icon icon={Invoice01Icon} class="text-muted size-4" />
								Purchases
							</a>

							<a
								role="menuitem"
								href={resolve('/settings')}
								class="hover:bg-surface-hover flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								<Icon icon={Settings02Icon} class="text-muted size-4" />
								Settings
							</a>

							<div class="my-1 border-t border-border"></div>

							<div class="flex items-center justify-between gap-3 px-2.5 py-1.5">
								<span class="text-muted flex items-center gap-2.5 text-sm">
									<Icon icon={PaintBoardIcon} class="size-4" />
									Theme
								</span>
								<ThemeToggle />
							</div>

							<div class="my-1 border-t border-border"></div>

							<!--
							Its own route, not `/dashboard?/logout`. Signing out from the lesson
							you were reading should not deposit you on the dashboard on the way.
						-->
							<form method="POST" action="/logout" use:enhance class="p-0.5">
								<Button type="submit" variant="ghost" size="sm" class="w-full justify-start">
									<Icon icon={Logout01Icon} class="size-4" />
									Sign out
								</Button>
							</form>
						</div>
					{/if}
				</div>
			{:else}
				<ThemeToggle />
				<Button href={resolve('/login')} variant="ghost" size="sm">Sign in</Button>
				<Button href={resolve('/register')} size="sm">Get started</Button>
			{/if}
		</div>
	</div>
</header>
