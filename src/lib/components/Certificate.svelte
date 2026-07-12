<script lang="ts">
	import { Cancel01Icon, Mortarboard02Icon } from '@hugeicons/core-free-icons';
	import { auroraFor, cn } from '$lib/utils';
	import Icon from './Icon.svelte';

	type Props = {
		/** The heading, e.g. "Certificate of Completion". */
		title: string;
		learnerName: string;
		courseTitle: string;
		/** A formatted date string; the caller owns the locale. */
		issuedAt: string;
		/** The description — the template body, already rendered by the server. */
		body: string;
		signatory?: string;
		serial: string;
		revoked?: boolean;
	};

	let {
		title,
		learnerName,
		courseTitle,
		issuedAt,
		body,
		signatory,
		serial,
		revoked = false
	}: Props = $props();

	/*
		A scalloped seal edge, as a path.

		A stamp reads as a stamp because of its pinked border. Each segment is a small
		arc bulging outward, so the whole is a ring of scallops — computed rather than
		drawn by hand, because thirty-two identical bumps is not a thing to place by
		eye.
	*/
	function scallop(cx: number, cy: number, radius: number, bumps: number): string {
		const point = (i: number) => {
			const angle = (i / bumps) * 2 * Math.PI - Math.PI / 2;
			return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
		};
		const r = radius * Math.sin(Math.PI / bumps);

		const [x0, y0] = point(0);
		let d = `M ${x0.toFixed(2)} ${y0.toFixed(2)}`;
		for (let i = 1; i <= bumps; i++) {
			const [x, y] = point(i % bumps);
			d += ` A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
		}
		return d + ' Z';
	}

	const sealEdge = scallop(60, 60, 52, 30);
</script>

<!--
	The certificate — a landscape award, not a card.

	Its shape is doing the work an official document's shape does: the facts sit in
	fixed places a certificate always puts them — a date at the head, a name given
	room, a course named in a sentence — beside a dark emblem panel and a seal. None
	of it is ornament for its own sake; it is what tells someone at a glance that
	this is a certificate.

	It prints. `print-color-adjust: exact` keeps the panel and the seal on the page
	rather than letting a printer drop them to save ink, because here the look is
	the point. The flourishes are `aria-hidden`; a screen reader reads the words.

	Revoked, a band says so and the sheet dims — the words stay legible, because
	somebody is holding it up against a claim.
-->
<article
	class="relative mx-auto grid max-w-4xl overflow-hidden rounded-card border border-border bg-surface-raised [print-color-adjust:exact] sm:grid-cols-[1fr_auto]"
	class:opacity-70={revoked}
>
	<!-- ------------------------------------------------------ content (left) -->
	<div class="relative px-8 py-10 sm:px-12 sm:py-14">
		{#if revoked}
			<p
				class="mb-6 flex items-center gap-2 rounded-control border border-danger-border bg-danger-surface px-4 py-2 text-sm font-medium text-danger-text"
			>
				<Icon icon={Cancel01Icon} class="size-4" />
				This certificate has been withdrawn.
			</p>
		{/if}

		<p class="text-muted text-xs font-medium tracking-[0.15em] uppercase">
			Date: {issuedAt}
		</p>

		<h1 class="mt-5 text-2xl font-bold tracking-tight text-pretty uppercase sm:text-3xl">
			{title}
		</h1>

		<p class="text-muted mt-6 text-sm">This acknowledges that</p>

		<!-- The name, given the room a name is given on an award. -->
		<p class="mt-1 font-serif text-3xl font-semibold text-accent-text sm:text-4xl">{learnerName}</p>

		<p class="mt-6 max-w-md text-pretty">
			has successfully completed the
			<span class="font-semibold text-text">{courseTitle}</span>.
		</p>

		{#if body}
			<!--
				The description, `whitespace-pre-line` so an author's paragraph breaks
				survive. Escaped by Svelte; the server rendered any placeholders in it.
			-->
			<p class="text-muted mt-5 max-w-md text-sm leading-relaxed whitespace-pre-line text-pretty">
				{body}
			</p>
		{/if}

		<!-- Signature and issuer, along the foot — the two marks an award carries. -->
		<div class="mt-10 flex flex-wrap items-end justify-between gap-6">
			{#if signatory}
				<div>
					<p class="font-serif text-lg italic">{signatory}</p>
					<div class="mt-1 h-px w-44 bg-border-strong" aria-hidden="true"></div>
					<p class="text-muted mt-1.5 text-xs tracking-wide uppercase">Signed</p>
				</div>
			{/if}

			<div class="flex items-center gap-2">
				<span
					class="flex size-7 items-center justify-center rounded-control bg-accent text-on-solid"
				>
					<Icon icon={Mortarboard02Icon} class="size-4" />
				</span>
				<span class="text-sm font-semibold tracking-tight">Muallim</span>
			</div>
		</div>

		<p class="numeral text-muted mt-6 text-xs tracking-wider">{serial}</p>
	</div>

	<!-- --------------------------------------------------- emblem panel (right) -->
	<!--
		The dark panel with its emblem. Hidden on a phone, where a landscape strip of
		it would be a sliver nobody could read; the seal below carries the mark there.
	-->
	<div
		class={cn(
			'aurora aurora-ink relative hidden w-56 overflow-hidden text-on-solid [print-color-adjust:exact] sm:block',
			auroraFor(serial)
		)}
		aria-hidden="true"
	>
		<!-- The emblem, glowing. A blurred disc of light behind a crisp mark. -->
		<div class="absolute top-14 left-1/2 -translate-x-1/2">
			<div
				class="absolute inset-0 -z-10 rounded-full blur-2xl"
				style="background: oklch(0.6 0.07 270 / 0.4);"
			></div>
			<span
				class="flex size-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur"
			>
				<Icon icon={Mortarboard02Icon} class="size-11 text-white" strokeWidth={1.5} />
			</span>
		</div>
	</div>

	<!-- ------------------------------------------------------------- the seal -->
	<!--
		Overlapping the seam between the sheet and the panel, the way a wax seal sits
		half on the ribbon. Centered on the join on desktop; on a phone it tucks into
		the top-right of the sheet.
	-->
	<div
		class="pointer-events-none absolute top-6 right-6 sm:top-1/2 sm:right-52 sm:-translate-y-1/2 sm:translate-x-1/2"
		aria-hidden="true"
	>
		<svg viewBox="0 0 120 120" class="size-24 drop-shadow-lg sm:size-28">
			<defs>
				<linearGradient id="sealFill" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stop-color="oklch(0.5 0.07 268)" />
					<stop offset="1" stop-color="oklch(0.32 0.05 266)" />
				</linearGradient>
				<path id="sealArcTop" d="M 60 60 m -37 0 a 37 37 0 0 1 74 0" fill="none" />
				<path id="sealArcBottom" d="M 60 60 m -34 0 a 34 34 0 0 0 68 0" fill="none" />
			</defs>

			<path d={sealEdge} fill="url(#sealFill)" />
			<circle cx="60" cy="60" r="45" fill="none" stroke="white" stroke-opacity="0.35" />

			<text
				fill="white"
				font-size="8.5"
				font-weight="600"
				letter-spacing="2"
				style="font-family: var(--font-sans)"
			>
				<textPath href="#sealArcTop" startOffset="50%" text-anchor="middle">MUALLIM</textPath>
			</text>
			<text
				fill="white"
				fill-opacity="0.85"
				font-size="7"
				letter-spacing="2.5"
				style="font-family: var(--font-sans)"
			>
				<textPath href="#sealArcBottom" startOffset="50%" text-anchor="middle">CERTIFIED</textPath>
			</text>

			<!-- A mortarboard, drawn in place: a foreignObject'd component does not
			     survive every renderer, and the mark is four lines. -->
			<g stroke="white" stroke-width="2" stroke-linejoin="round" fill="none">
				<polygon points="60,50 76,56 60,62 44,56" fill="white" stroke="none" />
				<path d="M50 59 v6 a10 4 0 0 0 20 0 v-6" />
				<path d="M76 56 v10" />
				<circle cx="76" cy="67" r="1.5" fill="white" stroke="none" />
			</g>
		</svg>
	</div>
</article>
