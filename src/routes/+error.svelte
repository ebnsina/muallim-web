<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import {
		ArrowLeft01Icon,
		Compass01Icon,
		RefreshIcon,
		ServerStack01Icon
	} from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';

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
			class="bg-surface-hover mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl"
			aria-hidden="true"
		>
			{#if isNotFound}
				<Icon icon={Compass01Icon} class="size-8 text-muted" />
			{:else}
				<Icon icon={ServerStack01Icon} class="size-8 text-danger-text" />
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
				class="bg-accent text-on-solid focus-visible:ring-ring inline-flex items-center gap-2
				       rounded-card px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-90
				       focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			>
				<Icon icon={ArrowLeft01Icon} class="size-4" />
				Back to home
			</a>

			{#if !isNotFound}
				<button
					type="button"
					onclick={reload}
					class="border-border focus-visible:ring-ring hover:bg-surface-hover inline-flex items-center gap-2
					       rounded-card border px-4 py-2.5 text-sm font-medium transition-colors
					       focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					<Icon icon={RefreshIcon} class="size-4" />
					Try again
				</button>
			{/if}
		</div>

		{#if correlationId}
			<p class="text-muted mt-8 text-xs">
				Quote this reference if you contact support:
				<code class="bg-surface-hover ml-1 rounded px-1.5 py-0.5 font-mono select-all">
					{correlationId}
				</code>
			</p>
		{/if}
	</div>
</main>
