<script lang="ts">
	import {
		Alert02Icon,
		CheckmarkCircle02Icon,
		Mortarboard02Icon,
		WifiDisconnected01Icon
	} from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const status = $derived(data.apiStatus);
</script>

<svelte:head>
	<title>LMS</title>
	<meta name="description" content="A multi-tenant learning management system." />
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
	<div class="flex items-center gap-3">
		<Icon icon={Mortarboard02Icon} class="size-7 text-accent" />
		<h1 class="text-2xl font-semibold">LMS</h1>
	</div>

	<p class="text-muted mt-3 text-pretty">
		A multi-tenant learning management system. This page renders the live state of
		<code class="bg-surface-hover rounded px-1.5 py-0.5 font-mono text-sm">lms-api</code>.
	</p>

	<!--
		Four states, not one. A component that renders only the success case is
		unfinished. There is no loading branch because `load` resolves before render.
	-->
	<div class="border-border mt-8 rounded-card border p-5">
		{#if status.kind === 'ok'}
			<div class="flex items-start gap-3">
				<Icon icon={CheckmarkCircle02Icon} class="mt-0.5 size-5 shrink-0 text-success-text" />
				<div>
					<p class="font-medium">API reachable</p>
					<p class="text-muted mt-1 text-sm">
						Serving version <span class="font-mono tabular-nums">{status.version}</span>.
					</p>
				</div>
			</div>
		{:else if status.kind === 'unreachable'}
			<div class="flex items-start gap-3">
				<Icon icon={WifiDisconnected01Icon} class="mt-0.5 size-5 shrink-0 text-muted" />
				<div>
					<p class="font-medium">API unreachable</p>
					<p class="text-muted mt-1 text-sm">
						Nothing is listening. Start it with
						<code class="bg-surface-hover rounded px-1.5 py-0.5 font-mono">make run</code>
						in the <code class="bg-surface-hover rounded px-1.5 py-0.5 font-mono">lms-api</code> repo.
					</p>
				</div>
			</div>
		{:else}
			<div class="flex items-start gap-3">
				<Icon
					icon={Alert02Icon}
					class="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
				/>
				<div>
					<p class="font-medium">API returned {status.status}</p>
					<p class="text-muted mt-1 text-sm">{status.message}</p>
				</div>
			</div>
		{/if}
	</div>
</main>
