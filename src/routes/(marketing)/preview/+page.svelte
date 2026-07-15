<script lang="ts">
	/**
	 * The marketing preview, composed from the UI kit — frosted Card, Button, IconChip,
	 * Tag — over a fixed aurora. Tokens come from the (marketing) layout; the only CSS
	 * here is the page's own layout and the bespoke dashboard viz (meter, gauge, split).
	 * Light only. English content, ৳ pricing. Live at /preview.
	 */
	import { Icon } from '$lib/components';
	import { Card, Button, IconChip, Tag } from '$lib/features/marketing/ui';
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
			tone: 'indigo',
			name: 'School',
			line: 'Sections, GPA-5 report cards, transfer certificates, guardian SMS.'
		},
		{
			icon: Building01Icon,
			tone: 'teal',
			name: 'College',
			line: 'Streams, semesters, transcripts, admissions.'
		},
		{
			icon: Mosque01Icon,
			tone: 'violet',
			name: 'Madrasa',
			line: 'Ebtedayee to Kamil, Hifz tracking, Arabic (RTL) curriculum.'
		},
		{
			icon: UserGroupIcon,
			tone: 'amber',
			name: 'Coaching',
			line: 'Batches, model-test leaderboards, pay-per-course.'
		}
	] as const;

	const pillars = [
		{
			icon: MagicWand01Icon,
			tone: 'indigo',
			name: 'Create',
			line: 'Courses, 16 quiz types, certificates, AI Studio.'
		},
		{
			icon: Message02Icon,
			tone: 'rose',
			name: 'Engage',
			line: 'Forum, Q&A, reviews, gamification, notifications.'
		},
		{
			icon: Wallet01Icon,
			tone: 'teal',
			name: 'Earn',
			line: 'bKash & SSLCommerz first — 0% platform fee. You are the merchant.'
		},
		{
			icon: Task01Icon,
			tone: 'amber',
			name: 'Manage',
			line: 'Attendance, exams, report cards, timetable, staff.'
		}
	] as const;

	const kpis = [
		{ icon: Coins01Icon, tone: 'teal', label: 'Fees collected', value: taka(184250000) },
		{ icon: Wallet01Icon, tone: 'amber', label: 'Outstanding', value: taka(31200000) },
		{ icon: UserGroupIcon, tone: 'violet', label: 'Attendance', value: `${num(92)}%` },
		{ icon: UserMultipleIcon, tone: 'rose', label: 'New admissions', value: `${num(18)}` }
	] as const;

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

<div class="page">
	<header class="menu">
		<span class="brand"><Icon icon={Mortarboard01Icon} class="size-6" /> Muallim</span>
		<Button href="#start" size="sm"
			>Start free <Icon icon={ArrowRight01Icon} class="size-4" /></Button
		>
	</header>

	<section class="hero">
		<div>
			<Tag>New — sell a course from your own bKash or SSLCommerz account</Tag>
			<h1 class="h1">
				<span>Run the whole institution.</span>
				<span class="accent">Teach the whole world.</span>
			</h1>
			<p class="sub">
				From roll-call to result card, bKash to certificate — one platform for a school, a college,
				a madrasa, or a coaching center.
			</p>
			<div class="cta">
				<Button href="#start">Start free <Icon icon={ArrowRight01Icon} class="size-5" /></Button>
				<Button href="#demo" variant="ghost">
					See a live demo <Icon icon={ArrowUpRight01Icon} class="size-5" />
				</Button>
			</div>
		</div>

		<Card>
			<div class="cardhead">
				<span class="cardname">Baitul Ilm Dakhil Madrasa</span>
				<span class="muted-xs">This month</span>
			</div>

			<div class="stats">
				<Card subtle class="flex flex-col gap-1.5">
					<span class="label">Fees collected</span>
					<span class="fig c-brand">{taka(184250000)}</span>
				</Card>
				<Card subtle class="flex flex-col gap-1.5">
					<span class="label">Outstanding dues</span>
					<span class="fig c-amber">{taka(31200000)}</span>
				</Card>
			</div>

			<div class="row">
				<span class="label">Attendance today</span>
				<span class="meter" aria-hidden="true"><span style="width: 92%"></span></span>
				<span class="mono">{num(92)}%</span>
			</div>

			<div class="gpa">
				<span class="label">Dakhil result</span>
				<span class="gpa-fig mono">{num(4.83)}<small>/{num(5)}</small></span>
				<span class="grade">A+</span>
			</div>

			<div class="ladder">Ebtedayee · Dakhil · Alim · Fazil · Kamil</div>
		</Card>
	</section>

	<section class="section">
		<h2 class="h2">Made for every kind of institution</h2>
		<div class="grid">
			{#each solutions as s (s.name)}
				<Card class="tile">
					<IconChip icon={s.icon} tone={s.tone} />
					<h3 class="tile-title">{s.name}</h3>
					<p class="tile-line">{s.line}</p>
				</Card>
			{/each}
		</div>
	</section>

	<section class="section">
		<h2 class="h2">Everything under one roof</h2>
		<div class="grid">
			{#each pillars as p, i (p.name)}
				<Card class="tile">
					<IconChip icon={p.icon} tone={p.tone} />
					<span class="mono tile-num">0{i + 1}</span>
					<h3 class="tile-title">{p.name}</h3>
					<p class="tile-line">{p.line}</p>
				</Card>
			{/each}
		</div>
	</section>

	<section class="section">
		<h2 class="h2">See it run a madrasa</h2>
		<p class="lead">A principal's month, at a glance.</p>

		<Card class="mt-6">
			<div class="kpis">
				{#each kpis as k (k.label)}
					<Card subtle class="flex flex-col gap-2">
						<IconChip icon={k.icon} tone={k.tone} />
						<span class="label">{k.label}</span>
						<span class="kpi-fig mono c-{k.tone}">{k.value}</span>
					</Card>
				{/each}
			</div>

			<div class="panels">
				<Card subtle class="!p-[1.1rem]">
					<span class="panel-title">How fees came in</span>
					<div class="split" aria-hidden="true">
						{#each gateways as [, pct, color] (color)}
							<span style="width: {pct}%; background: {color}"></span>
						{/each}
					</div>
					<ul class="legend">
						{#each gateways as [name, pct, color] (name)}
							<li>
								<span class="dot" style="background: {color}"></span>{name}
								<span class="mono">{num(pct)}%</span>
							</li>
						{/each}
					</ul>
				</Card>

				<Card subtle class="!p-[1.1rem] flex flex-col items-center justify-center">
					<span class="panel-title">Dakhil board result</span>
					<svg viewBox="0 0 120 70" class="gauge" role="img" aria-label="GPA 4.83 of 5">
						<path d="M 6 60 A 54 54 0 0 1 114 60" class="gauge-track" />
						<path
							d="M 6 60 A 54 54 0 0 1 {gaugeEnd.x.toFixed(2)} {gaugeEnd.y.toFixed(2)}"
							class="gauge-fill"
						/>
					</svg>
					<span class="gauge-fig mono">{num(4.83)}<small> / {num(5)}</small></span>
				</Card>
			</div>

			<Card subtle class="mt-[0.9rem] !p-[1.1rem]">
				<span class="panel-title">Recent payments</span>
				<ul class="payments">
					{#each payments as [who, via, amount] (who)}
						<li>
							<span class="pay-who">{who}</span>
							<span class="pay-via">via {via}</span>
							<span class="mono c-brand">{taka(amount)}</span>
						</li>
					{/each}
				</ul>
			</Card>
		</Card>
	</section>

	<footer class="foot">
		0% platform fee. The school is the merchant of record — you own your money, your refunds, your
		students.
	</footer>
</div>

<style>
	/* A full-viewport aurora, held fixed so every frosted card scrolls over the same
	   wash of color, top to bottom. */
	.page {
		min-height: 100vh;
		background-color: var(--bg);
		background-image:
			radial-gradient(
				50rem 40rem at 8% 6%,
				color-mix(in oklab, var(--brand) 24%, transparent),
				transparent 60%
			),
			radial-gradient(
				46rem 38rem at 94% 10%,
				color-mix(in oklab, var(--gold) 20%, transparent),
				transparent 58%
			),
			radial-gradient(
				46rem 40rem at 88% 88%,
				color-mix(in oklab, var(--indigo) 18%, transparent),
				transparent 60%
			),
			radial-gradient(
				42rem 38rem at 10% 90%,
				color-mix(in oklab, var(--teal) 15%, transparent),
				transparent 60%
			);
		background-repeat: no-repeat;
		background-attachment: fixed;
		padding-bottom: 4rem;
	}

	.menu {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 76rem;
		margin: 0 auto;
		padding: 1.4rem 1.5rem 0;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		font-size: 1.2rem;
		letter-spacing: -0.01em;
		color: var(--brand);
	}

	.hero {
		max-width: 76rem;
		margin: 0 auto;
		padding: 3rem 1.5rem 3rem;
		display: grid;
		gap: 3rem;
		align-items: center;
	}
	@media (min-width: 900px) {
		.hero {
			grid-template-columns: 1.1fr 0.9fr;
		}
	}
	.h1 {
		font-weight: 700;
		font-size: clamp(2.5rem, 5.5vw, 4.1rem);
		line-height: 1.03;
		letter-spacing: -0.03em;
		margin: 1.4rem 0 0;
	}
	.h1 span {
		display: block;
	}
	.h1 .accent {
		color: var(--brand);
	}
	.sub {
		margin-top: 1.3rem;
		max-width: 34rem;
		font-size: 1.12rem;
		line-height: 1.6;
		color: var(--muted);
	}
	.cta {
		margin-top: 2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
	}

	/* Shared typography helpers. */
	.label {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.muted-xs {
		font-size: 0.78rem;
		color: var(--muted);
	}
	.mono {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
	}
	.c-brand {
		color: var(--brand);
	}
	.c-teal {
		color: var(--teal);
	}
	.c-amber {
		color: var(--amber);
	}
	.c-violet {
		color: var(--violet);
	}
	.c-rose {
		color: var(--rose);
	}
	.fig {
		font-family: var(--font-mono);
		font-size: 1.15rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.cardhead {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	.cardname {
		font-weight: 700;
		font-size: 1.05rem;
	}
	.stats {
		margin-top: 1.2rem;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}
	.row {
		margin-top: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.meter {
		flex: 1;
		height: 8px;
		border-radius: 999px;
		background: var(--line);
		overflow: hidden;
		display: block;
	}
	.meter span {
		display: block;
		height: 100%;
		background: var(--brand);
	}
	.gpa {
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}
	.gpa-fig {
		font-size: 1.4rem;
		font-weight: 700;
		margin-inline-start: auto;
	}
	.gpa-fig small {
		color: var(--muted);
		font-weight: 400;
	}
	.grade {
		background: var(--brand-tint);
		color: var(--brand);
		font-weight: 700;
		border-radius: 8px;
		padding: 0.2rem 0.5rem;
		font-size: 0.9rem;
	}
	.ladder {
		margin-top: 1rem;
		font-size: 0.78rem;
		color: var(--muted);
	}

	.section {
		max-width: 76rem;
		margin: 3.5rem auto 0;
		padding: 0 1.5rem;
	}
	.h2 {
		font-weight: 700;
		font-size: clamp(1.7rem, 3vw, 2.3rem);
		letter-spacing: -0.02em;
	}
	.lead {
		margin-top: 0.5rem;
		color: var(--muted);
	}
	.grid {
		margin-top: 1.5rem;
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(1, 1fr);
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 980px) {
		.grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	/* The tile is a frosted Card; these style its content. */
	.tile-num {
		display: block;
		margin-top: 0.9rem;
		color: var(--muted);
		font-weight: 600;
	}
	.tile-title {
		font-weight: 700;
		font-size: 1.2rem;
		margin: 0.5rem 0 0.4rem;
	}
	.tile-line {
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--muted);
		margin: 0;
	}

	.kpis {
		display: grid;
		gap: 0.9rem;
		grid-template-columns: repeat(2, 1fr);
	}
	@media (min-width: 720px) {
		.kpis {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	.kpi-fig {
		font-size: 1.3rem;
		font-weight: 700;
	}
	.panels {
		margin-top: 0.9rem;
		display: grid;
		gap: 0.9rem;
		grid-template-columns: 1fr;
	}
	@media (min-width: 720px) {
		.panels {
			grid-template-columns: 1.4fr 1fr;
		}
	}
	.panel-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--muted);
	}
	.split {
		margin-top: 0.8rem;
		display: flex;
		height: 12px;
		border-radius: 999px;
		overflow: hidden;
		gap: 2px;
	}
	.split span {
		display: block;
	}
	.legend {
		margin: 0.9rem 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.82rem;
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--muted);
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		display: inline-block;
	}
	.gauge {
		width: 160px;
		max-width: 100%;
		margin-top: 0.4rem;
	}
	.gauge-track {
		fill: none;
		stroke: var(--line);
		stroke-width: 10;
		stroke-linecap: round;
	}
	.gauge-fill {
		fill: none;
		stroke: var(--brand);
		stroke-width: 10;
		stroke-linecap: round;
	}
	.gauge-fig {
		font-size: 1.3rem;
		font-weight: 700;
		margin-top: -0.4rem;
	}
	.gauge-fig small {
		color: var(--muted);
		font-weight: 400;
	}
	.payments {
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
	}
	.payments li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0;
		border-top: 1px solid var(--line);
	}
	.payments li:first-child {
		border-top: 0;
	}
	.pay-who {
		font-weight: 600;
		font-size: 0.9rem;
	}
	.pay-via {
		font-size: 0.8rem;
		color: var(--muted);
		margin-inline-end: auto;
	}

	.foot {
		max-width: 76rem;
		margin: 3.5rem auto 0;
		padding: 1.75rem 1.5rem 0;
		border-top: 1px solid var(--line);
		font-size: 0.95rem;
		color: var(--muted);
		max-inline-size: 46rem;
	}
</style>
