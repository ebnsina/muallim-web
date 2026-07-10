<script lang="ts">
	import { resolve } from '$app/paths';
	import { Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { Certificate, Icon, ThemeToggle } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const certificate = $derived(data.certificate);

	const issued = $derived(
		new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
			new Date(certificate.issued_at)
		)
	);
</script>

<svelte:head>
	<title>Certificate {certificate.serial} — Muallim</title>
	<!-- A verification page is a fact about a person; it is not for a search index. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<!--
	Its own chrome, not the app's. This page is reached with no session — by an
	employer, an admissions office — so it carries a way in rather than a signed-in
	header. No AppHeader, because there is nobody signed in to draw one for.
-->
<div class="flex min-h-dvh flex-col">
	<header class="border-b border-border">
		<div class="mx-auto flex h-16 max-w-4xl items-center gap-4 px-6">
			<a href={resolve('/')} class="flex items-center gap-2.5 font-semibold">
				<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
				Muallim
			</a>
			<div class="ml-auto"><ThemeToggle /></div>
		</div>
	</header>

	<main class="flex-1 px-6 py-12 sm:py-16">
		<p class="text-muted mx-auto max-w-2xl text-center text-sm">
			{#if certificate.revoked}
				This certificate was issued by Muallim and has since been withdrawn.
			{:else}
				This certificate was issued by Muallim and is valid.
			{/if}
		</p>

		<div class="mt-8">
			<Certificate
				title={certificate.title}
				body={certificate.body}
				signatory={certificate.signatory}
				serial={certificate.serial}
				revoked={certificate.revoked}
			/>
		</div>

		<!--
			The facts a verifier is actually checking, out of the certificate's own
			prose and into a plain list: who, what course, and when.
		-->
		<dl
			class="text-muted mx-auto mt-8 grid max-w-2xl gap-x-8 gap-y-2 text-sm sm:grid-cols-[auto_1fr]"
		>
			<dt class="font-medium text-text">Awarded to</dt>
			<dd>{certificate.learner_name}</dd>

			<dt class="font-medium text-text">Course</dt>
			<dd>{certificate.course_title}</dd>

			<dt class="font-medium text-text">Issued</dt>
			<dd>{issued}</dd>

			{#if certificate.revoked && certificate.revoked_reason}
				<dt class="font-medium text-danger-text">Withdrawn</dt>
				<dd>{certificate.revoked_reason}</dd>
			{/if}
		</dl>
	</main>
</div>
