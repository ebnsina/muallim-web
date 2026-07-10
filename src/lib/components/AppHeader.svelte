<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Cancel01Icon, Menu01Icon, Mortarboard02Icon } from '@hugeicons/core-free-icons';
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

	const links = $derived(
		[
			{ href: resolve('/dashboard'), label: 'Dashboard', show: Boolean(user) },
			{ href: resolve('/courses'), label: 'Courses', show: true },
			{ href: resolve('/teach'), label: 'Teach', show: canAuthor }
		].filter((link) => link.show)
	);

	// `startsWith` on a trailing slash, not equality: /teach/algebra lights up
	// "Teach", and /teaching does not.
	const current = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

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

<header class="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
		<a href={resolve('/')} class="flex shrink-0 items-center gap-2.5 font-semibold">
			<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
			<span class="hidden sm:inline">Muallim</span>
		</a>

		<nav aria-label="Main" class="hidden items-center gap-1 sm:flex">
			{#each links as link (link.href)}
				<a
					href={link.href}
					aria-current={current(link.href) ? 'page' : undefined}
					class={cn(
						'rounded-pill px-3 py-1.5 text-sm font-medium transition-colors',
						current(link.href) ? 'bg-surface-active text-text' : 'text-muted hover:text-text'
					)}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-3">
			<ThemeToggle />

			{#if user}
				<!--
					The name and the sign-out sit together, because that is the question the
					name answers: whose session is this, and how do I end it. A dropdown
					would hide the second behind a click and buy nothing.
				-->
				<div class="hidden text-right sm:block">
					<p class="text-sm leading-tight font-medium">{user.name}</p>
					<p class="text-muted text-xs">{user.role}</p>
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
							'rounded-control px-3 py-2.5 text-sm font-medium transition-colors',
							current(link.href) ? 'bg-surface-active text-text' : 'text-muted hover:text-text'
						)}
					>
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
