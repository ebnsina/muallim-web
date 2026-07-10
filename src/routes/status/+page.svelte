<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Alert02Icon,
		CheckmarkCircle02Icon,
		WifiDisconnected01Icon
	} from '@hugeicons/core-free-icons';
	import { Card, Icon } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const status = $derived(data.apiStatus);
</script>

<svelte:head>
	<title>Status — Muallim</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!--
	Where the healthcheck lives now.

	It used to sit in the middle of the landing page, which is a page for people
	deciding whether to use this — not for people debugging it. "API returned 502"
	means nothing to a teacher and everything to whoever is running the thing, so
	it moved somewhere they can find it and nobody else has to.
-->
<main class="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
	<h1 class="text-2xl font-semibold">Status</h1>
	<p class="mt-2 text-sm text-muted">Whether this site can reach the service behind it.</p>

	<!-- Four states, not one. A page that renders only the success case is unfinished. -->
	<Card class="mt-8 p-5">
		{#if status.kind === 'ok'}
			<div class="flex items-start gap-3">
				<Icon icon={CheckmarkCircle02Icon} class="mt-0.5 size-5 shrink-0 text-success-text" />
				<div>
					<p class="font-medium">Everything is running</p>
					<p class="mt-1 text-sm text-muted">
						Serving version <span class="numeral">{status.version}</span>.
					</p>
				</div>
			</div>
		{:else if status.kind === 'unreachable'}
			<div class="flex items-start gap-3">
				<Icon icon={WifiDisconnected01Icon} class="mt-0.5 size-5 shrink-0 text-muted" />
				<div>
					<p class="font-medium">Nothing is answering</p>
					<p class="mt-1 text-sm text-muted">
						Start the API with <code>make run</code> in the
						<code>lms-api</code> repository.
					</p>
				</div>
			</div>
		{:else}
			<div class="flex items-start gap-3">
				<Icon icon={Alert02Icon} class="mt-0.5 size-5 shrink-0 text-warning-text" />
				<div>
					<p class="font-medium">
						The service answered with <span class="numeral">{status.status}</span>
					</p>
					<p class="mt-1 text-sm text-muted">{status.message}</p>
				</div>
			</div>
		{/if}
	</Card>

	<p class="mt-8 text-sm text-muted">
		<a class="underline underline-offset-4 hover:text-text" href={resolve('/')}>Back to the site</a>
	</p>
</main>
