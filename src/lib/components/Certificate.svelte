<script lang="ts">
	import { Cancel01Icon, Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';

	type Props = {
		title: string;
		/** The rendered body: the placeholders are already filled in by the server. */
		body: string;
		signatory?: string;
		serial: string;
		revoked?: boolean;
	};

	let { title, body, signatory, serial, revoked = false }: Props = $props();
</script>

<!--
	The certificate itself — a printed award, not a card.

	The look is doing the work an official document's look does: a ruled inner
	frame set in from the edge, a seal, a serif face, a formal rule under the
	heading. None of it is decoration for its own sake; it is what tells someone at
	a glance that this is a certificate and not a receipt.

	It prints. The frame and the serial survive a `Ctrl+P`, and the meaning never
	rests on a colour a printer would drop — a screen reader reads the words, not
	the flourishes, which are `aria-hidden`.

	Revoked, it says so across the top and dims the sheet. The words stay legible,
	because somebody is holding it up against a claim.
-->
<article
	class="relative mx-auto max-w-2xl overflow-hidden rounded-card border border-border bg-surface-raised"
	class:opacity-70={revoked}
>
	<!-- A faint wash at the head of the sheet. Light enough to survive dark mode
	     and to vanish on a black-and-white printer without taking meaning with it. -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent-surface/50 to-transparent"
		aria-hidden="true"
	></div>

	<!-- The ruled inner frame. Inset from the edge, the way a diploma is. -->
	<div
		class="pointer-events-none absolute inset-3 rounded-[0.6rem] border border-accent-border/60 sm:inset-4"
		aria-hidden="true"
	></div>

	<div class="relative px-8 py-12 text-center sm:px-16 sm:py-16">
		{#if revoked}
			<p
				class="mb-8 flex items-center justify-center gap-2 rounded-control border border-danger-border bg-danger-surface px-4 py-2 text-sm font-medium text-danger-text"
			>
				<Icon icon={Cancel01Icon} class="size-4" />
				This certificate has been withdrawn.
			</p>
		{/if}

		<!-- The seal: two rings and the mark, a rosette without the ribbon. -->
		<div class="relative mx-auto size-20" aria-hidden="true">
			<div class="absolute inset-0 rounded-full border-2 border-accent/30"></div>
			<div class="absolute inset-[0.3rem] rounded-full border border-dashed border-accent/40"></div>
			<div
				class="absolute inset-2 flex items-center justify-center rounded-full bg-accent-surface text-accent"
			>
				<Icon icon={Mortarboard02Icon} class="size-8" />
			</div>
		</div>

		<p class="text-muted mt-6 text-xs tracking-[0.25em] uppercase">Certificate</p>

		<h1 class="mt-2 font-serif text-3xl font-medium tracking-tight text-pretty sm:text-4xl">
			{title}
		</h1>

		<!-- A short centred rule, the formal full stop under a heading. -->
		<div class="mx-auto mt-5 h-px w-16 bg-accent-border" aria-hidden="true"></div>

		<!--
			`whitespace-pre-line` so the paragraph breaks the template author wrote
			survive. The body is the server's rendered text — Svelte escapes it, and the
			server has already put the learner's name and course title into it. Serif,
			so the award reads as one.
		-->
		<p class="mt-8 font-serif text-lg leading-relaxed text-pretty whitespace-pre-line text-text/90">
			{body}
		</p>

		{#if signatory}
			<div class="mt-12 inline-block">
				<p class="font-serif text-lg italic">{signatory}</p>
				<div class="mt-1.5 h-px w-48 bg-border-strong" aria-hidden="true"></div>
				<p class="text-muted mt-1.5 text-xs tracking-wide uppercase">Signed</p>
			</div>
		{/if}

		<p class="numeral text-muted mt-10 text-xs tracking-wider">{serial}</p>
	</div>
</article>
