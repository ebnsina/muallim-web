<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		AiBrain01Icon,
		Book02Icon,
		ChartLineData01Icon,
		CheckmarkBadge01Icon,
		ClipboardIcon,
		Message02Icon,
		Money04Icon,
		Mortarboard01Icon,
		Quiz01Icon,
		School01Icon,
		Store01Icon,
		UserMultipleIcon
	} from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';

	/*
		The marketing site's header, owned by the (marketing) layout so every page wears
		the same one. One dark pill holding the logo, the links, and the single call to
		action — floating over the light hero gradient every page now opens on.

		It had a `tone` prop for a second, cream variant; there is one backdrop now, and
		a second variant is how the two drifted apart last time.
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

	const megaCats = [
		{
			icon: Book02Icon,
			title: 'Creation',
			sub: 'Build courses visually, faster.',
			items: [
				{ icon: Book02Icon, label: 'Course Builder' },
				{ icon: ClipboardIcon, label: 'Content Bank' },
				{ icon: AiBrain01Icon, label: 'AI Studio' },
				{ icon: CheckmarkBadge01Icon, label: 'Certificate Builder' }
			]
		},
		{
			icon: Message02Icon,
			title: 'Engagement',
			sub: 'Keep learners hooked.',
			items: [
				{ icon: Quiz01Icon, label: 'Quizzes & assignments' },
				{ icon: Message02Icon, label: 'Forum & Q&A' },
				{ icon: ChartLineData01Icon, label: 'Points & badges' },
				{ icon: School01Icon, label: 'Notifications' }
			]
		},
		{
			icon: Money04Icon,
			title: 'Monetization',
			sub: 'Sell courses your way.',
			items: [
				{ icon: Money04Icon, label: 'Pricing & checkout' },
				{ icon: Store01Icon, label: 'bKash & SSLCommerz' },
				{ icon: ChartLineData01Icon, label: 'Stripe · international' },
				{ icon: CheckmarkBadge01Icon, label: '0% platform fee' }
			]
		},
		{
			icon: ClipboardIcon,
			title: 'Management',
			sub: 'Run everything in one place.',
			items: [
				{ icon: UserMultipleIcon, label: 'Students & guardians' },
				{ icon: ClipboardIcon, label: 'Attendance' },
				{ icon: CheckmarkBadge01Icon, label: 'Exams & report cards' },
				{ icon: Money04Icon, label: 'Fees & timetable' }
			]
		}
	];
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
					Product
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
								{#each megaCats[activeCat].items as item (item.label)}
									<a
										href={resolve('/register')}
										class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--surface)]"
									>
										<Icon icon={item.icon} class="size-4 text-[var(--teal)]" />
										{item.label}
									</a>
								{/each}
								<!-- The one call to action is "Get started", so signing in lives here. -->
								<a
									href={resolve('/login')}
									class="mt-auto rounded-lg border-t border-[var(--line)] px-3 pt-3 pb-1 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--brand)]"
								>
									Already have an account? Sign in
								</a>
							</div>
						</div>
					</div>
				{/if}
			</div>
			<a href={resolve('/(marketing)/features')} onclick={() => (menuOpen = false)}>Features</a>
			<a href="#faq" onclick={() => (menuOpen = false)}>FAQ</a>
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
	*/
	.site-header {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		z-index: 30;
		display: flex;
		justify-content: center;
		padding: 1.1rem 1rem 0;
	}
	.pill {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		max-width: 100%;
		background: var(--brand);
		border-radius: 999px;
		padding: 0.4rem 0.4rem 0.4rem 1.1rem;
		box-shadow: 0 18px 40px -24px rgba(23, 23, 15, 0.6);
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
		color: color-mix(in srgb, var(--on-brand) 78%, transparent);
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
