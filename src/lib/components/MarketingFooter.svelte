<script lang="ts">
	import { resolve } from '$app/paths';
	import { Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { SEGMENTS } from '$lib/content/segments';
	import Icon from './Icon.svelte';

	const home = resolve('/');
</script>

<footer class="border-t border-border">
	<div class="mx-auto max-w-6xl px-6 py-16">
		<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
			<div class="lg:col-span-1">
				<a href={home} class="flex items-center gap-2.5 font-semibold">
					<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
					Muallim
				</a>
				<p class="mt-4 max-w-xs text-sm text-pretty text-muted">
					Build a course, invite your students, and let the marking take care of itself.
				</p>
			</div>

			<nav aria-label="Solutions">
				<h2 class="text-sm font-semibold">Solutions</h2>
				<ul class="mt-4 space-y-2.5 text-sm text-muted">
					{#each SEGMENTS as s (s.slug)}
						<li>
							<a
								class="underline-offset-4 hover:underline"
								href={resolve('/solutions/[slug]', { slug: s.slug })}
							>
								{s.nav}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<nav aria-label="Product">
				<h2 class="text-sm font-semibold">Product</h2>
				<ul class="mt-4 space-y-2.5 text-sm text-muted">
					<li><a class="underline-offset-4 hover:underline" href="{home}#pricing">Pricing</a></li>
					<li>
						<a class="underline-offset-4 hover:underline" href={resolve('/courses')}>Courses</a>
					</li>
					<li>
						<a class="underline-offset-4 hover:underline" href={resolve('/ui')}>Design system</a>
					</li>
				</ul>
			</nav>

			<nav aria-label="Account">
				<h2 class="text-sm font-semibold">Account</h2>
				<ul class="mt-4 space-y-2.5 text-sm text-muted">
					<li>
						<a class="underline-offset-4 hover:underline" href={resolve('/login')}>Sign in</a>
					</li>
					<li>
						<a class="underline-offset-4 hover:underline" href={resolve('/register')}>
							Create an account
						</a>
					</li>
					<li>
						<a class="underline-offset-4 hover:underline" href={resolve('/forgot-password')}>
							Forgot your password
						</a>
					</li>
				</ul>
			</nav>

			<nav aria-label="More">
				<h2 class="text-sm font-semibold">More</h2>
				<ul class="mt-4 space-y-2.5 text-sm text-muted">
					<li>
						<a class="underline-offset-4 hover:underline" href={resolve('/status')}>Status</a>
					</li>
				</ul>
			</nav>
		</div>

		<div
			class="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted"
		>
			<p>© <span class="numeral">2026</span> Muallim</p>
			<p>Made for people who teach.</p>
		</div>
	</div>
</footer>
