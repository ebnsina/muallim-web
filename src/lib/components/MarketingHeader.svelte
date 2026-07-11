<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowDown01Icon, Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { cn } from '$lib/utils';
	import { SEGMENTS } from '$lib/content/segments';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	// `overDark` pages (the landing) sit the header over a dark hero, so at the top
	// the nav is white; every page frosts and returns to normal text once scrolled.
	let { overDark = false }: { overDark?: boolean } = $props();

	let scrolled = $state(false);
	$effect(() => {
		const onScroll = () => (scrolled = window.scrollY > 8);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const light = $derived(overDark && !scrolled);
	const home = resolve('/');
	const ghost = $derived(light ? '!text-white hover:!bg-white/10' : '');
</script>

<header
	class={cn(
		'sticky top-0 z-50 transition-colors duration-200',
		scrolled ? 'bg-surface/80 backdrop-blur' : 'bg-transparent'
	)}
>
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
		<a
			href={home}
			class={cn('flex shrink-0 items-center gap-2.5 font-semibold', light && 'text-white')}
		>
			<Icon icon={Mortarboard02Icon} class={cn('size-6', light ? 'text-white' : 'text-accent')} />
			Muallim
		</a>

		<!-- Menu on the left, beside the logo. -->
		<nav class="hidden items-center gap-1 text-sm sm:flex">
			<div class="group relative">
				<button
					type="button"
					class={cn(
						'inline-flex items-center gap-1 rounded-control px-3 py-1.5 font-medium transition-colors',
						light ? 'text-white/80 hover:text-white' : 'text-muted hover:text-text'
					)}
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

			<Button href="{home}#pricing" variant="ghost" size="sm" class={ghost}>Pricing</Button>
			<Button href={resolve('/courses')} variant="ghost" size="sm" class={ghost}>Courses</Button>
		</nav>

		<!-- Sign in and Contact sales on the right. -->
		<div class="ml-auto flex items-center gap-1 sm:gap-2">
			<Button href={resolve('/login')} variant="ghost" size="sm" class={ghost}>Sign in</Button>
			<Button href="{home}#pricing" size="sm">Contact sales</Button>
		</div>
	</div>
</header>
