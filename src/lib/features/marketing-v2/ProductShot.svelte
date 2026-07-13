<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		src: string;
		alt: string;
		/** The address bar's text. It is the route the shot was actually taken at. */
		path: string;
		/** Skip the lazy load for the one shot that is above the fold. */
		eager?: boolean;
		class?: string;
	};

	let { src, alt, path, eager = false, class: className }: Props = $props();
</script>

<!-- A real screenshot of the running app, in a frame that says so. Nothing here is a mock. -->
<figure
	class={cn(
		'squircle overflow-hidden bg-surface-raised ring-1 shadow-2xl ring-black/10 dark:ring-white/10',
		className
	)}
>
	<div class="flex items-center gap-2 border-b border-border bg-surface-sunken px-4 py-2.5">
		<span class="flex gap-1.5" aria-hidden="true">
			<span class="size-2.5 rounded-full bg-border-strong/60"></span>
			<span class="size-2.5 rounded-full bg-border-strong/60"></span>
			<span class="size-2.5 rounded-full bg-border-strong/60"></span>
		</span>
		<span
			class="numeral mx-auto truncate rounded-pill bg-surface px-3 py-1 text-xs text-muted"
			aria-hidden="true"
		>
			{path}
		</span>
	</div>

	<img
		{src}
		{alt}
		width="2160"
		height="1350"
		loading={eager ? 'eager' : 'lazy'}
		fetchpriority={eager ? 'high' : 'auto'}
		decoding="async"
		class="block w-full dark:brightness-90"
	/>
</figure>
