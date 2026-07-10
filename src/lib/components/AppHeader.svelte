<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		BookOpen01Icon,
		Cancel01Icon,
		Menu01Icon,
		Mortarboard02Icon,
		TeachingIcon,
		DashboardSquare01Icon
	} from '@hugeicons/core-free-icons';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import { DURATION } from '$lib/motion';
	import { cn } from '$lib/utils';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	type Props = {
		user?: { name: string; email: string; role: string };
		/** Shown only to somebody who may author. Hiding it is a courtesy, not a control. */
		canAuthor?: boolean;
	};

	let { user, canAuthor = false }: Props = $props();

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

	/*
		Navigating closes the panel.

		Left open it covers the page it just took you to, along with the button that
		would have closed it. `afterNavigate` rather than an `$effect` that reads the
		pathname for its dependency: both work, and only one of them says when it
		means to run.
	*/
	afterNavigate(() => {
		open = false;
	});
</script>

<header class="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
	<!-- ------------------------------------------------------ identity bar -->
	<div class="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
		<a href={resolve('/')} class="flex shrink-0 items-center gap-2.5 font-semibold">
			<span
				class="flex size-8 items-center justify-center rounded-control bg-accent-surface text-accent"
			>
				<Icon icon={Mortarboard02Icon} class="size-5" />
			</span>
			<span class="hidden text-[0.95rem] tracking-tight sm:inline">Muallim</span>
		</a>

		<div class="ml-auto flex items-center gap-2 sm:gap-3">
			<ThemeToggle />

			{#if user}
				<!--
					The name, its role, and a monogram — whose session this is. The sign-out
					sits beside them, because the next question after "who am I" is "how do I
					stop being them", and a dropdown would hide the answer behind a click.
				-->
				<div class="hidden items-center gap-2.5 sm:flex">
					<div class="text-right leading-tight">
						<p class="text-sm font-medium">{user.name}</p>
						<p class="text-muted text-xs capitalize">{user.role}</p>
					</div>
					<span
						class="flex size-9 items-center justify-center rounded-full bg-accent-surface text-sm font-semibold text-accent-text"
						aria-hidden="true"
					>
						{initials}
					</span>
				</div>

				<!--
					Its own route, not `/dashboard?/logout`. Signing out from the lesson you
					were reading should not deposit you on the dashboard on the way.
				-->
				<form method="POST" action="/logout" use:enhance class="hidden sm:block">
					<Button type="submit" variant="secondary" size="sm">Sign out</Button>
				</form>
			{:else}
				<div class="hidden items-center gap-3 sm:flex">
					<Button href={resolve('/login')} variant="ghost" size="sm">Sign in</Button>
					<Button href={resolve('/register')} size="sm">Get started</Button>
				</div>
			{/if}

			<!--
				A button that says what it controls and whether it is open. An icon that
				swaps between two glyphs tells that to whoever is looking at it and to
				nobody else.
			-->
			<button
				type="button"
				class="rounded-control p-2 text-muted transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:hidden"
				aria-expanded={open}
				aria-controls="mobile-nav"
				aria-label={open ? 'Close menu' : 'Open menu'}
				onclick={() => (open = !open)}
			>
				<Icon icon={open ? Cancel01Icon : Menu01Icon} class="size-5" />
			</button>
		</div>
	</div>

	<!-- --------------------------------------------------------- tab row -->
	<!--
		A row of tabs with an underline under the current one, the shape every
		application header has converged on: the sections are always visible, and
		where you are is a mark under a word rather than a colour you have to know to
		read. Hidden on a phone, where the menu button opens the same links stacked.
	-->
	<nav aria-label="Main" class="mx-auto hidden max-w-6xl items-center gap-1 px-4 sm:flex">
		{#each links as link (link.href)}
			{@const active = current(link.href)}
			<a
				href={link.href}
				aria-current={active ? 'page' : undefined}
				class={cn(
					'-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
					active
						? 'border-accent text-text'
						: 'border-transparent text-muted hover:border-border-strong hover:text-text'
				)}
			>
				<Icon icon={link.icon} class="size-4" />
				{link.label}
			</a>
		{/each}
	</nav>

	{#if open}
		<div
			id="mobile-nav"
			class="border-t border-border bg-surface sm:hidden"
			transition:slide={{ duration: DURATION.instant, easing: cubicOut }}
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
