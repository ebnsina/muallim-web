<script lang="ts">
	import { resolve } from '$app/paths';
	import { Mortarboard01Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import { GROUPS, featuresIn } from '$lib/content/features';
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
		item now goes to the page that describes it.
	*/
	let menuOpen = $state(false);
	let megaOpen = $state(false);
	let activeCat = $state(0);
	// A short close-delay so moving the cursor across the gap into the panel — or
	// between the trigger and the panel — doesn't dismiss the menu mid-flight.
	let megaCloseTimer: ReturnType<typeof setTimeout>;
	const openMega = () => {
		clearTimeout(megaCloseTimer);
		megaOpen = true;
	};
	const scheduleCloseMega = () => {
		clearTimeout(megaCloseTimer);
		megaCloseTimer = setTimeout(() => (megaOpen = false), 140);
	};

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

<header class="site-header">
	<div class="pill">
		<a class="logo" href={resolve('/')}>
			<span class="mark"><Icon icon={Mortarboard01Icon} class="size-5" /></span>
			Muallim
		</a>

		<nav class="links" class:open={menuOpen} aria-label="Main">
			<div class="relative" onmouseenter={openMega} onmouseleave={scheduleCloseMega} role="none">
				<button
					type="button"
					class="mega-trigger"
					aria-haspopup="true"
					aria-expanded={megaOpen}
					onclick={() => (megaOpen = !megaOpen)}
				>
					Products
					<svg
						class="size-3.5 transition-transform duration-200 {megaOpen ? 'rotate-180' : ''}"
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
				{#if megaOpen}
					<div
						role="none"
						onmouseenter={openMega}
						onmouseleave={scheduleCloseMega}
						class="absolute top-[calc(100%+0.5rem)] left-0 z-20 w-[40rem] max-w-[90vw] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 text-left shadow-[0_30px_70px_-30px_rgba(23,23,15,0.45)] before:absolute before:-top-3 before:right-0 before:left-0 before:h-3 before:content-['']"
					>
						<div class="grid grid-cols-[1.15fr_1fr] gap-2">
							<div class="flex flex-col gap-1">
								{#each megaCats as c, i (c.title)}
									<button
										type="button"
										onmouseenter={() => (activeCat = i)}
										onfocus={() => (activeCat = i)}
										class="flex items-start gap-3 rounded-xl p-3 text-left transition {activeCat ===
										i
											? 'bg-[var(--accent-tint)]'
											: 'hover:bg-[var(--surface-2)]'}"
									>
										<span
											class="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-tint)] text-[var(--brand)]"
										>
											<Icon icon={c.icon} class="size-5" />
										</span>
										<span>
											<span class="block text-sm font-bold text-[var(--ink)]">{c.title}</span>
											<span class="mt-0.5 block text-xs text-[var(--muted)]">{c.sub}</span>
										</span>
									</button>
								{/each}
							</div>
							<div class="flex flex-col rounded-xl bg-[var(--surface-2)] p-2">
								{#each megaCats[activeCat].items as item (item.slug)}
									<a
										href={resolve('/(marketing)/features/[slug]', { slug: item.slug })}
										onclick={() => (megaOpen = false)}
										class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--surface)]"
									>
										<Icon icon={item.icon} class="size-4 shrink-0 text-[var(--teal)]" />
										{item.name}
									</a>
								{/each}
								<a
									href={resolve('/(marketing)/features')}
									onclick={() => (megaOpen = false)}
									class="mt-auto rounded-lg border-t border-[var(--line)] px-3 pt-3 pb-1 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--brand)]"
								>
									Look through all of it
								</a>
							</div>
						</div>
					</div>
				{/if}
			</div>
			<div class="relative" onmouseenter={openSol} onmouseleave={scheduleCloseSol} role="none">
				<button
					type="button"
					class="mega-trigger"
					aria-haspopup="true"
					aria-expanded={solOpen}
					onclick={() => (solOpen = !solOpen)}
				>
					Solutions
					<svg
						class="size-3.5 transition-transform duration-200 {solOpen ? 'rotate-180' : ''}"
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
				{#if solOpen}
					<div
						role="none"
						onmouseenter={openSol}
						onmouseleave={scheduleCloseSol}
						class="absolute top-[calc(100%+0.5rem)] left-0 z-20 w-[19rem] max-w-[90vw] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 text-left shadow-[0_30px_70px_-30px_rgba(23,23,15,0.45)] before:absolute before:-top-3 before:right-0 before:left-0 before:h-3 before:content-['']"
					>
						{#each segmentLinks as sg (sg.slug)}
							<a
								href={resolve('/(marketing)/solutions/[slug]', { slug: sg.slug })}
								onclick={() => {
									solOpen = false;
									menuOpen = false;
								}}
								class="block rounded-xl p-3 transition hover:bg-[var(--surface-2)]"
							>
								<span class="block text-sm font-bold text-[var(--ink)]">{sg.name}</span>
								<span class="mt-0.5 block text-xs text-[var(--muted)]">{sg.kicker}</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
			<a href="/#pricing" onclick={() => (menuOpen = false)}>Pricing</a>
			<a href="/#faq" onclick={() => (menuOpen = false)}>FAQ</a>
			<a href="mailto:hello@muallim.app" onclick={() => (menuOpen = false)}>Support</a>
			<a class="links-signin" href={resolve('/login')} onclick={() => (menuOpen = false)}>Sign in</a
			>
		</nav>

		<a class="cta" href={resolve('/register')}>Get started</a>

		<button
			class="burger"
			aria-label="Menu"
			aria-expanded={menuOpen}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span></span>
		</button>
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
