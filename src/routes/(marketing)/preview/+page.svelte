<script lang="ts">
	/**
	 * A live, in-app preview of the fresh marketing direction — light only, on Mona
	 * Sans with Geist Mono for figures (the app's own faces). A refined token set:
	 * an indigo-violet brand (modern, and deliberately not the app's blue), a warm
	 * gold for accents, cool-neutral paper and ink. English content; money is the
	 * taka glyph ৳ with lakh/crore grouping. Run the app and visit /preview.
	 */
	import { Icon } from '$lib/components';
	import {
		ArrowRight01Icon,
		ArrowUpRight01Icon,
		Mortarboard01Icon,
		School01Icon,
		Building01Icon,
		Mosque01Icon,
		UserGroupIcon,
		UserMultipleIcon,
		MagicWand01Icon,
		Message02Icon,
		Wallet01Icon,
		Task01Icon,
		Coins01Icon
	} from '@hugeicons/core-free-icons';

	const taka = (minor: number) =>
		'৳' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(minor / 100);
	const num = (n: number) => new Intl.NumberFormat('en-IN').format(n);

	const solutions = [
		{
			icon: School01Icon,
			name: 'School',
			tone: 'brand',
			line: 'Sections, GPA-5 report cards, transfer certificates, guardian SMS.'
		},
		{
			icon: Building01Icon,
			name: 'College',
			tone: 'teal',
			line: 'Streams, semesters, transcripts, admissions.'
		},
		{
			icon: Mosque01Icon,
			name: 'Madrasa',
			tone: 'violet',
			line: 'Ebtedayee → Kamil, Hifz tracking, Arabic (RTL) curriculum.'
		},
		{
			icon: UserGroupIcon,
			name: 'Coaching',
			tone: 'amber',
			line: 'Batches, model-test leaderboards, pay-per-course.'
		}
	];

	const pillars = [
		{
			icon: MagicWand01Icon,
			name: 'Create',
			tone: 'brand',
			line: 'Courses, 16 quiz types, certificates, AI Studio.'
		},
		{
			icon: Message02Icon,
			name: 'Engage',
			tone: 'rose',
			line: 'Forum, Q&A, reviews, gamification, notifications.'
		},
		{
			icon: Wallet01Icon,
			name: 'Earn',
			tone: 'teal',
			line: 'bKash & SSLCommerz first — 0% platform fee. You are the merchant.'
		},
		{
			icon: Task01Icon,
			name: 'Manage',
			tone: 'amber',
			line: 'Attendance, exams, report cards, timetable, staff.'
		}
	];

	const kpis = [
		{ icon: Coins01Icon, label: 'Fees collected', value: taka(184250000), tone: 'teal' },
		{ icon: Wallet01Icon, label: 'Outstanding', value: taka(31200000), tone: 'amber' },
		{ icon: UserGroupIcon, label: 'Attendance', value: `${num(92)}%`, tone: 'violet' },
		{ icon: UserMultipleIcon, label: 'New admissions', value: `${num(18)}`, tone: 'rose' }
	];

	const gateways = [
		['bKash', 62, '#e2136e'],
		['SSLCommerz', 24, 'var(--brand)'],
		['Cash', 14, 'var(--muted)']
	] as const;
	const payments = [
		['Ayesha Siddiqua', 'bKash', 120000],
		['Ibrahim Khalil', 'SSLCommerz', 240000],
		['Rahim Uddin', 'bKash', 90000]
	] as const;

	const gpa = 4.83;
	const gaugeEnd = (() => {
		const theta = ((180 - (gpa / 5) * 180) * Math.PI) / 180;
		return { x: 60 + 54 * Math.cos(theta), y: 60 - 54 * Math.sin(theta) };
	})();
</script>

<svelte:head><title>Muallim — design preview</title></svelte:head>

<div class="rd">
	<div class="rd-paper">
		<header class="rd-bar">
			<span class="rd-brand"><Icon icon={Mortarboard01Icon} class="size-6" /> Muallim</span>
			<a class="rd-btn rd-btn-solid rd-btn-sm" href="#start">
				Start free <Icon icon={ArrowRight01Icon} class="size-4" />
			</a>
		</header>

		<!-- Hero -->
		<section class="rd-hero">
			<div>
				<span class="rd-tag">New — sell a course from your own bKash or SSLCommerz account</span>
				<h1 class="rd-h1">
					<span class="rd-h1a">Run the whole institution.</span>
					<span class="rd-h1b">Teach the whole world.</span>
				</h1>
				<p class="rd-sub">
					From roll-call to result card, bKash to certificate — one platform for a school, a
					college, a madrasa, or a coaching center.
				</p>
				<div class="rd-cta">
					<a class="rd-btn rd-btn-solid" href="#start">
						Start free <Icon icon={ArrowRight01Icon} class="size-5" />
					</a>
					<a class="rd-btn rd-btn-ghost" href="#demo">
						See a live demo <Icon icon={ArrowUpRight01Icon} class="size-5" />
					</a>
				</div>
			</div>

			<!-- The live institution card: a madrasa principal's month. -->
			<div class="rd-card">
				<div class="rd-card-head">
					<span class="rd-card-name">Baitul Ilm Dakhil Madrasa</span>
					<span class="rd-card-kicker">This month</span>
				</div>

				<div class="rd-stats">
					<div class="rd-stat">
						<span class="rd-stat-label">Fees collected</span>
						<span class="rd-stat-fig rd-brand">{taka(184250000)}</span>
					</div>
					<div class="rd-stat">
						<span class="rd-stat-label">Outstanding dues</span>
						<span class="rd-stat-fig rd-gold">{taka(31200000)}</span>
					</div>
				</div>

				<div class="rd-row">
					<span class="rd-stat-label">Attendance today</span>
					<span class="rd-meter" aria-hidden="true"><span style="width: 92%"></span></span>
					<span class="rd-mono">{num(92)}%</span>
				</div>

				<div class="rd-gpa">
					<span class="rd-stat-label">Dakhil result</span>
					<span class="rd-gpa-fig rd-mono">{num(4.83)}<small>/{num(5)}</small></span>
					<span class="rd-gpa-grade">A+</span>
				</div>

				<div class="rd-ladder">Ebtedayee · Dakhil · Alim · Fazil · Kamil</div>
			</div>
		</section>

		<!-- Four institutions -->
		<section class="rd-section">
			<h2 class="rd-h2">Made for every kind of institution</h2>
			<div class="rd-grid">
				{#each solutions as s (s.name)}
					<article class="rd-tile">
						<span class="rd-ic rd-ic-{s.tone}"><Icon icon={s.icon} class="size-5" /></span>
						<h3 class="rd-tile-title">{s.name}</h3>
						<p class="rd-tile-line">{s.line}</p>
					</article>
				{/each}
			</div>
		</section>

		<!-- Four pillars -->
		<section class="rd-section">
			<h2 class="rd-h2">Everything under one roof</h2>
			<div class="rd-grid">
				{#each pillars as p, i (p.name)}
					<article class="rd-tile">
						<span class="rd-ic rd-ic-{p.tone}"><Icon icon={p.icon} class="size-5" /></span>
						<span class="rd-mono rd-tile-num">0{i + 1}</span>
						<h3 class="rd-tile-title">{p.name}</h3>
						<p class="rd-tile-line">{p.line}</p>
					</article>
				{/each}
			</div>
		</section>

		<!-- The dashboard, as it renders: the "see it manage" moment. -->
		<section class="rd-section">
			<h2 class="rd-h2">See it run a madrasa</h2>
			<p class="rd-lead">A principal's month, at a glance.</p>

			<div class="rd-dash">
				<div class="rd-kpis">
					{#each kpis as k (k.label)}
						<div class="rd-kpi">
							<span class="rd-ic rd-ic-{k.tone}"><Icon icon={k.icon} class="size-5" /></span>
							<span class="rd-stat-label">{k.label}</span>
							<span class="rd-kpi-fig rd-mono rd-{k.tone}">{k.value}</span>
						</div>
					{/each}
				</div>

				<div class="rd-panels">
					<div class="rd-panel">
						<span class="rd-panel-title">How fees came in</span>
						<div class="rd-split" aria-hidden="true">
							{#each gateways as [, pct, color] (color)}
								<span style="width: {pct}%; background: {color}"></span>
							{/each}
						</div>
						<ul class="rd-legend">
							{#each gateways as [name, pct, color] (name)}
								<li>
									<span class="rd-dot" style="background: {color}"></span>
									{name}
									<span class="rd-mono">{num(pct)}%</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="rd-panel rd-panel-gauge">
						<span class="rd-panel-title">Dakhil board result</span>
						<svg viewBox="0 0 120 70" class="rd-gauge" role="img" aria-label="GPA 4.83 of 5">
							<path d="M 6 60 A 54 54 0 0 1 114 60" class="rd-gauge-track" />
							<path
								d="M 6 60 A 54 54 0 0 1 {gaugeEnd.x.toFixed(2)} {gaugeEnd.y.toFixed(2)}"
								class="rd-gauge-fill"
							/>
						</svg>
						<span class="rd-gauge-fig rd-mono">{num(4.83)}<small> / {num(5)}</small></span>
					</div>
				</div>

				<div class="rd-panel">
					<span class="rd-panel-title">Recent payments</span>
					<ul class="rd-payments">
						{#each payments as [who, via, amount] (who)}
							<li>
								<span class="rd-pay-who">{who}</span>
								<span class="rd-pay-via">via {via}</span>
								<span class="rd-mono rd-brand">{taka(amount)}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</section>

		<footer class="rd-foot">
			0% platform fee. The school is the merchant of record — you own your money, your refunds, your
			students.
		</footer>
	</div>
</div>

<style>
	/*
		Design tokens — light only, scoped to .rd. Two brand hues (an indigo-violet and
		a warm gold), cool-neutral paper and ink, and shape/shadow tokens so radii and
		elevation are named once. Nothing here leaks past .rd, and it never themes dark.
	*/
	.rd {
		/* Brand — indigo-violet: modern and premium, and deliberately not the app's blue. */
		--brand: #5b4bc4;
		--brand-strong: #453796;
		--brand-tint: #edebfb;

		/* Gold — a warm second accent; violet and gold is a classic premium pair. */
		--gold: #b7791f;
		--gold-tint: #f7efda;

		/* A small spectrum for icon chips, so a grid of them reads as variety, not a
		   wall of one color. Each is a saturated ink over a pale tint of itself. */
		--teal: #0f766e;
		--teal-tint: #ddf1ee;
		--violet: #7c3aed;
		--violet-tint: #efe8fd;
		--amber: #c2620c;
		--amber-tint: #fbebd9;
		--rose: #be185d;
		--rose-tint: #fbe4ee;

		/* Neutrals — faintly cool, so the grays sit with the brand rather than against it. */
		--ink: #1a1830;
		--muted: #605c74;
		--line: #e7e5f0;
		--bg: #f7f6fb;
		--surface: #ffffff;
		--surface-2: #f0eef8;

		/* Shape & elevation. */
		--r-sm: 10px;
		--r: 16px;
		--r-lg: 22px;
		--pill: 999px;

		--body: 'Mona Sans Variable', ui-sans-serif, system-ui, -apple-system, sans-serif;
		--mono: 'Geist Mono Variable', ui-monospace, 'SF Mono', monospace;

		color: var(--ink);
		font-family: var(--body);
	}

	/* An aurora wash — soft indigo and gold blooms near the top that fade into the
	   plain page below. No repeat, so lower sections sit on clean paper. */
	.rd-paper {
		min-height: 100vh;
		background-color: var(--bg);
		background-image:
			radial-gradient(
				60rem 42rem at 12% -12%,
				color-mix(in oklab, var(--brand) 24%, transparent),
				transparent 60%
			),
			radial-gradient(
				52rem 36rem at 100% -6%,
				color-mix(in oklab, var(--gold) 20%, transparent),
				transparent 55%
			),
			radial-gradient(
				46rem 40rem at 55% 6%,
				color-mix(in oklab, var(--brand) 12%, transparent),
				transparent 62%
			);
		background-repeat: no-repeat;
		padding-bottom: 4rem;
	}

	.rd-bar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1.5rem;
		background: color-mix(in oklab, var(--bg) 84%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--line);
	}
	.rd-brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		font-size: 1.2rem;
		letter-spacing: -0.01em;
		color: var(--brand);
	}

	/* Buttons — large, rounded‑xl, flat. Separation is a border's job, not a shadow's;
	   the only motion is a small lift on hover. */
	.rd-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.95rem 1.9rem;
		border-radius: 0.75rem;
		font-weight: 600;
		font-size: 1.02rem;
		line-height: 1;
		text-decoration: none;
		transition:
			transform 0.12s ease,
			background 0.12s ease,
			border-color 0.12s ease,
			color 0.12s ease;
	}
	.rd-btn-solid {
		background: var(--brand);
		color: #fff;
	}
	.rd-btn-solid:hover {
		background: var(--brand-strong);
		transform: translateY(-1px);
	}
	.rd-btn-ghost {
		background: var(--surface);
		color: var(--ink);
		border: 1px solid var(--line);
	}
	.rd-btn-ghost:hover {
		border-color: var(--brand);
		color: var(--brand);
		transform: translateY(-1px);
	}
	.rd-btn-sm {
		padding: 0.55rem 1.1rem;
		font-size: 0.9rem;
	}

	.rd-hero {
		max-width: 76rem;
		margin: 0 auto;
		padding: 4.5rem 1.5rem 3rem;
		display: grid;
		gap: 3rem;
		align-items: center;
	}
	@media (min-width: 900px) {
		.rd-hero {
			grid-template-columns: 1.1fr 0.9fr;
		}
	}

	.rd-tag {
		display: inline-block;
		font-size: 0.82rem;
		color: var(--gold);
		font-weight: 600;
		border: 1px solid color-mix(in oklab, var(--gold) 35%, var(--line));
		border-radius: var(--pill);
		padding: 0.35rem 0.85rem;
		background: var(--gold-tint);
	}
	.rd-h1 {
		font-weight: 700;
		font-size: clamp(2.5rem, 5.5vw, 4.1rem);
		line-height: 1.03;
		letter-spacing: -0.03em;
		margin: 1.4rem 0 0;
	}
	.rd-h1a {
		display: block;
	}
	.rd-h1b {
		display: block;
		color: var(--brand);
	}
	.rd-sub {
		margin-top: 1.3rem;
		max-width: 34rem;
		font-size: 1.12rem;
		line-height: 1.6;
		color: var(--muted);
	}
	.rd-cta {
		margin-top: 2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
	}

	.rd-card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		padding: 1.5rem;
	}
	.rd-card-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	.rd-card-name {
		font-weight: 700;
		font-size: 1.05rem;
	}
	.rd-card-kicker {
		font-size: 0.78rem;
		color: var(--muted);
	}
	.rd-stats {
		margin-top: 1.2rem;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}
	.rd-stat {
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: var(--r-sm);
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.rd-stat-label {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.rd-stat-fig {
		font-family: var(--mono);
		font-size: 1.15rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.rd-brand {
		color: var(--brand);
	}
	.rd-gold {
		color: var(--gold);
	}
	.rd-ink {
		color: var(--ink);
	}
	.rd-teal {
		color: var(--teal);
	}
	.rd-violet {
		color: var(--violet);
	}
	.rd-amber {
		color: var(--amber);
	}
	.rd-rose {
		color: var(--rose);
	}
	.rd-row {
		margin-top: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.rd-meter {
		flex: 1;
		height: 8px;
		border-radius: var(--pill);
		background: var(--line);
		overflow: hidden;
		display: block;
	}
	.rd-meter span {
		display: block;
		height: 100%;
		background: var(--brand);
	}
	.rd-mono {
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
	}
	.rd-gpa {
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}
	.rd-gpa-fig {
		font-size: 1.4rem;
		font-weight: 700;
		margin-inline-start: auto;
	}
	.rd-gpa-fig small {
		color: var(--muted);
		font-weight: 400;
	}
	.rd-gpa-grade {
		background: var(--brand-tint);
		color: var(--brand);
		font-weight: 700;
		border-radius: 8px;
		padding: 0.2rem 0.5rem;
		font-size: 0.9rem;
	}
	.rd-ladder {
		margin-top: 1rem;
		font-size: 0.78rem;
		color: var(--muted);
	}

	.rd-section {
		max-width: 76rem;
		margin: 3.5rem auto 0;
		padding: 0 1.5rem;
	}
	.rd-h2 {
		font-weight: 700;
		font-size: clamp(1.7rem, 3vw, 2.3rem);
		letter-spacing: -0.02em;
	}
	.rd-lead {
		margin-top: 0.5rem;
		color: var(--muted);
	}
	.rd-grid {
		margin-top: 1.5rem;
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(1, 1fr);
	}
	@media (min-width: 640px) {
		.rd-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 980px) {
		.rd-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	.rd-tile {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r);
		padding: 1.5rem;
		transition:
			transform 0.15s ease,
			border-color 0.15s ease;
	}
	.rd-tile:hover {
		transform: translateY(-3px);
		border-color: color-mix(in oklab, var(--brand) 35%, var(--line));
	}

	/* The icon chip — a rounded tinted square, brand or gold. */
	.rd-ic {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 12px;
	}
	.rd-ic-brand {
		background: var(--brand-tint);
		color: var(--brand);
	}
	.rd-ic-gold {
		background: var(--gold-tint);
		color: var(--gold);
	}
	.rd-ic-ink {
		background: var(--surface-2);
		color: var(--ink);
	}
	.rd-ic-teal {
		background: var(--teal-tint);
		color: var(--teal);
	}
	.rd-ic-violet {
		background: var(--violet-tint);
		color: var(--violet);
	}
	.rd-ic-amber {
		background: var(--amber-tint);
		color: var(--amber);
	}
	.rd-ic-rose {
		background: var(--rose-tint);
		color: var(--rose);
	}
	.rd-tile-num {
		display: block;
		margin-top: 0.9rem;
		color: var(--muted);
		font-weight: 600;
	}
	.rd-tile-title {
		font-weight: 700;
		font-size: 1.2rem;
		margin: 0.5rem 0 0.4rem;
	}
	.rd-tile-line {
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--muted);
		margin: 0;
	}

	/* Dashboard section */
	.rd-dash {
		margin-top: 1.5rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		padding: 1.5rem;
	}
	.rd-kpis {
		display: grid;
		gap: 0.9rem;
		grid-template-columns: repeat(2, 1fr);
	}
	@media (min-width: 720px) {
		.rd-kpis {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	.rd-kpi {
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: var(--r-sm);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.rd-kpi-fig {
		font-size: 1.3rem;
		font-weight: 700;
	}
	.rd-panels {
		margin-top: 0.9rem;
		display: grid;
		gap: 0.9rem;
		grid-template-columns: 1fr;
	}
	@media (min-width: 720px) {
		.rd-panels {
			grid-template-columns: 1.4fr 1fr;
		}
	}
	.rd-panel {
		margin-top: 0.9rem;
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: var(--r-sm);
		padding: 1.1rem;
	}
	.rd-panels .rd-panel {
		margin-top: 0;
	}
	.rd-panel-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--muted);
	}
	.rd-split {
		margin-top: 0.8rem;
		display: flex;
		height: 12px;
		border-radius: var(--pill);
		overflow: hidden;
		gap: 2px;
	}
	.rd-split span {
		display: block;
	}
	.rd-legend {
		margin: 0.9rem 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.82rem;
	}
	.rd-legend li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--muted);
	}
	.rd-dot {
		width: 10px;
		height: 10px;
		border-radius: var(--pill);
		display: inline-block;
	}
	.rd-panel-gauge {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.rd-gauge {
		width: 160px;
		max-width: 100%;
		margin-top: 0.4rem;
	}
	.rd-gauge-track {
		fill: none;
		stroke: var(--line);
		stroke-width: 10;
		stroke-linecap: round;
	}
	.rd-gauge-fill {
		fill: none;
		stroke: var(--brand);
		stroke-width: 10;
		stroke-linecap: round;
	}
	.rd-gauge-fig {
		font-size: 1.3rem;
		font-weight: 700;
		margin-top: -0.4rem;
	}
	.rd-gauge-fig small {
		color: var(--muted);
		font-weight: 400;
	}
	.rd-payments {
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
	}
	.rd-payments li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0;
		border-top: 1px solid var(--line);
	}
	.rd-payments li:first-child {
		border-top: 0;
	}
	.rd-pay-who {
		font-weight: 600;
		font-size: 0.9rem;
	}
	.rd-pay-via {
		font-size: 0.8rem;
		color: var(--muted);
		margin-inline-end: auto;
	}

	.rd-foot {
		max-width: 76rem;
		margin: 3.5rem auto 0;
		padding: 1.75rem 1.5rem 0;
		border-top: 1px solid var(--line);
		font-size: 0.95rem;
		color: var(--muted);
		max-inline-size: 46rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.rd-tile,
		.rd-btn {
			transition: none;
		}
	}
</style>
