<script lang="ts">
	import { resolve } from '$app/paths';
	import { Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { Button, Icon, ThemeToggle } from '$lib/components';

	// The landing's own header: the shared MarketingHeader overflows below ~360px.
	// It floats over the hero and scrolls away with it — not sticky, no border.
	const here = resolve('/');

	const LINKS = [
		{ label: 'Everything it does', hash: 'capabilities' },
		{ label: 'Assessment', hash: 'assess' },
		{ label: 'Course sales', hash: 'sales' }
	];
</script>

<header class="absolute inset-x-0 top-0 z-50">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
		<a href={here} class="flex shrink-0 items-center gap-2.5 font-semibold">
			<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
			Muallim
		</a>

		<nav class="hidden items-center gap-1 text-sm md:flex" aria-label="Sections">
			{#each LINKS as link (link.hash)}
				<a
					href="{here}#{link.hash}"
					class="rounded-control px-3 py-1.5 font-medium text-muted transition-colors hover:text-text"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
			<ThemeToggle class="hidden sm:inline-flex" />
			<Button href={resolve('/login')} variant="ghost" size="sm" pill>Sign in</Button>
			<Button href={resolve('/register')} size="sm" pill>Get started</Button>
		</div>
	</div>
</header>
