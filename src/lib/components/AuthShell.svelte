<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';

	type Props = {
		title: string;
		subtitle?: string;
		/** The pull-quote on the brand panel. One claim, and one that is true. */
		pitch: string;
		attribution?: string;
		children: Snippet;
		/** Links below the form: forgotten password, the other account action. */
		footer?: Snippet;
	};

	let { title, subtitle, pitch, attribution, children, footer }: Props = $props();
</script>

<!--
	Two columns above `lg`, one below it.

	The form is on the left and the brand panel on the right, so the first thing a
	keyboard or screen-reader user reaches is the thing they came for. A panel that
	comes first in the DOM is a panel every one of them tabs through, every time.
-->
<div class="grid min-h-dvh lg:grid-cols-2">
	<div class="flex flex-col px-6 py-10 sm:px-12">
		<a
			href={resolve('/')}
			class="inline-flex w-fit items-center gap-2.5 rounded-pill text-sm font-semibold"
		>
			<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
			LMS
		</a>

		<main class="flex flex-1 items-center py-12">
			<div class="mx-auto w-full max-w-sm">
				<h1 class="text-3xl font-semibold tracking-tight">{title}</h1>
				{#if subtitle}
					<p class="mt-2 text-sm text-muted">{subtitle}</p>
				{/if}

				{@render children()}

				{#if footer}
					<div class="mt-8 space-y-2 text-sm text-muted">{@render footer()}</div>
				{/if}
			</div>
		</main>
	</div>

	<!--
		Decoration, and marked as such. Nothing here is an instruction, a control, or
		information the form needs, so a screen reader is spared the whole column.
	-->
	<aside
		aria-hidden="true"
		class="relative hidden overflow-hidden bg-accent lg:flex lg:flex-col lg:justify-end"
	>
		<!-- Two soft washes of the ramp, not an image: it costs nothing and it themes. -->
		<div
			class="absolute inset-0 opacity-70"
			style="background:
				radial-gradient(60rem 40rem at 15% 10%, var(--b-10), transparent 60%),
				radial-gradient(50rem 40rem at 90% 90%, var(--b-8), transparent 55%);"
		></div>

		<div class="relative p-12 xl:p-16">
			<figure class="max-w-lg">
				<blockquote class="text-2xl leading-snug font-medium text-on-solid text-pretty">
					{pitch}
				</blockquote>
				{#if attribution}
					<figcaption class="mt-6 text-sm text-on-solid/70">{attribution}</figcaption>
				{/if}
			</figure>
		</div>
	</aside>
</div>
