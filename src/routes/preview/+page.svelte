<script lang="ts">
	/**
	 * A live, in-app preview of the fresh design direction — ink + marigold + jade on
	 * manuscript paper, with a tri-script hero that re-renders (and re-flows RTL) in
	 * English, Bengali, and Arabic. Self-contained: its own scoped palette and fonts,
	 * so it neither touches nor depends on the app's tested token system. Run the app
	 * and visit /preview to see it; nothing here ships to the live landing yet.
	 */
	import { formatMoney } from '$lib/money';

	type Lang = 'en' | 'bn' | 'ar';

	let lang = $state<Lang>('en');
	let dark = $state(false);

	const T = {
		en: {
			dir: 'ltr' as const,
			locale: 'en-BD',
			label: 'English',
			tag: 'New — sell a course from your own bKash or SSLCommerz account',
			h1a: 'Run the whole institution.',
			h1b: 'Teach the whole world.',
			sub: 'From roll-call to result card, bKash to certificate — one platform for a school, a college, a madrasa, or a coaching center.',
			cta1: 'Start free',
			cta2: 'See a live demo',
			card: {
				name: 'Baitul Ilm Dakhil Madrasa',
				kicker: 'This month',
				fees: 'Fees collected',
				due: 'Outstanding dues',
				attend: 'Attendance today',
				gpa: 'Dakhil result',
				ladder: 'Ebtedayee · Dakhil · Alim · Fazil · Kamil'
			},
			solTitle: 'Made for every kind of institution',
			solutions: [
				['School', 'Sections, GPA-5, transfer certificates, guardian SMS.'],
				['College', 'Streams, semesters, transcripts, admissions.'],
				['Madrasa', 'Ebtedayee→Kamil, Hifz tracking, Arabic RTL curriculum.'],
				['Coaching', 'Batches, model-test leaderboards, pay-per-course.']
			],
			pillTitle: 'Everything under one roof',
			pillars: [
				['Create', 'Courses, 16 quiz types, certificates, AI Studio.'],
				['Engage', 'Forum, Q&A, reviews, gamification, notifications.'],
				['Earn', 'bKash & SSLCommerz first — 0% platform fee. You are the merchant.'],
				['Manage', 'Attendance, exams, report cards, timetable, staff.']
			],
			foot: '0% platform fee. The school is the merchant of record — you own your money, your refunds, your students.'
		},
		bn: {
			dir: 'ltr' as const,
			locale: 'bn-BD',
			label: 'বাংলা',
			tag: 'নতুন — নিজের বিকাশ বা এসএসএলকমার্স অ্যাকাউন্টে কোর্স বিক্রি করুন',
			h1a: 'পুরো প্রতিষ্ঠান এক জায়গা থেকে।',
			h1b: 'পৌঁছে দিন সারা বিশ্বে।',
			sub: 'হাজিরা থেকে ফলাফল, বিকাশ থেকে সার্টিফিকেট — স্কুল, কলেজ, মাদ্রাসা বা কোচিং, সব এক প্ল্যাটফর্মে।',
			cta1: 'ফ্রি শুরু করুন',
			cta2: 'ডেমো দেখুন',
			card: {
				name: 'বাইতুল ইলম দাখিল মাদ্রাসা',
				kicker: 'এই মাসে',
				fees: 'আদায়কৃত ফি',
				due: 'বকেয়া',
				attend: 'আজকের উপস্থিতি',
				gpa: 'দাখিল ফলাফল',
				ladder: 'ইবতিদায়ী · দাখিল · আলিম · ফাযিল · কামিল'
			},
			solTitle: 'প্রতিটি প্রতিষ্ঠানের জন্য তৈরি',
			solutions: [
				['স্কুল', 'শাখা, জিপিএ-৫, ছাড়পত্র, অভিভাবক এসএমএস।'],
				['কলেজ', 'বিভাগ, সেমিস্টার, ট্রান্সক্রিপ্ট, ভর্তি।'],
				['মাদ্রাসা', 'ইবতিদায়ী→কামিল, হিফয ট্র্যাকিং, আরবি আরটিএল।'],
				['কোচিং', 'ব্যাচ, মডেল টেস্ট লিডারবোর্ড, কোর্স বিক্রি।']
			],
			pillTitle: 'সবকিছু এক ছাদের নিচে',
			pillars: [
				['তৈরি করুন', 'কোর্স, ১৬ ধরনের কুইজ, সার্টিফিকেট, এআই স্টুডিও।'],
				['যুক্ত করুন', 'ফোরাম, প্রশ্নোত্তর, রিভিউ, গেমিফিকেশন।'],
				['আয় করুন', 'বিকাশ ও এসএসএলকমার্স — ০% ফি। আপনিই মার্চেন্ট।'],
				['পরিচালনা', 'হাজিরা, পরীক্ষা, ফলাফল, রুটিন, স্টাফ।']
			],
			foot: '০% প্ল্যাটফর্ম ফি। প্রতিষ্ঠানই মার্চেন্ট — আপনার টাকা, রিফান্ড, শিক্ষার্থী সব আপনার।'
		},
		ar: {
			dir: 'rtl' as const,
			locale: 'ar',
			label: 'العربية',
			tag: 'جديد — بِع دورة من حسابك الخاص',
			h1a: 'أدِر المؤسسة كاملةً.',
			h1b: 'وعلِّم العالم كله.',
			sub: 'من الحضور إلى كشف الدرجات، ومن الدفع إلى الشهادة — منصة واحدة لمدرسة أو كلية أو مدرسة دينية أو مركز تدريب.',
			cta1: 'ابدأ مجانًا',
			cta2: 'شاهد العرض',
			card: {
				name: 'مدرسة بيت العلم',
				kicker: 'هذا الشهر',
				fees: 'الرسوم المحصّلة',
				due: 'المتأخرات',
				attend: 'حضور اليوم',
				gpa: 'نتيجة الدخيل',
				ladder: 'ابتدائي · دخيل · عالِم · فاضل · كامل'
			},
			solTitle: 'مصمَّمة لكل نوع من المؤسسات',
			solutions: [
				['مدرسة', 'شُعب، معدّل GPA-5، شهادات نقل، رسائل لأولياء الأمور.'],
				['كلية', 'تخصصات، فصول، كشوف درجات، قبول.'],
				['مدرسة دينية', 'من الابتدائي إلى الكامل، تتبّع الحفظ، منهج عربي RTL.'],
				['مركز تدريب', 'دفعات، لوحات صدارة للاختبارات، بيع الدورات.']
			],
			pillTitle: 'كل شيء تحت سقف واحد',
			pillars: [
				['أنشئ', 'دورات، ١٦ نوع اختبار، شهادات، استوديو ذكاء.'],
				['تفاعل', 'منتدى، أسئلة، تقييمات، تحفيز.'],
				['اربح', 'bKash و SSLCommerz أولًا — رسوم ٠٪. أنت التاجر.'],
				['أدِر', 'حضور، امتحانات، نتائج، جداول، موظفون.']
			],
			foot: 'رسوم منصة ٠٪. المؤسسة هي التاجر — أموالك ومستردّاتك وطلابك ملكك.'
		}
	} satisfies Record<Lang, unknown>;

	const t = $derived(T[lang]);

	// The ৳ figures reformat per locale: lakh/crore grouping in English, Bengali
	// numerals in বাংলা, Arabic-Indic in العربية — the glyph ৳ always, never "BDT".
	const taka = (minor: number) => formatMoney({ amount_minor: minor, currency: 'BDT' }, t.locale);
	const num = (n: number) => new Intl.NumberFormat(t.locale).format(n);
</script>

<svelte:head><title>Muallim — design preview</title></svelte:head>

<div class="rd" class:rd-dark={dark} dir={t.dir} {lang}>
	<div class="rd-paper">
		<!-- Control bar -->
		<header class="rd-bar">
			<span class="rd-brand">মু · Muallim</span>
			<div class="rd-controls">
				<div class="rd-seg" role="group" aria-label="Language">
					{#each Object.entries(T) as [key, v] (key)}
						<button
							type="button"
							class="rd-chip"
							class:on={lang === key}
							onclick={() => (lang = key as Lang)}
						>
							{v.label}
						</button>
					{/each}
				</div>
				<button
					type="button"
					class="rd-chip rd-theme"
					onclick={() => (dark = !dark)}
					aria-pressed={dark}
				>
					{dark ? '☾' : '☀'}
				</button>
			</div>
		</header>

		<!-- Hero -->
		<section class="rd-hero">
			<div class="rd-hero-copy">
				<span class="rd-tag">{t.tag}</span>
				<h1 class="rd-h1">
					<span class="rd-h1a">{t.h1a}</span>
					<span class="rd-h1b">{t.h1b}</span>
				</h1>
				<p class="rd-sub">{t.sub}</p>
				<div class="rd-cta">
					<a class="rd-btn rd-btn-solid" href="#start">{t.cta1}</a>
					<a class="rd-btn rd-btn-ghost" href="#demo">{t.cta2}</a>
				</div>
			</div>

			<!-- The live institution card: a madrasa owner's month, in the chosen script. -->
			<div class="rd-card">
				<div class="rd-card-head">
					<span class="rd-card-name">{t.card.name}</span>
					<span class="rd-card-kicker">{t.card.kicker}</span>
				</div>

				<div class="rd-stats">
					<div class="rd-stat">
						<span class="rd-stat-label">{t.card.fees}</span>
						<span class="rd-stat-fig rd-jade">{taka(184250000)}</span>
					</div>
					<div class="rd-stat">
						<span class="rd-stat-label">{t.card.due}</span>
						<span class="rd-stat-fig rd-marigold">{taka(31200000)}</span>
					</div>
				</div>

				<div class="rd-row">
					<span class="rd-stat-label">{t.card.attend}</span>
					<span class="rd-meter" aria-hidden="true"><span style="width: 92%"></span></span>
					<span class="rd-mono">{num(92)}%</span>
				</div>

				<div class="rd-gpa">
					<span class="rd-stat-label">{t.card.gpa}</span>
					<span class="rd-gpa-fig rd-mono">{num(4.83)}<small>/{num(5)}</small></span>
					<span class="rd-gpa-grade">A+</span>
				</div>

				<div class="rd-ladder">{t.card.ladder}</div>
			</div>
		</section>

		<!-- Four institutions -->
		<section class="rd-section">
			<h2 class="rd-h2">{t.solTitle}</h2>
			<div class="rd-grid">
				{#each t.solutions as [name, line] (name)}
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
			<h2 class="rd-h2">{t.pillTitle}</h2>
			<div class="rd-grid">
				{#each t.pillars as [name, line], i (name)}
					<article class="rd-tile rd-tile-pillar">
						<span class="rd-mono rd-tile-num">0{i + 1}</span>
						<h3 class="rd-tile-title">{name}</h3>
						<p class="rd-tile-line">{line}</p>
					</article>
				{/each}
			</div>
		</section>

		<footer class="rd-foot">{t.foot}</footer>
	</div>
</div>

<style>
	/* Scoped palette — ink + marigold + jade on manuscript paper. Light by default;
	   the .rd-dark class flips it. Nothing here leaks past .rd. */
	.rd {
		--paper: #f6f1e7;
		--surface: #fffdf8;
		--ink: #1c2230;
		--muted: #5c5647;
		--line: #e6decd;
		--marigold: #c77a06;
		--jade: #0f7a64;

		--display:
			'Fraunces', 'Noto Serif Bengali', 'Amiri', ui-serif, Georgia, 'Times New Roman', serif;
		--body:
			'Hind Siliguri', 'Noto Sans Bengali', 'Noto Naskh Arabic', system-ui, -apple-system,
			sans-serif;
		--mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace;

		color: var(--ink);
		font-family: var(--body);
	}

	.rd-dark {
		--paper: #111420;
		--surface: #191d2a;
		--ink: #eee7d7;
		--muted: #9a9585;
		--line: #2a2f3e;
		--marigold: #f2a93b;
		--jade: #38b79c;
	}

	/* The alpana dots: a faint dotted ground, the rice-paste floor art abstracted. */
	.rd-paper {
		min-height: 100vh;
		background-color: var(--paper);
		background-image: radial-gradient(var(--line) 1px, transparent 1px);
		background-size: 22px 22px;
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
		font-size: 1.15rem;
	}
	.rd-controls {
		display: flex;
		gap: 0.5rem;
	}
	.rd-seg {
		display: flex;
		gap: 0.25rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.2rem;
	}
	.rd-chip {
		border: 0;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		cursor: pointer;
	}
	.rd-chip.on {
		background: var(--marigold);
		color: #fff;
		font-weight: 600;
	}
	.rd-theme {
		background: var(--surface);
		border: 1px solid var(--line);
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
	.rd-row .rd-stat-label {
		flex: 0 0 auto;
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
		letter-spacing: 0.01em;
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
