<script lang="ts">
	/*
		A screenshot of the running app, with a caption that says what is in it.

		The picture is the claim. What this replaced drew the UI in HTML — a report card
		with a GPA nobody earned, a register of classes nobody teaches — and a stock
		photo of strangers standing in for the product. A drawing of a screen is a
		promise the screen has not made.

		Not a link: the section already has one call to action, and three more would be
		three ways to hesitate.
	*/
	type Props = {
		/** Path under /marketing. */
		src: string;
		/** What is actually on screen, for a reader who cannot see it. */
		alt: string;
		title: string;
		line: string;
	};
	let { src, alt, title, line }: Props = $props();
</script>

<figure
	class="m-0 flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-[color-mix(in_oklab,var(--ink)_9%,transparent)] bg-[var(--surface)]"
>
	<!--
		A window onto the screen at half scale, not the whole screen shrunk to fit.
		The captures are 2360px wide for exactly this: at 1180 the UI is legible, and
		1/3 of a page shows the nav, the breadcrumb and the page's own headline — which
		is what identifies it. Squeezed into the card's width instead, all three cards
		were grey mush.
	-->
	<!-- The fade belongs on the window, not the picture: masking the 1180px image put
	     the fade 800px along, where the card had already clipped it. -->
	<div
		class="h-64 overflow-hidden border-b border-[color-mix(in_oklab,var(--ink)_9%,transparent)] bg-[var(--surface-2)] [mask-image:linear-gradient(to_right,black_74%,transparent)]"
	>
		<img
			{src}
			{alt}
			width="2360"
			height="1290"
			loading="lazy"
			decoding="async"
			class="h-auto w-[1180px] max-w-none -translate-y-[118px]"
		/>
	</div>
	<figcaption class="p-6">
		<h3 class="m-0 text-xl font-extrabold tracking-tight text-[var(--ink)]">{title}</h3>
		<p class="mt-1.5 mb-0 text-sm leading-relaxed text-[var(--muted)]">{line}</p>
	</figcaption>
</figure>
