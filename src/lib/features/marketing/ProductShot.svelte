<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		src: string;
		alt: string;
		/** The address bar's text. It is the route the shot was actually taken at. */
		path: string;
		/** Which edge leans away. The shot recedes toward the page's edge, never at random. */
		tilt?: 'left' | 'right';
		/** Skip the lazy load for the one shot that is above the fold. */
		eager?: boolean;
		/** The glow behind the glass. Dark on the hero, tinted on the page. */
		glow?: 'light' | 'accent';
		class?: string;
	};

	let { src, alt, path, tilt, eager = false, glow = 'accent', class: className }: Props = $props();
</script>

<!-- A real screenshot of the running app, in a frame that says so. Nothing here is a mock. -->
<div class={cn('stage relative', className)}>
	<div
		class={cn(
			'pointer-events-none absolute -inset-10 -z-10 rounded-[40%] blur-3xl',
			glow === 'light' ? 'bg-white/12' : 'bg-accent/15 dark:bg-accent/25'
		)}
		aria-hidden="true"
	></div>

	<figure
		class={cn(
			'shot squircle bg-gradient-to-b from-white/70 to-white/20 p-px dark:from-white/15 dark:to-white/5',
			tilt === 'left' && 'tilt-left',
			tilt === 'right' && 'tilt-right'
		)}
	>
		<div class="squircle overflow-hidden bg-surface-raised">
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
				width="2360"
				height="1560"
				loading={eager ? 'eager' : 'lazy'}
				fetchpriority={eager ? 'high' : 'auto'}
				decoding="async"
				class="block w-full dark:brightness-90"
			/>
		</div>
	</figure>
</div>

<style>
	/* The shadow is three: a contact edge, the body, and the wide soft one it sits in. */
	.shot {
		box-shadow:
			0 1px 2px oklch(0 0 0 / 0.08),
			0 18px 36px -8px oklch(0 0 0 / 0.2),
			0 56px 100px -28px oklch(0 0 0 / 0.28);
	}

	/*
		Perspective, leaning away toward the page's edge — the frame is an object on the
		page, not a diagram of one. It straightens under the pointer.
	*/
	@media (prefers-reduced-motion: no-preference) {
		.stage {
			perspective: 1500px;
		}

		.shot {
			transition: transform var(--duration-slow, 400ms) cubic-bezier(0.2, 0.8, 0.2, 1);
			transform-style: preserve-3d;
		}

		.tilt-right {
			transform: rotateY(7deg) rotateX(2deg) rotateZ(-0.4deg) scale(0.98);
		}

		.tilt-left {
			transform: rotateY(-7deg) rotateX(2deg) rotateZ(0.4deg) scale(0.98);
		}

		.tilt-right:hover,
		.tilt-left:hover {
			transform: rotateY(0) rotateX(0) rotateZ(0) scale(1);
		}
	}
</style>
