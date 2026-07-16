<script lang="ts">
	import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';

	/*
		The closing call to action, and the last thing on every marketing page. Its
		gradient runs cream → lime, landing exactly on the band the footer sits in, so
		the two read as one piece rather than two sections that happen to touch.

		It lived in the landing, which is why every other page ended on a hard cream
		edge above the footer.
	*/
</script>

<!-- CONTACT CTA on a lime gradient (Tailwind) -->
<section
	class="mt-24 bg-gradient-to-b from-[var(--cream)] via-[var(--cta-mid)] to-[var(--accent-band)] px-6 py-24 text-center"
>
	<h2
		class="mx-auto max-w-[15ch] text-4xl font-bold leading-[1.05] tracking-tight text-[var(--brand)] sm:text-5xl"
	>
		Talk to a real person
	</h2>
	<p class="mx-auto mt-5 max-w-xl leading-relaxed text-[var(--cta-ink)]">
		Getting an institution online is a big step. Our team helps you set up, bring in your students,
		and take your first fee — no bots, no runaround.
	</p>
	<div class="mt-8 flex flex-wrap items-center justify-center gap-4">
		<div class="flex items-center gap-3">
			<span class="text-sm font-semibold text-[var(--brand)]">Our team</span>
			<div class="flex items-center">
				<span class="size-8 rounded-full border-2 border-[var(--accent-band)] bg-[var(--face-1)]"
				></span>
				<span
					class="-ml-2 size-8 rounded-full border-2 border-[var(--accent-band)] bg-[var(--face-2)]"
				></span>
				<span
					class="-ml-2 size-8 rounded-full border-2 border-[var(--accent-band)] bg-[var(--face-3)]"
				></span>
				<span
					class="-ml-2 grid size-8 place-items-center rounded-full border-2 border-[var(--accent-band)] bg-[var(--brand)] text-xs font-bold text-[var(--accent)]"
					>3+</span
				>
			</div>
		</div>
		<span class="hidden h-8 w-px bg-[var(--brand)]/20 sm:block"></span>
		<a
			href="mailto:hello@muallim.app"
			class="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--accent-tint)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-soft)]"
		>
			Talk to us <Icon icon={ArrowRight02Icon} class="size-4" />
		</a>
	</div>
</section>
