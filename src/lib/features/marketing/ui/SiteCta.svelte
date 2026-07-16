<script lang="ts">
	import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';

	/*
		The closing call to action, and the last thing on every marketing page. Its
		gradient runs cream → lime, landing exactly on the band the footer sits in, so
		the two read as one piece rather than two sections that happen to touch.

		It lived in the landing, which is why every other page ended on a hard cream
		edge above the footer.

		The "Our team" row of coloured discs and a "3+" is gone. They were `--face-*`
		placeholders — the tokens said so themselves, that they stood in for
		photographs — pretending to be the people you would be writing to, and the 3+
		counted nobody. A section promising a real person should not open with invented
		ones. The tokens went with them; they had no other reader.
	*/
</script>

<!-- CONTACT CTA on a lime gradient (Tailwind) -->
<section
	class="mt-24 bg-gradient-to-b from-[var(--cream)] via-[var(--cta-mid)] to-[var(--accent-band)] px-6 py-24 text-center"
>
	<!-- One line, by having room for one — a `max-w-[15ch]` was breaking a 21-character
	     heading in half. Not `text-nowrap`, which would hold it on one line straight
	     off the side of a phone. -->
	<h2
		class="mx-auto text-4xl font-bold leading-[1.05] tracking-tight text-[var(--brand)] sm:text-5xl"
	>
		Talk to a real person
	</h2>
	<p class="mx-auto mt-5 max-w-xl leading-relaxed text-[var(--cta-ink)]">
		Getting an institution online is a big step. Our team helps you set up, bring in your students,
		and take your first fee — no bots, no runaround.
	</p>
	<div class="mt-8 flex justify-center">
		<a
			href="mailto:hello@muallim.app"
			class="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--accent-tint)] transition duration-200 hover:bg-[var(--brand-soft)] motion-reduce:transition-none"
		>
			Talk to us <Icon icon={ArrowRight02Icon} class="size-4" />
		</a>
	</div>
</section>
