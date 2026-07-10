<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Mortarboard02Icon } from '@hugeicons/core-free-icons';
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

	// `startsWith` and not equality: /teach/algebra should still light up "Teach".
	const current = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<header class="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
		<a href={resolve('/')} class="flex shrink-0 items-center gap-2.5 font-semibold">
			<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
			<span class="hidden sm:inline">Muallim</span>
		</a>

		<nav aria-label="Main" class="flex items-center gap-1">
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
					<p class="text-xs text-muted">{user.role}</p>
				</div>

				<form method="POST" action="/dashboard?/logout" use:enhance>
					<Button type="submit" variant="secondary" size="sm">Sign out</Button>
				</form>
			{:else}
				<Button href={resolve('/login')} variant="ghost" size="sm">Sign in</Button>
				<Button href={resolve('/register')} size="sm">Get started</Button>
			{/if}
		</div>
	</div>
</header>
