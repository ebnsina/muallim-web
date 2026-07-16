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
		the same one. It used to live inside the landing, which is why every other page
		grew its own and none of them agreed.

		Two backdrops, one component: on the landing it floats over a dark hero
		photograph, everywhere else it sits on cream. `tone` is the only difference —
		a second header would drift from this one within a week.
	*/
	type Props = { tone?: 'photo' | 'cream' };
	let { tone = 'cream' }: Props = $props();

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

<div class="site-header" class:on-cream={tone === 'cream'}>
	<header class="nav">
		<nav class="nav-pill nav-links" class:open={menuOpen}>
			<div class="relative" onmouseenter={openMega} onmouseleave={scheduleCloseMega} role="none">
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-white/80 hover:text-white"
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
						class="absolute top-[calc(100%+0.25rem)] left-0 z-20 w-[40rem] max-w-[90vw] rounded-2xl border border-[#e7e4d8] bg-white p-2 text-left shadow-[0_30px_70px_-30px_rgba(23,23,15,0.45)] before:absolute before:-top-3 before:right-0 before:left-0 before:h-3 before:content-['']"
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
											? 'bg-[#f1efe7]'
											: 'hover:bg-[#f7f5ef]'}"
									>
										<span
											class="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eaf5cf] text-[#2e3320]"
										>
											<Icon icon={c.icon} class="size-5" />
										</span>
										<span>
											<span class="block text-sm font-bold text-[#17170f]">{c.title}</span>
											<span class="mt-0.5 block text-xs text-[#6b6a5e]">{c.sub}</span>
										</span>
									</button>
								{/each}
							</div>
							<div class="rounded-xl bg-[#f7f5ef] p-2">
								{#each megaCats[activeCat].items as item (item.label)}
									<a
										href={resolve('/register')}
										class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#2e3320] transition hover:bg-white"
									>
										<Icon icon={item.icon} class="size-4 text-[#2e5148]" />
										{item.label}
									</a>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
			<a href={resolve('/(marketing)/features')} onclick={() => (menuOpen = false)}>Features</a>
			<a href="#faq" onclick={() => (menuOpen = false)}>FAQ</a>
			<a class="nav-links-signin" href={resolve('/login')}>Sign in</a>
		</nav>
		<a class="nav-logo" href={resolve('/')}>
			<span class="nav-mark"><Icon icon={Mortarboard01Icon} class="size-5" /></span>
			Muallim
		</a>
		<div class="nav-right">
			<div class="nav-pill nav-auth">
				<a class="nav-login" href={resolve('/login')}>Sign in</a>
				<a class="nav-signup" href={resolve('/register')}>Start free</a>
			</div>
			<button
				class="nav-burger"
				aria-label="Menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span></span>
			</button>
		</div>
	</header>
</div>

<style>
	.nav {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		max-width: 82rem;
		margin: 0 auto;
		padding: 1.1rem 1.4rem 0;
	}
	.nav-pill {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(32, 27, 22, 0.42);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 999px;
		padding: 0.4rem 0.5rem;
	}
	.nav-links {
		display: none;
		padding: 0.5rem 0.8rem;
	}
	.nav-links > a {
		color: rgba(255, 255, 255, 0.82);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
	}
	.nav-links > a:hover {
		color: #fff;
	}
	.nav-links-signin {
		display: none;
	}
	.nav-logo {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #fff;
		font-weight: 700;
		font-size: 1.2rem;
		letter-spacing: -0.02em;
		text-decoration: none;
	}
	.nav-mark {
		display: grid;
		place-items: center;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 0.6rem;
		background: var(--accent);
		color: var(--brand);
	}
	.nav-right {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.nav-auth {
		display: none;
	}
	.nav-login {
		color: rgba(255, 255, 255, 0.85);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		padding: 0.35rem 0.85rem;
	}
	.nav-login:hover {
		color: #fff;
	}
	.nav-signup {
		background: #fff;
		color: var(--ink);
		border-radius: 999px;
		padding: 0.5rem 1.1rem;
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
	}
	.nav-burger {
		display: grid;
		place-items: center;
		width: 2.7rem;
		height: 2.7rem;
		border-radius: 0.9rem;
		background: rgba(32, 27, 22, 0.42);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.14);
		cursor: pointer;
	}
	.nav-burger span {
		position: relative;
		display: block;
		width: 1.05rem;
		height: 2px;
		border-radius: 2px;
		background: #fff;
	}
	.nav-burger span::before,
	.nav-burger span::after {
		content: '';
		position: absolute;
		left: 0;
		width: 1.05rem;
		height: 2px;
		border-radius: 2px;
		background: #fff;
	}
	.nav-burger span::before {
		top: -0.34rem;
	}
	.nav-burger span::after {
		top: 0.34rem;
	}
	.nav-links.open {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		position: absolute;
		top: 4.2rem;
		left: 1.4rem;
		padding: 0.7rem;
		z-index: 3;
	}
	.nav-links.open .nav-links-signin {
		display: block;
		color: #fff;
		font-weight: 700;
	}
	@media (min-width: 860px) {
		.nav-links {
			display: flex;
		}
		.nav-auth {
			display: flex;
		}
		.nav-burger {
			display: none;
		}
	}

	/* Pills (shared with the closing CTA below). */

	/*
		On cream there is no photograph to read against, so the pill that was glass over
		a picture becomes paper on paper: a white pill with ink on it, and a border to
		separate the two. Same header, same geometry — only what is behind it changed.
	*/
	/*
		Over a photograph the header floats: it is lifted out of the flow so the picture
		runs to the top of the window behind it. In the flow it would push the hero
		down and leave a band of paper above the image.
	*/
	.site-header:not(.on-cream) {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		z-index: 30;
	}

	/*
		On the landing the photograph is the header's background. On cream there is no
		photograph, so without this the page's own backdrop shows through as a band.
	*/
	.on-cream {
		background: var(--cream);
	}
	.on-cream :global(.nav-pill) {
		background: var(--surface);
		border-color: var(--line);
	}
	/* The mega-menu trigger is white-on-photo in the markup; on paper it is ink. */
	.on-cream :global(.nav-links button) {
		color: var(--ink);
	}
	.on-cream :global(.nav-links button:hover) {
		color: var(--brand);
	}
	.on-cream :global(.nav-links > a),
	.on-cream :global(.nav-logo),
	.on-cream :global(.nav-login) {
		color: var(--ink);
	}
	.on-cream :global(.nav-links > a:hover),
	.on-cream :global(.nav-login:hover) {
		color: var(--brand);
	}
	.on-cream :global(.nav-burger span),
	.on-cream :global(.nav-burger span::before),
	.on-cream :global(.nav-burger span::after) {
		background: var(--ink);
	}
</style>
