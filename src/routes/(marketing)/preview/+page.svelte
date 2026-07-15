<script lang="ts">
	/**
	 * A live, in-app preview of the fresh marketing direction — light, clean, with an
	 * emerald accent (deliberately not the app's blue). Mona Sans for language, Geist
	 * Mono for figures — the app's own faces. Content is English; money is
	 * Bangladeshi, the taka glyph ৳ with lakh/crore grouping (৳18,42,500). Light only:
	 * marketing does not theme. Run the app and visit /preview.
	 */

	// ৳ with English digits and lakh/crore grouping. English currency locales print
	// the letters "BDT", so the glyph is composed onto an en-IN number instead.
	const taka = (minor: number) =>
		'৳' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(minor / 100);
	const num = (n: number) => new Intl.NumberFormat('en-IN').format(n);

	const solutions = [
		['School', 'Sections, GPA-5 report cards, transfer certificates, guardian SMS.'],
		['College', 'Streams, semesters, transcripts, admissions.'],
		['Madrasa', 'Ebtedayee → Kamil, Hifz tracking, Arabic (RTL) curriculum.'],
		['Coaching', 'Batches, model-test leaderboards, pay-per-course.']
	];

	const pillars = [
		['Create', 'Courses, 16 quiz types, certificates, AI Studio.'],
		['Engage', 'Forum, Q&A, reviews, gamification, notifications.'],
		['Earn', 'bKash & SSLCommerz first — 0% platform fee. You are the merchant.'],
		['Manage', 'Attendance, exams, report cards, timetable, staff.']
	];

	// The fee-gateway split and a few recent payments, for the dashboard section.
	const gateways = [
		['bKash', 62, '#e2136e'],
		['SSLCommerz', 24, 'var(--jade)'],
		['Cash', 14, 'var(--muted)']
	] as const;
	const payments = [
		['Ayesha Siddiqua', 'bKash', 120000],
		['Ibrahim Khalil', 'SSLCommerz', 240000],
		['Rahim Uddin', 'bKash', 90000]
	] as const;

	// The GPA-5 gauge: a semicircle whose value arc ends at 4.83 of 5.
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
			<span class="rd-brand">Muallim</span>
			<a class="rd-btn rd-btn-solid rd-btn-sm" href="#start">Start free</a>
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
					<a class="rd-btn rd-btn-solid" href="#start">Start free</a>
					<a class="rd-btn rd-btn-ghost" href="#demo">See a live demo</a>
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
						<span class="rd-stat-fig rd-jade">{taka(184250000)}</span>
					</div>
					<div class="rd-stat">
						<span class="rd-stat-label">Outstanding dues</span>
						<span class="rd-stat-fig rd-marigold">{taka(31200000)}</span>
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
				{#each solutions as [name, line] (name)}
					<article class="rd-tile">
						<span class="rd-tile-dot" aria-hidden="true"></span>
						<h3 class="rd-tile-title">{name}</h3>
						<p class="rd-tile-line">{line}</p>
					</article>
				{/each}
			</div>
		</section>

		<!-- Four pillars -->
		<section class="rd-section">
			<h2 class="rd-h2">Everything under one roof</h2>
			<div class="rd-grid">
				{#each pillars as [name, line], i (name)}
					<article class="rd-tile rd-tile-pillar">
						<span class="rd-mono rd-tile-num">0{i + 1}</span>
						<h3 class="rd-tile-title">{name}</h3>
						<p class="rd-tile-line">{line}</p>
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
					<div class="rd-kpi">
						<span class="rd-stat-label">Fees collected</span>
						<span class="rd-kpi-fig rd-jade rd-mono">{taka(184250000)}</span>
					</div>
					<div class="rd-kpi">
						<span class="rd-stat-label">Outstanding</span>
						<span class="rd-kpi-fig rd-marigold rd-mono">{taka(31200000)}</span>
					</div>
					<div class="rd-kpi">
						<span class="rd-stat-label">Attendance</span>
						<span class="rd-kpi-fig rd-mono">{num(92)}%</span>
					</div>
					<div class="rd-kpi">
						<span class="rd-stat-label">New admissions</span>
						<span class="rd-kpi-fig rd-mono">{num(18)}</span>
					</div>
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
								<span class="rd-mono rd-jade">{taka(amount)}</span>
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
	/* Scoped, light-only palette — clean neutrals with an emerald accent, chosen to
	   sit apart from the app's blue. Mona Sans and Geist Mono are the app's own faces,
	   loaded globally. Nothing here leaks past .rd, and it never themes to dark. */
	.rd {
		--paper: #fafaf8;
		--surface: #ffffff;
		--ink: #17190f;
		--muted: #64655c;
		--line: #ecebe5;
		--jade: #047857; /* emerald — the primary accent */
		--jade-bright: #059669;
		--marigold: #c2410c; /* a warm terracotta, used sparingly */

		--body: 'Mona Sans Variable', ui-sans-serif, system-ui, -apple-system, sans-serif;
		--display: 'Mona Sans Variable', ui-sans-serif, system-ui, -apple-system, sans-serif;
		--mono: 'Geist Mono Variable', ui-monospace, 'SF Mono', monospace;

		color: var(--ink);
		font-family: var(--body);
	}

	/* A whisper of a dotted ground — barely there, so the page reads as clean light
	   rather than textured. */
	.rd-paper {
		min-height: 100vh;
		background-color: var(--paper);
		background-image: radial-gradient(var(--line) 1px, transparent 1px);
		background-size: 26px 26px;
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
		background: color-mix(in oklab, var(--paper) 86%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--line);
	}
	.rd-brand {
		font-family: var(--display);
		font-weight: 600;
		font-size: 1.2rem;
		letter-spacing: -0.01em;
	}
	.rd-btn-sm {
		padding: 0.45rem 1rem;
		font-size: 0.85rem;
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
		color: var(--marigold);
		font-weight: 600;
		border: 1px solid color-mix(in oklab, var(--marigold) 40%, var(--line));
		border-radius: 999px;
		padding: 0.35rem 0.85rem;
		background: color-mix(in oklab, var(--marigold) 8%, var(--surface));
	}
	.rd-h1 {
		font-family: var(--display);
		font-weight: 600;
		font-size: clamp(2.4rem, 5.5vw, 4rem);
		line-height: 1.02;
		letter-spacing: -0.02em;
		margin: 1.4rem 0 0;
	}
	.rd-h1a {
		display: block;
	}
	.rd-h1b {
		display: block;
		color: var(--marigold);
	}
	.rd-sub {
		margin-top: 1.3rem;
		max-width: 34rem;
		font-size: 1.1rem;
		line-height: 1.6;
		color: var(--muted);
	}
	.rd-cta {
		margin-top: 1.9rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.rd-btn {
		display: inline-block;
		padding: 0.7rem 1.4rem;
		border-radius: 999px;
		font-weight: 600;
		font-size: 0.95rem;
		text-decoration: none;
	}
	.rd-btn-solid {
		background: var(--jade);
		color: #fff;
	}
	.rd-btn-ghost {
		border: 1px solid var(--line);
		color: var(--ink);
		background: var(--surface);
	}

	.rd-card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 20px;
		padding: 1.5rem;
		box-shadow: 0 20px 50px -30px rgba(28, 34, 48, 0.4);
	}
	.rd-card-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	.rd-card-name {
		font-family: var(--display);
		font-weight: 600;
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
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 12px;
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
	.rd-jade {
		color: var(--jade);
	}
	.rd-marigold {
		color: var(--marigold);
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
		border-radius: 999px;
		background: var(--line);
		overflow: hidden;
		display: block;
	}
	.rd-meter span {
		display: block;
		height: 100%;
		background: var(--jade);
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
		background: color-mix(in oklab, var(--jade) 15%, var(--surface));
		color: var(--jade);
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
		font-family: var(--display);
		font-weight: 600;
		font-size: clamp(1.6rem, 3vw, 2.2rem);
		letter-spacing: -0.01em;
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
		border-radius: 16px;
		padding: 1.4rem;
		transition: transform 0.15s ease;
	}
	.rd-tile:hover {
		transform: translateY(-3px);
	}
	.rd-tile-dot {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 999px;
		background: var(--marigold);
	}
	.rd-tile-pillar .rd-tile-num {
		color: var(--marigold);
		font-weight: 600;
	}
	.rd-tile-title {
		font-family: var(--display);
		font-weight: 600;
		font-size: 1.15rem;
		margin: 0.7rem 0 0.4rem;
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
		border-radius: 20px;
		padding: 1.5rem;
		box-shadow: 0 20px 50px -34px rgba(28, 34, 48, 0.4);
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
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.rd-kpi-fig {
		font-size: 1.25rem;
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
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 12px;
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
		border-radius: 999px;
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
		border-radius: 999px;
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
		stroke: var(--jade);
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
		.rd-tile {
			transition: none;
		}
	}
</style>
