<script lang="ts">
	import { resolve } from '$app/paths';
	import { Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { Button, Icon } from '$lib/components';

	// v2's own header: the shared MarketingHeader overflows the viewport below ~360px.
	const here = resolve('/v2');

	const LINKS = [
		{ label: 'What ships', hash: 'capabilities' },
		{ label: 'Assessment', hash: 'assess' },
		{ label: 'Course sales', hash: 'sales' }
	];
</script>

<!-- Floats over the hero and scrolls away with it. Not sticky, no border. -->
<header class="absolute inset-x-0 top-0 z-50 text-white">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
		<a href={here} class="flex shrink-0 items-center gap-2.5 font-semibold">
			<Icon icon={Mortarboard02Icon} class="size-6" />
			Muallim
		</a>

		<nav class="hidden items-center gap-1 text-sm md:flex" aria-label="Sections">
			{#each LINKS as link (link.hash)}
				<a
					href="{here}#{link.hash}"
					class="rounded-control px-3 py-1.5 font-medium text-white/75 transition-colors hover:text-white"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
			<Button
				href={resolve('/login')}
				variant="ghost"
				size="sm"
				pill
				class="!text-white hover:!bg-white/10"
			>
				Sign in
			</Button>
			<Button href={resolve('/register')} size="sm" pill>Get started</Button>
		</div>
	</div>
</header>
