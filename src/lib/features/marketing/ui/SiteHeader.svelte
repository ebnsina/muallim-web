<script lang="ts">
	import { resolve } from '$app/paths';
	import { Mortarboard01Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import { fade, fly } from 'svelte/transition';
	import { FEATURES, GROUPS, featuresIn } from '$lib/content/features';
	import { SEGMENTS } from '$lib/content/segments';

	/*
		The marketing site's header, owned by the (marketing) layout so every page wears
		the same one. One dark pill holding the logo, the links, and the single call to
		action — floating over the light hero gradient every page now opens on.

		It had a `tone` prop for a second, cream variant; there is one backdrop now, and
		a second variant is how the two drifted apart last time.

		The Product menu is built from `content/features.ts`, the same file the landing
		and every feature page read. It used to be sixteen labels typed in here under
		four headings — Creation, Engagement, Monetization, Management — that named
		nothing else on the site, drifted from the real seven groups nobody was
		comparing them against, and still advertised "0% platform fee" long after the
		page learnt to say which gateway that is true of. A taxonomy written twice is a
		taxonomy that disagrees with itself.

		And every one of those sixteen linked to /register. A menu whose every door is
		the signup form is not navigation, it is a wall with labels painted on it. Each
		item now goes to the page that describes it, and every link in this header
		resolves to something that exists — that is the whole rule.
	*/
	let menuOpen = $state(false);
	let activeCat = $state(0);

	/*
		One open menu, not one flag each, and one card they share.

		Each panel used to live inside its own trigger and bridge the gap up to it with
		a pseudo-element. Moving the pointer diagonally — which is how a pointer moves —
		left that strip and the menu shut in your face. The fix is structural: the
		region that listens for the pointer now wraps the pill *and* the card, so going
		from one to the other never leaves it and there is no gap to bridge.
	*/
	type Menu = 'products' | 'solutions';
	let open = $state<Menu | null>(null);
	let closeTimer: ReturnType<typeof setTimeout>;

	// Which way the card should slide when moving between menus, by the order they
	// sit in the pill.
	const ORDER: Menu[] = ['products', 'solutions'];
	let direction = $state(1);

	function show(menu: Menu) {
		clearTimeout(closeTimer);
		if (open && open !== menu) direction = ORDER.indexOf(menu) > ORDER.indexOf(open) ? 1 : -1;
		open = menu;
	}
	const hold = () => clearTimeout(closeTimer);
	function scheduleClose() {
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => (open = null), 140);
	}
	/*
		Hovering anything that is not a menu closes the open one, at once.

		The shell listens for the pointer leaving, which is what stopped the card
		vanishing on the way to it — but Pricing, FAQ, Support and the rest live inside
		that same shell, so reaching them never leaves it and nothing said to close.
		Standing on Support with the Solutions menu hanging open underneath is the
		shape of that hole. Every sibling closes it explicitly; there is no delay here,
		because arriving at another item is a decision, not a slip.
	*/
	function dismiss() {
		clearTimeout(closeTimer);
		open = null;
	}

	// The card takes the size of whatever panel is in it, and animates between the
	// two — measured rather than declared, so the card cannot disagree with its own
	// contents when one of them grows a feature.
	let panelW = $state(0);
	let panelH = $state(0);

	const megaCats = GROUPS.map((g) => ({
		key: g.key,
		icon: g.icon,
		title: g.name,
		sub: g.blurb,
		items: featuresIn(g.key)
	}));

	// Solutions has five real pages and no index, so the nav opens them itself rather
	// than pointing at a /solutions that would 404. `nav` and `tagline` are the
	// Segment's own fields — their doc comments say "for the nav and dropdown", which
	// has been waiting on a dropdown to exist.
	const segmentLinks = SEGMENTS.map((sg) => ({ slug: sg.slug, name: sg.nav, kicker: sg.tagline }));

	let solOpen = $state(false);
	let solCloseTimer: ReturnType<typeof setTimeout>;
	const openSol = () => {
		clearTimeout(solCloseTimer);
		solOpen = true;
	};
	const scheduleCloseSol = () => {
		clearTimeout(solCloseTimer);
		solCloseTimer = setTimeout(() => (solOpen = false), 140);
	};
</script>

<!--
	The hover region is the shell, not the trigger: it holds the pill and the card,
	so moving between them never leaves it.
-->
<header class="site-header">
	<div class="shell" onmouseleave={scheduleClose} onmouseenter={hold} role="none">
		<div class="pill">
			<a class="logo" href={resolve('/')} onmouseenter={dismiss}>
				<span class="mark"><Icon icon={Mortarboard01Icon} class="size-5" /></span>
				Muallim
			</a>

			<nav class="links" class:open={menuOpen} aria-label="Main">
				{#each ORDER as menu (menu)}
					<button
						type="button"
						class="mega-trigger"
						aria-haspopup="true"
						aria-expanded={open === menu}
						onmouseenter={() => show(menu)}
						onfocus={() => show(menu)}
						onclick={() => (open = open === menu ? null : menu)}
					>
						{menu === 'products' ? 'Products' : 'Solutions'}
						<svg
							class="size-3.5 transition-transform duration-200 {open === menu ? 'rotate-180' : ''}"
							viewBox="0 0 12 12"
							fill="none"
						>
							<path
								d="M2.5 4.5 6 8l3.5-3.5"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				{/each}
				<a
					href={resolve('/(marketing)/pricing')}
					onmouseenter={dismiss}
					onfocus={dismiss}
					onclick={() => (menuOpen = false)}>Pricing</a
				>
				<a href="/#faq" onmouseenter={dismiss} onfocus={dismiss} onclick={() => (menuOpen = false)}
					>FAQ</a
				>
				<a
					href="mailto:hello@muallim.app"
					onmouseenter={dismiss}
					onfocus={dismiss}
					onclick={() => (menuOpen = false)}>Support</a
				>
				<a
					href={resolve('/(marketing)/demo')}
					onmouseenter={dismiss}
					onfocus={dismiss}
					onclick={() => (menuOpen = false)}>Try demo</a
				>
				<a
					class="links-signin"
					href={resolve('/login')}
					onmouseenter={dismiss}
					onfocus={dismiss}
					onclick={() => (menuOpen = false)}>Sign in</a
				>
			</nav>

			<a class="cta" href={resolve('/register')} onmouseenter={dismiss} onfocus={dismiss}
				>Get started</a
			>

			<button
				class="burger"
				aria-label="Menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span></span>
			</button>
		</div>

		{#if open}
			<!-- The gap between pill and card is this element's padding, so it is inside
			     the hover region: there is nothing to fall through. -->
			<div class="mega" transition:fade={{ duration: 120 }}>
				<div class="mega-card" style="--w:{panelW}px; --h:{panelH}px">
					{#key open}
						<div
							class="mega-body"
							bind:clientWidth={panelW}
							bind:clientHeight={panelH}
							in:fly={{ x: direction * 24, duration: 220, opacity: 0 }}
							out:fly={{ x: direction * -24, duration: 160, opacity: 0 }}
						>
							{#if open === 'products'}
								<div class="grid w-[46rem] max-w-[92vw] grid-cols-[1.05fr_1fr] gap-3 p-3">
									<div class="flex flex-col gap-0.5">
										{#each megaCats as c, i (c.key)}
											<button
												type="button"
												onmouseenter={() => (activeCat = i)}
												onfocus={() => (activeCat = i)}
												class="flex items-start gap-3 rounded-xl p-3 text-left transition {activeCat ===
												i
													? 'bg-[var(--brand-tint)]'
													: 'hover:bg-[var(--surface-2)]'}"
											>
												<span
													class="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-tint)] text-[var(--brand)]"
												>
													<Icon icon={c.icon} class="size-5" />
												</span>
												<span>
													<span class="block text-sm font-bold text-[var(--ink)]">{c.title}</span>
													<span class="mt-0.5 block text-xs leading-snug text-[var(--muted)]"
														>{c.sub}</span
													>
												</span>
											</button>
										{/each}
									</div>
									<!-- The features, and below them a demo card that fills the space a short
									     group used to leave empty. The panel's own surface sets it apart
									     from the categories beside it. -->
									<div class="flex flex-col rounded-2xl bg-[var(--surface-2)] p-3">
										<p
											class="px-3 pt-1 pb-2 text-xs font-bold tracking-[0.1em] text-[var(--ink-soft)] uppercase"
										>
											{megaCats[activeCat].title}
										</p>
										{#each megaCats[activeCat].items as item (item.slug)}
											<a
												href={resolve('/(marketing)/products/[group]', {
													group: megaCats[activeCat].key
												}) +
													'#' +
													item.slug}
												onclick={() => (open = null)}
												class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--surface)]"
											>
												<Icon icon={item.icon} class="size-4 shrink-0 text-[var(--teal)]" />
												{item.name}
											</a>
										{/each}
										<div
											class="mt-auto flex items-center gap-3 rounded-xl bg-[var(--brand)] p-3.5 text-[var(--on-brand)]"
										>
											<div class="min-w-0 flex-1">
												<p class="text-sm font-bold text-[var(--accent)]">
													See it on your institution
												</p>
												<p
													class="mt-0.5 text-xs leading-snug text-[color-mix(in_oklab,var(--on-brand)_66%,var(--brand))]"
												>
													A person walks you through it — no bots.
												</p>
											</div>
											<a
												href={resolve('/(marketing)/demo')}
												onclick={() => (open = null)}
												class="shrink-0 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--brand)] transition hover:bg-[color-mix(in_oklab,var(--accent)_88%,var(--brand))]"
											>
												Book a demo
											</a>
										</div>
										<a
											href={resolve('/(marketing)/products')}
											onclick={() => (open = null)}
											class="mt-1 px-3 py-1.5 text-center text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--brand)]"
										>
											Look through all {FEATURES.length} features →
										</a>
									</div>
								</div>
							{:else}
								<div class="w-[22rem] max-w-[90vw] p-3">
									{#each segmentLinks as sg (sg.slug)}
										<a
											href={resolve('/(marketing)/solutions/[slug]', { slug: sg.slug })}
											onclick={() => {
												open = null;
												menuOpen = false;
											}}
											class="block rounded-xl px-3 py-2.5 transition hover:bg-[var(--surface-2)]"
										>
											<span class="block text-sm font-bold text-[var(--ink)]">{sg.name}</span>
											<span class="mt-0.5 block text-xs text-[var(--muted)]">{sg.kicker}</span>
										</a>
									{/each}
								</div>
							{/if}
						</div>
					{/key}
				</div>
			</div>
		{/if}
	</div>
</header>

<style>
	/*
		The pill floats out of the flow so the hero's gradient runs to the top of the
		window behind it; in the flow it would push the hero down and leave a band.

		Fixed, not absolute: it used to scroll away with the hero, which left a very
		long page with no way back to the nav without a trip to the top. Out of flow
		either way, so `.topwrap`'s reserved band still holds.
	*/
	.site-header {
		position: fixed;
		top: 0;
		right: 0;
		left: 0;
		z-index: 30;
		display: flex;
		justify-content: center;
		padding: 1.1rem 1rem 0;
	}
	/*
		The one piece of glass on the site, and the only one with a job: the pill now
		stays while cards, screenshots and olive bands pass under it, so it has to read
		against all of them without going opaque and blunt. This is not the old frosted
		look coming back — that was every panel translucent over an aurora, so nothing
		had an edge and the palette had nowhere to sit. A card is still paper.

		How transparent it can go is set by the worst thing that passes under it — a
		white screenshot — not by how it looks over the hero. Olive at 74% measures
		about 5:1 against the nav's words there, which is the room the links bought by
		dropping their 78% dim: two transparencies stacked took the same links to 4:1,
		under AA, and the pill could not go past 82% while they did. Full-strength links
		on a glassier pill is both the more see-through option and the more legible one;
		the hierarchy comes from weight instead. Re-measure before opening it further.
		The blur is what stops a screenshot's text ghosting through the words on top.
	*/
	/*
		The shell is the hover region: pill, gap and card in one box, so the pointer
		can move between them without ever leaving it. The old panels hung inside
		their triggers and bridged the gap with a pseudo-element, which a diagonal
		pointer missed.
	*/
	.shell {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 100%;
	}
	/* The gap is padding, not margin: padding is inside the element, so it is inside
	   the hover region. Margin would be the hole all over again. */
	.mega {
		position: absolute;
		top: 100%;
		padding-top: 0.55rem;
		z-index: 20;
	}
	/*
		One card for both menus, sized to whatever is in it and animated between the
		two — the panels are different shapes, and a card that jumped from one to the
		other would read as two cards rather than one menu moving.
	*/
	.mega-card {
		position: relative;
		width: var(--w);
		height: var(--h);
		overflow: hidden;
		border-radius: 16px;
		border: 1px solid var(--line);
		background: var(--surface);
		box-shadow: 0 30px 70px -30px rgba(23, 23, 15, 0.45);
		transition:
			width 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
			height 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	/* Absolute so the outgoing panel and the incoming one overlap while they cross,
	   instead of stacking and shoving the card open. */
	.mega-body {
		position: absolute;
		top: 0;
		left: 0;
		text-align: left;
	}
	@media (prefers-reduced-motion: reduce) {
		.mega-card {
			transition: none;
		}
	}

	.pill {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		max-width: 100%;
		background: color-mix(in oklab, var(--brand) 74%, transparent);
		-webkit-backdrop-filter: blur(18px) saturate(1.5);
		backdrop-filter: blur(18px) saturate(1.5);
		border-radius: 999px;
		padding: 0.4rem 0.4rem 0.4rem 1.1rem;
		/*
			A light hairline plus a soft dark shadow: the pill floats over both the light
			hero and the dark olive bands (pricing, FAQ, footer). The shadow reads on
			light, the border reads on dark — over a same-olive band the pill was losing
			its edge and vanishing into the section behind it.
		*/
		border: 1px solid color-mix(in oklab, var(--on-brand) 20%, transparent);
		box-shadow: 0 18px 40px -24px rgba(23, 23, 15, 0.6);
	}
	/* No blur, no translucency — a see-through pill over a screenshot is unreadable. */
	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		.pill {
			background: var(--brand);
		}
	}
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--on-brand);
		font-weight: 700;
		font-size: 1.05rem;
		letter-spacing: -0.02em;
		text-decoration: none;
		white-space: nowrap;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 0.55rem;
		background: var(--accent);
		color: var(--brand);
	}
	.links {
		display: none;
		align-items: center;
		gap: 0.15rem;
		margin: 0 0.35rem;
	}
	.links > a,
	.mega-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--on-brand);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 0.35rem 0.7rem;
		border-radius: 999px;
		cursor: pointer;
	}
	.links > a:hover,
	.mega-trigger:hover {
		color: var(--on-brand);
	}
	/* Sign-in also rides the mobile menu — the mega panel that carries it is hover-only. */
	.links > a.links-signin {
		display: none;
	}
	.cta {
		background: var(--accent);
		color: var(--brand);
		border-radius: 999px;
		padding: 0.55rem 1.1rem;
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
		transition: transform 0.14s ease;
	}
	.cta:hover {
		transform: translateY(-1px);
	}
	.burger {
		display: grid;
		place-items: center;
		width: 2.3rem;
		height: 2.3rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--on-brand) 12%, transparent);
		cursor: pointer;
	}
	.burger span {
		position: relative;
		display: block;
		width: 1rem;
		height: 2px;
		border-radius: 2px;
		background: var(--on-brand);
	}
	.burger span::before,
	.burger span::after {
		content: '';
		position: absolute;
		left: 0;
		width: 1rem;
		height: 2px;
		border-radius: 2px;
		background: var(--on-brand);
	}
	.burger span::before {
		top: -0.34rem;
	}
	.burger span::after {
		top: 0.34rem;
	}
	.links.open {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		position: absolute;
		top: 4rem;
		left: 1rem;
		right: 1rem;
		padding: 0.7rem;
		background: var(--brand);
		border-radius: var(--r);
		z-index: 3;
	}
	.links.open .links-signin {
		display: block;
		color: var(--on-brand);
		font-weight: 700;
	}
	@media (min-width: 900px) {
		.links {
			display: flex;
		}
		.burger {
			display: none;
		}
	}
</style>
