<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Compass, ServerCrash, ArrowLeft, RotateCw } from '@lucide/svelte';

	const isNotFound = $derived(page.status === 404);
	const correlationId = $derived(page.error?.correlationId);

	function reload() {
		location.reload();
	}
</script>

<svelte:head>
	<title>{page.status} — {isNotFound ? 'Page not found' : 'Something went wrong'}</title>
</svelte:head>

<!--
	An error page that only apologises is a dead end. Both branches offer a way
	out: a route home always, and a retry when retrying could plausibly work.
-->
<main class="flex min-h-dvh items-center justify-center px-6 py-16">
	<div class="w-full max-w-md text-center">
		<div
			class="bg-surface-2 mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl"
			aria-hidden="true"
		>
			{#if isNotFound}
				<Compass class="text-muted size-8" />
			{:else}
				<ServerCrash class="size-8 text-red-600 dark:text-red-400" />
			{/if}
		</div>

		<p class="text-muted text-sm font-medium tracking-wide tabular-nums">
			Error {page.status}
		</p>

		<h1 class="mt-2 text-2xl font-semibold text-balance">
			{isNotFound ? 'We could not find that page' : 'Something went wrong on our end'}
		</h1>

		<p class="text-muted mt-3 text-pretty">
			{#if isNotFound}
				The page may have moved, or the link that brought you here may be out of date.
			{:else}
				{page.error?.message ?? 'An unexpected error occurred.'} We have been notified.
			{/if}
		</p>

		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<a
				href={resolve('/')}
				class="bg-accent focus-visible:ring-accent inline-flex items-center gap-2 rounded-lg px-4 py-2.5
				       text-sm font-medium text-white transition-colors hover:opacity-90
				       focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			>
				<ArrowLeft class="size-4" aria-hidden="true" />
				Back to home
			</a>

			{#if !isNotFound}
				<button
					type="button"
					onclick={reload}
					class="border-line focus-visible:ring-accent hover:bg-surface-2 inline-flex items-center gap-2
					       rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors
					       focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					<RotateCw class="size-4" aria-hidden="true" />
					Try again
				</button>
			{/if}
		</div>

		{#if correlationId}
			<p class="text-muted mt-8 text-xs">
				Quote this reference if you contact support:
				<code class="bg-surface-2 ml-1 rounded px-1.5 py-0.5 font-mono select-all">
					{correlationId}
				</code>
			</p>
		{/if}
	</div>
</main>
