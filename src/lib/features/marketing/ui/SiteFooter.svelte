<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight02Icon, Mortarboard01Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';

	/*
		The site's footer, owned by the (marketing) layout. It lived in the landing, so
		/solutions and /features had no footer at all and a reader who got there had no
		way onward.

		Its section links point at the landing's anchors absolutely (`/#faq`), because
		from any other page a bare `#faq` scrolls to nothing.

		The flag is drawn, not an emoji: 🇧🇩 renders as the letters "BD" on Windows,
		which is a worse way to say Bangladesh than saying Bangladesh. Its two colours
		are the flag's own and belong to no palette of ours — the same exception the
		hero photograph gets. Proportions are the official ones: 3:5, the disc at 9/20
		across so it sits true when the flag flies.
	*/
</script>

<footer class="bg-[var(--accent-band)] px-4 pb-6">
	<div
		class="mx-auto max-w-[84rem] rounded-[32px] bg-[var(--brand)] px-8 py-12 text-[var(--on-brand)]"
	>
		<div class="flex flex-wrap items-start justify-between gap-6">
			<a href={resolve('/')} class="inline-flex items-center gap-2 text-xl font-bold text-white">
				<span
					class="grid size-8 place-items-center rounded-lg bg-[var(--accent)] text-[var(--brand)]"
				>
					<Icon icon={Mortarboard01Icon} class="size-5" />
				</span>
				Muallim
			</a>
			<nav class="flex flex-wrap gap-6 text-sm text-[var(--on-brand)]/75">
				<a href="/#audiences" class="hover:text-white">Solutions</a>
				<a href={resolve('/(marketing)/features')} class="hover:text-white">Features</a>
				<a href="/#faq" class="hover:text-white">FAQ</a>
				<a href="mailto:hello@muallim.app" class="hover:text-white">Contact</a>
			</nav>
		</div>

		<div class="mt-10 grid gap-10 md:grid-cols-2">
			<div>
				<p class="max-w-sm text-sm leading-relaxed text-[var(--on-brand)]/70">
					Run the whole institution and teach the whole world — attendance, exams, report cards, and
					fees, in one place. You keep the money and the students.
				</p>
				<a
					href={resolve('/register')}
					class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline"
				>
					Start free <Icon icon={ArrowRight02Icon} class="size-4" />
				</a>
			</div>
			<div class="md:justify-self-end">
				<p class="text-sm font-semibold text-white">Contact</p>
				<a
					href="mailto:hello@muallim.app"
					class="mt-2 block text-sm text-[var(--on-brand)]/70 hover:text-white">hello@muallim.app</a
				>
				<p class="mt-4 text-sm font-semibold text-white">Built for</p>
				<p class="mt-2 max-w-xs text-sm text-[var(--on-brand)]/70">
					Bangladesh first, the world next · English interface, Bengali &amp; Arabic content
				</p>
			</div>
		</div>

		<div
			class="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[var(--on-brand)]/60"
		>
			<span>© 2026 Muallim · All rights reserved</span>
			<span class="flex items-center gap-2">
				<svg
					viewBox="0 0 30 18"
					class="h-3.5 w-auto rounded-[2px]"
					role="img"
					aria-label="Flag of Bangladesh"
				>
					<rect width="30" height="18" fill="#006a4e" />
					<circle cx="13.5" cy="9" r="3.6" fill="#f42a41" />
				</svg>
				Made in Bangladesh · for people who teach
			</span>
		</div>
	</div>
</footer>
