<script lang="ts">
	import { Mortarboard02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
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
	The certificate itself.

	A bordered sheet, not a screenshot of one. It prints — the border and the
	serial survive a `Ctrl+P`, and nothing here depends on a colour that a printer
	would drop. `aria-hidden` on the flourish icons: a screen reader should read
	the words, not "graduation cap, graduation cap".

	Revoked, it says so across the top and dims the rest. The words stay legible,
	because somebody is checking them against a claim.
-->
<article
	class="relative mx-auto max-w-2xl rounded-card border-2 border-border bg-surface-raised px-8 py-12 text-center sm:px-14 sm:py-16"
	class:opacity-60={revoked}
>
	{#if revoked}
		<p
			class="mb-8 flex items-center justify-center gap-2 rounded-control border border-danger-border bg-danger-surface px-4 py-2 text-sm font-medium text-danger-text"
		>
			<Icon icon={Cancel01Icon} class="size-4" />
			This certificate has been withdrawn.
		</p>
	{/if}

	<Icon icon={Mortarboard02Icon} class="mx-auto size-10 text-accent" />

	<h1 class="mt-6 text-2xl font-semibold tracking-tight text-pretty sm:text-3xl">{title}</h1>

	<!--
		`whitespace-pre-line` so the paragraph breaks the template author wrote
		survive. The body is the server's rendered text; Svelte escapes it, and the
		server has already put the learner's name and the course title into it.
	-->
	<p class="text-muted mt-6 text-lg leading-relaxed whitespace-pre-line text-pretty">{body}</p>

	{#if signatory}
		<div class="mt-10 inline-block border-t border-border px-8 pt-3">
			<p class="font-medium">{signatory}</p>
		</div>
	{/if}

	<p class="numeral text-muted mt-10 text-xs tracking-wide">{serial}</p>
</article>
