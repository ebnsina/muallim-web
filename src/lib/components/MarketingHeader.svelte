<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowDown01Icon, Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { SEGMENTS } from '$lib/content/segments';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	const home = resolve('/');
</script>

<header class="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
		<a href={home} class="flex shrink-0 items-center gap-2.5 font-semibold">
			<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
			Muallim
		</a>

		<!-- Menu on the left, beside the logo. -->
		<nav class="hidden items-center gap-1 text-sm sm:flex">
			<!-- Opens on hover and on keyboard focus, so it needs no click handler and
			     closes itself the moment focus leaves. -->
			<div class="group relative">
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-control px-3 py-1.5 font-medium text-muted transition-colors hover:text-text"
				>
					Solutions
					<Icon icon={ArrowDown01Icon} class="size-4 transition-transform group-hover:rotate-180" />
				</button>

				<div
					class="invisible absolute top-full left-0 w-80 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
				>
					<div class="rounded-overlay border border-border bg-surface-raised p-2 shadow-lg">
						{#each SEGMENTS as s (s.slug)}
							<a
								href={resolve('/solutions/[slug]', { slug: s.slug })}
								class="block rounded-control px-3 py-2.5 transition-colors hover:bg-surface"
							>
								<span class="font-medium">{s.nav}</span>
								<span class="mt-0.5 block text-xs text-muted">{s.tagline}</span>
							</a>
						{/each}
					</div>
				</div>
			</div>

			<Button href="{home}#pricing" variant="ghost" size="sm">Pricing</Button>
			<Button href={resolve('/courses')} variant="ghost" size="sm">Courses</Button>
		</nav>

		<!-- Sign in and Contact sales on the right. -->
		<div class="ml-auto flex items-center gap-1 sm:gap-2">
			<ThemeToggle />
			<Button href={resolve('/login')} variant="ghost" size="sm">Sign in</Button>
			<Button href="{home}#pricing" size="sm">Contact sales</Button>
		</div>
	</div>
</header>
