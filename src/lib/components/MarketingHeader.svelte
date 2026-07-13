<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowDown01Icon, Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { cn } from '$lib/utils';
	import { SEGMENTS } from '$lib/content/segments';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	// The header sits over the hero and scrolls away with it — not sticky. `overDark`
	// pages (every hero is dark now) get white nav text.
	let { overDark = true }: { overDark?: boolean } = $props();

	const home = resolve('/');
	const ghost = $derived(overDark ? '!text-white hover:!bg-white/10' : '');
</script>

<header class="absolute inset-x-0 top-0 z-50">
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
		<a
			href={home}
			class={cn('flex shrink-0 items-center gap-2.5 font-semibold', overDark && 'text-white')}
		>
			<Icon
				icon={Mortarboard02Icon}
				class={cn('size-6', overDark ? 'text-white' : 'text-accent')}
			/>
			Muallim
		</a>

		<!-- Menu on the left, beside the logo. -->
		<nav class="hidden items-center gap-1 text-sm sm:flex">
			<div class="group relative">
				<button
					type="button"
					class={cn(
						'inline-flex items-center gap-1 rounded-control px-3 py-1.5 font-medium transition-colors',
						overDark ? 'text-white/80 hover:text-white' : 'text-muted hover:text-text'
					)}
				>
					Solutions
					<Icon
						icon={ArrowDown01Icon}
						class="size-4 transition-transform duration-(--duration-base) ease-out group-hover:rotate-180"
					/>
				</button>

				<!--
					The panel scales open from the corner it hangs off — `origin-top-left`, under
					the trigger's left edge — rather than swelling from its own middle. A popover
					that grows from its center is a popover that came from nowhere in particular;
					one that grows from its trigger is the trigger opening.

					And it starts at 95%, not at nothing, and not at a bare opacity fade: an
					element that only fades has no physical account of where it came from.
				-->
				<div
					class="invisible absolute top-full left-0 w-80 origin-top-left scale-95 pt-2 opacity-0
					       transition-[opacity,scale,visibility] duration-(--duration-base) ease-out
					       group-hover:visible group-hover:scale-100 group-hover:opacity-100
					       group-focus-within:visible group-focus-within:scale-100 group-focus-within:opacity-100"
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

			<Button href="{home}#capabilities" variant="ghost" size="sm" pill class={ghost}>
				What ships
			</Button>
		</nav>

		<!-- Sign in and the one CTA on the right. -->
		<div class="ml-auto flex items-center gap-1 sm:gap-2">
			<Button href={resolve('/login')} variant="ghost" size="sm" pill class={ghost}>Sign in</Button>
			<Button href={resolve('/register')} size="sm" pill>Get started</Button>
		</div>
	</div>
</header>
