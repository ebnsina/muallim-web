<script lang="ts">
	import { CheckCircle2, CloudOff, TriangleAlert, GraduationCap } from '@lucide/svelte';
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
		<GraduationCap class="text-accent size-7" aria-hidden="true" />
		<h1 class="text-2xl font-semibold">LMS</h1>
	</div>

	<p class="text-muted mt-3 text-pretty">
		A multi-tenant learning management system. This page renders the live state of
		<code class="bg-surface-2 rounded px-1.5 py-0.5 font-mono text-sm">lms-api</code>.
	</p>

	<!--
		Four states, not one. A component that renders only the success case is
		unfinished. There is no loading branch because `load` resolves before render.
	-->
	<div class="border-line mt-8 rounded-xl border p-5">
		{#if status.kind === 'ok'}
			<div class="flex items-start gap-3">
				<CheckCircle2
					class="mt-0.5 size-5 shrink-0 text-green-700 dark:text-green-400"
					aria-hidden="true"
				/>
				<div>
					<p class="font-medium">API reachable</p>
					<p class="text-muted mt-1 text-sm">
						Serving version <span class="font-mono tabular-nums">{status.version}</span>.
					</p>
				</div>
			</div>
		{:else if status.kind === 'unreachable'}
			<div class="flex items-start gap-3">
				<CloudOff class="text-muted mt-0.5 size-5 shrink-0" aria-hidden="true" />
				<div>
					<p class="font-medium">API unreachable</p>
					<p class="text-muted mt-1 text-sm">
						Nothing is listening. Start it with
						<code class="bg-surface-2 rounded px-1.5 py-0.5 font-mono">make run</code>
						in the <code class="bg-surface-2 rounded px-1.5 py-0.5 font-mono">lms-api</code> repo.
					</p>
				</div>
			</div>
		{:else}
			<div class="flex items-start gap-3">
				<TriangleAlert
					class="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
					aria-hidden="true"
				/>
				<div>
					<p class="font-medium">API returned {status.status}</p>
					<p class="text-muted mt-1 text-sm">{status.message}</p>
				</div>
			</div>
		{/if}
	</div>
</main>
