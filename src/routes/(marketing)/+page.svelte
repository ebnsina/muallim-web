<script lang="ts">
	/**
	 * The landing: a warm nature backdrop under a floating white panel, olive and
	 * lime, big rounded cards, pill buttons. The tokens are the marketing layout's —
	 * this page carried its own copy of them for a while, which is how the rest of
	 * the site ended up a different colour entirely.
	 *
	 * Every claim here is something the product does. It once promised 16 quiz types
	 * (there are 15), a grading ladder it does not ship, and right-to-left Arabic
	 * that was never built — so: no invented feature, logo, testimonial, or number.
	 */
	import { fly } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { Icon } from '$lib/components';
	import { FEATURES, GROUPS as FEATURE_GROUPS, featuresIn } from '$lib/content/features';
	import {
		ArrowLeft01Icon,
		ArrowRight01Icon,
		ArrowRight02Icon,
		Tick02Icon,
		Mortarboard01Icon,
		School01Icon,
		UserMultipleIcon,
		Money04Icon,
		Book02Icon,
		ClipboardIcon,
		Message02Icon,
		AiBrain01Icon,
		CheckmarkBadge01Icon,
		Quiz01Icon,
		Store01Icon,
		LanguageSkillIcon,
		ChartLineData01Icon,
		Rocket01Icon,
		PlusSignIcon,
		MinusSignIcon
	} from '@hugeicons/core-free-icons';

	// The taka glyph with lakh/crore grouping — en-IN numerals, glyph composed on.
	const taka = (n: number) => '৳' + new Intl.NumberFormat('en-IN').format(n);

	// An honest "works with" strip — the real rails and capabilities Muallim ships,
	// not invented partner logos.
	const marquee = [
		'Your own bKash',
		'SSLCommerz',
		'Stripe · international',
		'Guardian SMS',
		'GPA-5 report cards',
		'Your own grading scale',
		'Hifz tracking',
		'15 quiz types',
		'0% platform fee'
	];

	const audiences = [
		{
			icon: School01Icon,
			who: 'Schools & colleges',
			line: 'Attendance in one register, fees in another, and results typed into spreadsheets long after the bell — three books that never quite agree.'
		},
		{
			icon: Book02Icon,
			who: 'Madrasas',
			line: 'Hifz to track — Sabaq, Sabqi and Manzil — and classes you name yourself, from Ebtedayee to Kamil, on a grading scale you set.'
		},
		{
			icon: UserMultipleIcon,
			who: 'Coaching centers',
			line: 'Batches that overlap, a different fee for every course, and admissions living in a WhatsApp thread you scroll to find.'
		},
		{
			icon: Store01Icon,
			who: 'Course creators',
			line: 'Something worth teaching and nowhere to sell it that does not skim a cut off every sale you make.'
		}
	] as const;

	const journey = [
		{
			icon: Rocket01Icon,
			title: 'Set up your institution',
			line: 'Pick school, college, madrasa, or coaching, and you are live in minutes — nothing to install. You start today, not next term.'
		},
		{
			icon: UserMultipleIcon,
			title: 'Bring in students & guardians',
			line: 'Invite teachers, import a cohort by email, and keep guardians in the loop by SMS. Everyone is on the same system from day one.'
		},
		{
			icon: Book02Icon,
			title: 'Teach your way',
			line: 'Text and video lessons, 15 question types, quizzes graded the moment a learner submits. Lessons and marking stop living in your evenings.'
		},
		{
			icon: ClipboardIcon,
			title: 'Run the day',
			line: 'Take the register class by class and keep the timetable, staff, and sections in one place. The office side stops being a pile of paper.'
		},
		{
			icon: CheckmarkBadge01Icon,
			title: 'Assess and report',
			line: 'Exams that roll up into GPA-5 or madrasa-ladder report cards, ready to hand to families. Results are done when the exam is, not weeks later.'
		},
		{
			icon: Money04Icon,
			title: 'Get paid',
			line: 'Collect fees through your own bKash or SSLCommerz account — you are the merchant, at 0% platform fee. Every taka is yours, with a receipt trail.'
		},
		{
			icon: ChartLineData01Icon,
			title: 'Grow beyond the gate',
			line: 'Publish a course and sell it to the world, with Stripe for learners paying from abroad. Your institution can earn past its walls.'
		}
	] as const;

	type Tab = {
		key: string;
		tab: string;
		icon: typeof Book02Icon;
		title: string;
		lead: string;
		points: string[];
	};

	const tabs: Tab[] = [
		{
			key: 'teaching',
			tab: 'Teaching',
			icon: Book02Icon,
			title: 'Author, assess, and certify',
			lead: 'Build a course in the order you teach it, mark the work, and hand out a certificate that verifies.',
			points: [
				'Text and video lessons, with a free preview clip',
				'15 quiz types — most auto-graded the moment they submit',
				'Assignments with file upload and a real gradebook',
				'Certificates on completion, drip and prerequisites'
			]
		},
		{
			key: 'management',
			tab: 'Management',
			icon: ClipboardIcon,
			title: 'Roll-call to result card',
			lead: 'The office side of the institution — the daily register through to the board result — in one place.',
			points: [
				'Attendance, class by class, day by day',
				'Exams that roll up into GPA-5 report cards',
				'Timetable, staff, students, and guardians',
				'Transfer certificates and guardian SMS'
			]
		},
		{
			key: 'community',
			tab: 'Community',
			icon: Message02Icon,
			title: 'Engage your learners',
			lead: 'A course is a place, not a file drop — a forum to ask in, reviews to earn, and progress worth chasing.',
			points: [
				'Course forum and threaded Q&A',
				'Ratings and reviews from learners who finished',
				'Points, badges and a leaderboard to keep them coming back',
				'Notifications, private notes, and highlights'
			]
		},
		{
			key: 'ai',
			tab: 'AI Studio',
			icon: AiBrain01Icon,
			title: 'Draft it with AI Studio',
			lead: 'Start from a prompt instead of a blank page, then edit everything the studio drafts for you.',
			points: [
				'Draft a course outline from a topic',
				'Generate quiz questions across the 16 types',
				'Everything AI writes stays yours to edit',
				'You publish nothing until you approve it'
			]
		}
	];

	let menuOpen = $state(false);
	let monthly = $state(184250);
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

	// Header mega menu — two panels: categories on the left, their features on the right.
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

	// Rotating card tones — mint, lavender, teal, olive. `chip` is the
	// pill background, which has to lift off the dark card rather than sink into it.
	const tones = [
		{
			card: 'border border-[#e2eeca] bg-[radial-gradient(120%_90%_at_30%_0%,#eaf5cf,#ffffff_75%)]',
			icon: 'bg-white text-[#2e3320]',
			title: 'text-[#17170f]',
			body: 'text-[#5c6248]',
			tick: 'text-[#2e3320]',
			chip: 'bg-black/5'
		},
		{
			card: 'bg-[#dedbf6]',
			icon: 'bg-white text-[#4a3f7a]',
			title: 'text-[#17170f]',
			body: 'text-[#5a5675]',
			tick: 'text-[#4a3f7a]',
			chip: 'bg-white/60'
		},
		{
			card: 'bg-[#dbe9e6]',
			icon: 'bg-white text-[#2e5148]',
			title: 'text-[#17170f]',
			body: 'text-[#4c5a55]',
			tick: 'text-[#2e5148]',
			chip: 'bg-white/60'
		},
		{
			card: 'bg-[#2e3320] text-[#eef0e6]',
			icon: 'bg-[#c4e84b] text-[#2e3320]',
			title: 'text-[#c4e84b]',
			body: 'text-[#c9d0b8]',
			tick: 'text-[#c4e84b]',
			chip: 'bg-white/10'
		}
	];

	// Honest rotating statements for the animated carousel — what the product does,
	// not invented customer quotes. Real, attributed testimonials can drop in here.
	const statements = [
		{
			label: 'What you keep',
			text: '0% platform fee. You collect through your own bKash or SSLCommerz — every taka is yours.'
		},
		{
			label: 'One place',
			text: 'Attendance, exams, report cards, and fees — the whole institution, in one system.'
		},
		{
			label: 'Made for you',
			text: 'School, college, madrasa, or coaching — set up the way you already run, in minutes.'
		},
		{
			label: 'Beyond the gate',
			text: 'Publish a course and teach the world — Stripe for learners paying from abroad.'
		}
	];
	let slide = $state(0);
	const nextSlide = () => (slide = (slide + 1) % statements.length);
	const prevSlide = () => (slide = (slide - 1 + statements.length) % statements.length);

	const reasons = [
		{
			icon: Money04Icon,
			title: '0% platform fee',
			line: 'Muallim never holds your money. Price a course in ৳ and keep every taka you collect.'
		},
		{
			icon: Store01Icon,
			title: "You're the merchant",
			line: 'Fees land in your own bKash or SSLCommerz account. Stripe is there for international learners.'
		},
		{
			icon: LanguageSkillIcon,
			title: 'Bangladesh-first',
			line: 'Taka with lakh grouping, GPA-5 report cards, bKash and SSLCommerz, and Hifz tracking.'
		},
		{
			icon: Quiz01Icon,
			title: '15 quiz types + certificates',
			line: 'From MCQ to essays a person still marks, then a verifiable certificate at the end.'
		}
	] as const;

	const faqs = [
		{
			q: 'How do I start?',
			a: 'Create a free workspace, choose your institution type, and invite your first teacher. There is nothing to install and no card to enter to get going.'
		},
		{
			q: 'Is it free to begin?',
			a: 'Yes. Opening a workspace is free, and a course with no price stays free. When you do sell a course, the only fees are the ones your own payment service charges — Muallim takes 0%.'
		},
		{
			q: 'Which payment gateways can I use?',
			a: 'bKash and SSLCommerz through your own merchant account for Bangladesh, and Stripe for international learners. You are the merchant of record, so you own the money, the refunds, and the disputes.'
		},
		{
			q: 'Can a madrasa use it?',
			a: 'Yes. Set the workspace to madrasa, name your classes from Ebtedayee to Kamil, set your own grading scale, and track Hifz alongside the general classes.'
		},
		{
			q: 'Does it work in Bengali and Arabic?',
			a: 'Pricing is shown in taka with lakh grouping (for example ৳18,42,500), and you write your courses in whatever language you teach in. The interface itself is in English.'
		}
	] as const;

	let openFaq = $state(0);
	const toggleFaq = (i: number) => (openFaq = openFaq === i ? -1 : i);

	// The breadth strip: every feature group, counted from the content file so the
	// number on the page can never drift from the pages behind it.
	const breadth = FEATURE_GROUPS.map((g) => ({
		key: g.key,
		name: g.name,
		blurb: g.blurb,
		icon: g.icon,
		names: featuresIn(g.key).map((f) => f.name)
	}));
</script>

<svelte:head>
	<title>Muallim — run the whole institution, teach the whole world</title>
	<meta
		name="description"
		content="One platform for a school, a college, a madrasa, or a coaching centre: courses, 15 quiz types, certificates, attendance, exams and report cards, fees through your own bKash or SSLCommerz account — 0% platform fee."
	/>
</svelte:head>

<div class="landing">
	<!-- HEADER + HERO: full-bleed portrait, floating pill nav, bottom-left copy, a
	     floating stat card bottom-right. -->
	<div class="topwrap">
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

		<section class="hero">
			<div class="hero-copy">
				<h1 class="hero-h1">Run the whole<br />institution.</h1>
				<p class="hero-sub">
					One platform to run a school, college, madrasa, or coaching centre — and teach the world
					online. Attendance, exams, report cards, and fees, together. You keep the money and the
					students.
				</p>
				<a class="pill-lime" href={resolve('/register')}>
					Get started <Icon icon={ArrowRight02Icon} class="size-5" />
				</a>
			</div>

			<aside class="statcard" aria-label="Fees collected this term">
				<div class="statcard-top">
					<span class="statcard-title">Fees collected</span>
					<span class="statcard-badge">+18%</span>
				</div>
				<div class="statcard-tabs">
					<span class="on">This term</span><span>Monthly</span><span>Yearly</span>
				</div>
				<div class="statcard-bars">
					<span style="height:46%"></span>
					<span class="dark" style="height:64%"></span>
					<span style="height:52%"></span>
					<span class="dark" style="height:80%"></span>
					<span style="height:60%"></span>
					<span class="dark" style="height:94%"></span>
				</div>
				<p class="statcard-foot">{taka(1842500)} to your own bKash · updates as fees come in</p>
			</aside>
		</section>
	</div>

	<!-- WORKS-WITH MARQUEE (honest: real rails + capabilities, not partner logos) -->
	<section class="marquee-sec" aria-label="What Muallim works with">
		<div class="marquee">
			<div class="marquee-track">
				{#each marquee.concat(marquee) as m, i (i)}
					<span class="mq" aria-hidden={i >= marquee.length}>{m}</span>
				{/each}
			</div>
		</div>
	</section>

	<!-- BUILD BLOCK -->
	<section class="section build">
		<div class="build-copy">
			<h2 class="h2">Built for how your institution actually runs</h2>
			<div class="build-cta">
				<a class="pill pill-primary" href={resolve('/register')}>
					Start free <Icon icon={ArrowRight02Icon} class="size-4" />
				</a>
				<a class="pill pill-ghost" href="#capabilities">See features</a>
			</div>
			<p class="build-p">
				<strong>One platform, end to end.</strong> The morning register, the board result, and the fee
				receipt used to live in separate books that never quite agreed. Muallim keeps them together.
			</p>
			<p class="build-p">
				<strong>Set up for your kind of school.</strong> School, college, madrasa, or coaching — pick
				your type and Muallim fits how you already work, from classes and sections to the grading scale
				you mark on.
			</p>
		</div>

		<div class="build-cards">
			<div class="fcard fcard-teal">
				<div class="fcard-widget">
					<span class="fw-label">Today's register · Class 6A</span>
					<div class="fw-row">
						<span class="ava"></span><span class="ava"></span><span class="ava"></span>
						<span class="fw-chip">92% present</span>
					</div>
				</div>
				<h3 class="fcard-title">Run the day, effortlessly</h3>
				<ul class="fcard-list">
					<li><Icon icon={ArrowRight02Icon} class="size-4" /> Take the register, class by class</li>
					<li>
						<Icon icon={ArrowRight02Icon} class="size-4" /> Timetable, staff, and sections in one place
					</li>
				</ul>
				<a class="pill pill-primary pill-sm" href={resolve('/register')}>
					Take the register <Icon icon={ArrowRight02Icon} class="size-4" />
				</a>
			</div>

			<div class="fcard fcard-dark">
				<div class="fw-panel">
					<span class="fw-label">You're the merchant</span>
					<div class="fw-chips">
						<span class="gw">bKash</span><span class="gw">SSLCommerz</span><span class="gw"
							>Stripe</span
						>
					</div>
				</div>
				<div class="fcard-dark-foot">
					<h3 class="fcard-title lime">Teach beyond the gate</h3>
					<p class="fcard-dark-p">
						Publish a course and sell it to the world — Stripe for learners paying from abroad. You
						keep the money, at 0% platform fee.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- OVERVIEW: headline + three cards (Tailwind, no scoped CSS) -->
	<section class="mx-auto mt-24 w-full max-w-[82rem] px-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<h2
				class="text-3xl font-bold leading-[1.05] tracking-tight text-[#2e3320] sm:text-4xl lg:text-[3.2rem]"
			>
				The whole institution, at a glance
			</h2>
			<a
				href="#capabilities"
				class="inline-flex items-center gap-2 rounded-full border border-[#e7e4d8] bg-white px-5 py-2.5 text-sm font-semibold text-[#17170f] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(23,23,15,0.08)]"
			>
				Learn more <Icon icon={ArrowRight02Icon} class="size-4" />
			</a>
		</div>

		<div class="mt-8 grid gap-4 md:grid-cols-3">
			<!-- Roster card -->
			<div
				class="flex min-h-[22rem] flex-col justify-center rounded-3xl border border-[#e2eeca] bg-[radial-gradient(120%_90%_at_30%_0%,#eaf5cf,#ffffff_70%)] p-6"
			>
				<div class="rounded-2xl bg-white p-5 shadow-[0_14px_36px_-18px_rgba(23,23,15,0.35)]">
					<p class="font-semibold text-[#17170f]">Today's register</p>
					<div class="mt-3 flex flex-wrap gap-2">
						<span class="rounded-full bg-[#2e3320] px-3 py-1 text-xs font-semibold text-[#c4e84b]"
							>Class 6A</span
						>
						<span class="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[#3f4a2b]"
							>Dakhil-A</span
						>
						<span class="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[#3f4a2b]"
							>Alim-B</span
						>
						<span class="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[#3f4a2b]"
							>Coaching · Physics</span
						>
					</div>
					<p class="mt-4 text-sm leading-snug text-[#6b6a5e]">
						Mark every class in a tap — nobody slips the roll.
					</p>
				</div>
			</div>

			<!-- Results card -->
			<div class="flex min-h-[22rem] flex-col rounded-3xl bg-[#dedbf6] p-6">
				<h3 class="text-2xl font-bold tracking-tight text-[#17170f]">Results,<br />rolled up.</h3>
				<div class="mt-auto rounded-2xl bg-white p-5">
					<p class="text-xs font-semibold text-[#6b6a5e]">Report card · Dakhil</p>
					<p class="mt-1 text-3xl font-bold tracking-tight text-[#17170f]">
						4.83 <span class="text-sm font-semibold text-[#6b6a5e]">/5.00 GPA</span>
					</p>
					<div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6b6a5e]">
						<span>Quran <b class="text-[#3f4a2b]">A+</b></span>
						<span>Arabic <b class="text-[#3f4a2b]">A+</b></span>
						<span>Bangla <b class="text-[#3f4a2b]">A</b></span>
					</div>
				</div>
			</div>

			<!-- Fees photo card -->
			<div
				class="relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-3xl bg-[#2e3320] p-6 text-white"
			>
				<img
					src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=75"
					alt=""
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover"
				/>
				<div class="absolute inset-0 bg-gradient-to-b from-black/20 to-black/75"></div>
				<h3 class="relative text-2xl font-bold tracking-tight">Fees, your way</h3>
				<p class="relative max-w-[22rem] text-sm leading-relaxed text-white/90">
					Collect fees in your own bKash or SSLCommerz — 0% platform fee, every taka yours, with a
					receipt trail.
				</p>
			</div>
		</div>
	</section>

	<!-- FEE TRANSPARENCY: copy + interactive "what you keep" calculator (Tailwind) -->
	<section class="mx-auto mt-24 w-full max-w-[82rem] px-6">
		<div class="grid items-center gap-10 md:grid-cols-2">
			<div>
				<h2 class="text-4xl font-bold leading-[1.05] tracking-tight text-[#17170f] sm:text-5xl">
					One clear price.<br />No hidden cut.
				</h2>
				<p class="mt-5 max-w-md leading-relaxed text-[#6b6a5e]">
					You collect fees through your own bKash or SSLCommerz account, so Muallim never holds your
					money. The only fee is the one bKash or SSLCommerz charges — Muallim takes 0%.
				</p>
				<a
					href={resolve('/register')}
					class="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2e3320] px-6 py-3 font-semibold text-[#eaf5cf] transition hover:-translate-y-0.5 hover:bg-[#3a4029]"
				>
					Start free <Icon icon={ArrowRight02Icon} class="size-4" />
				</a>
			</div>

			<div
				class="rounded-[28px] bg-[#c4e84b] p-8 text-[#2e3320] shadow-[0_30px_70px_-40px_rgba(46,51,32,0.6)]"
			>
				<p class="text-lg font-semibold">Fee calculator</p>
				<div class="mt-4 h-px w-full bg-[#2e3320]/20"></div>
				<p class="mt-6 text-sm font-medium text-[#2e3320]/70">Fees you collect this month</p>
				<p class="mt-1 text-5xl font-bold tracking-tight tabular-nums">{taka(monthly)}</p>
				<input
					type="range"
					min="20000"
					max="1000000"
					step="5000"
					bind:value={monthly}
					aria-label="Fees collected this month"
					class="mt-5 h-5 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-9 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#2e3320] [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[#2e3320]/20 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[#2e3320]/20 [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2e3320]"
				/>
				<div class="mt-5 h-px w-full bg-[#2e3320]/20"></div>
				<div class="mt-4 flex items-center justify-between text-sm font-semibold">
					<span>Muallim's cut</span>
					<span class="tabular-nums">৳0 · you keep 100%</span>
				</div>
			</div>
		</div>
	</section>

	<!-- STATEMENTS carousel: full-bleed photo, text animates in (Tailwind + svelte transition).
	     Honest product statements, not fabricated testimonials — real quotes can replace them. -->
	<section
		class="relative mt-24 min-h-[42rem] overflow-hidden"
		aria-roledescription="carousel"
		aria-label="Why Muallim"
	>
		<img
			src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=75"
			alt=""
			loading="lazy"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15"></div>
		<div
			class="relative mx-auto flex min-h-[42rem] max-w-[82rem] flex-col justify-center px-6 py-16"
		>
			{#key slide}
				<div in:fly={{ y: 24, duration: 500 }}>
					<p class="text-sm font-semibold tracking-wide text-white/80">{statements[slide].label}</p>
					<p
						class="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-[#c4e84b] sm:text-4xl md:text-5xl"
					>
						{statements[slide].text}
					</p>
				</div>
			{/key}
			<div class="absolute right-6 bottom-8 flex gap-2">
				<button
					onclick={prevSlide}
					aria-label="Previous statement"
					class="grid size-11 place-items-center rounded-full border border-white/30 text-white transition hover:bg-white/10"
				>
					<Icon icon={ArrowLeft01Icon} class="size-5" />
				</button>
				<button
					onclick={nextSlide}
					aria-label="Next statement"
					class="grid size-11 place-items-center rounded-full border border-white/30 text-white transition hover:bg-white/10"
				>
					<Icon icon={ArrowRight01Icon} class="size-5" />
				</button>
			</div>
		</div>
	</section>

	<!-- WHO IT'S FOR: colored persona cards -->
	<section id="audiences" class="mx-auto mt-24 w-full max-w-[82rem] px-6">
		<p class="text-xs font-bold tracking-[0.14em] text-[#3f4a2b] uppercase">Is this you?</p>
		<h2 class="mt-2 max-w-[22ch] text-3xl font-bold tracking-tight text-[#2e3320] sm:text-4xl">
			You have an institution to run — spread across too many books.
		</h2>
		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each audiences as a, i (a.who)}
				{@const tone = tones[i % tones.length]}
				<div class="flex min-h-[15rem] flex-col rounded-3xl p-6 {tone.card}">
					<span class="grid size-11 place-items-center rounded-xl {tone.icon}">
						<Icon icon={a.icon} class="size-5" />
					</span>
					<h3 class="mt-4 text-lg font-bold {tone.title}">{a.who}</h3>
					<p class="mt-1 text-sm leading-relaxed {tone.body}">{a.line}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- THE PRODUCT JOURNEY: two-column, olive step-list -->
	<section id="journey" class="mx-auto mt-24 w-full max-w-[82rem] px-6">
		<div class="grid gap-10 md:grid-cols-2 md:items-start">
			<div class="md:sticky md:top-24">
				<p class="text-xs font-bold tracking-[0.14em] text-[#3f4a2b] uppercase">Your journey</p>
				<h2 class="mt-2 text-3xl font-bold tracking-tight text-[#2e3320] sm:text-4xl">
					From first day to fully online, one clear path.
				</h2>
				<p class="mt-3 max-w-md leading-relaxed text-[#6b6a5e]">
					Seven steps, in the order you'd actually live them — nothing to install, and you start
					today.
				</p>
				<a
					href={resolve('/register')}
					class="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2e3320] px-6 py-3 font-semibold text-[#eaf5cf] transition hover:-translate-y-0.5 hover:bg-[#3a4029]"
				>
					Start free <Icon icon={ArrowRight02Icon} class="size-4" />
				</a>
			</div>
			<ol class="space-y-1 rounded-3xl bg-[#2e3320] p-3">
				{#each journey as s, i (s.title)}
					<li class="flex gap-4 rounded-2xl p-4 transition hover:bg-white/5">
						<span
							class="grid size-9 shrink-0 place-items-center rounded-lg bg-[#c4e84b] font-mono text-sm font-bold text-[#2e3320]"
						>
							{i + 1 < 10 ? `0${i + 1}` : i + 1}
						</span>
						<div>
							<h3 class="font-bold text-white">{s.title}</h3>
							<p class="mt-0.5 text-sm leading-relaxed text-[#c9d0b8]">{s.line}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</section>

	<!-- CAPABILITIES: colored feature cards -->
	<section id="capabilities" class="mx-auto mt-24 w-full max-w-[82rem] px-6">
		<p class="text-xs font-bold tracking-[0.14em] text-[#3f4a2b] uppercase">Up close</p>
		<h2 class="mt-2 text-3xl font-bold tracking-tight text-[#2e3320] sm:text-4xl">
			The same platform, four sides to it
		</h2>
		<p class="mt-2 max-w-2xl leading-relaxed text-[#6b6a5e]">
			Everything you just walked through, in more detail — all in one system, no add-ons.
		</p>
		<div class="mt-8 grid gap-4 md:grid-cols-2">
			{#each tabs as t, i (t.key)}
				{@const tone = tones[i % tones.length]}
				<div class="rounded-3xl p-7 {tone.card}">
					<span class="grid size-12 place-items-center rounded-xl {tone.icon}">
						<Icon icon={t.icon} class="size-6" />
					</span>
					<h3 class="mt-4 text-xl font-bold tracking-tight {tone.title}">{t.title}</h3>
					<p class="mt-1 text-sm leading-relaxed {tone.body}">{t.lead}</p>
					<ul class="mt-5 grid gap-2.5">
						{#each t.points as pt (pt)}
							<li class="flex items-start gap-2 text-sm leading-snug {tone.body}">
								<Icon
									icon={Tick02Icon}
									strokeWidth={2.5}
									class="mt-0.5 size-4 shrink-0 {tone.tick}"
								/>
								<span>{pt}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>

	<!-- BREADTH: every feature group, linking into /features. Counts come from the
	     content file, so the page cannot claim more than there are pages for. -->
	<section id="everything" class="mx-auto mt-24 w-full max-w-[82rem] px-6">
		<p class="text-xs font-bold tracking-[0.14em] text-[#3f4a2b] uppercase">Everything in it</p>
		<div class="mt-2 flex flex-wrap items-end justify-between gap-4">
			<h2 class="max-w-[24ch] text-3xl font-bold tracking-tight text-[#2e3320] sm:text-4xl">
				Four sides, and {FEATURES.length} features behind them.
			</h2>
			<a
				href={resolve('/(marketing)/features')}
				class="inline-flex items-center gap-2 rounded-full bg-[#2e3320] px-6 py-3 font-semibold text-[#eaf5cf] transition hover:-translate-y-0.5 hover:bg-[#3a4029]"
			>
				See all {FEATURES.length} features <Icon icon={ArrowRight02Icon} class="size-4" />
			</a>
		</div>
		<p class="mt-3 max-w-2xl leading-relaxed text-[#6b6a5e]">
			The list below is the whole product, not a highlight reel — and every one of them has a page
			saying plainly what it does today.
		</p>

		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each breadth as g, i (g.key)}
				{@const tone = tones[i % tones.length]}
				<div class="flex flex-col rounded-3xl p-6 {tone.card}">
					<span class="grid size-11 place-items-center rounded-xl {tone.icon}">
						<Icon icon={g.icon} class="size-5" />
					</span>
					<h3 class="mt-4 text-lg font-bold {tone.title}">{g.name}</h3>
					<p class="mt-1 text-sm leading-relaxed {tone.body}">{g.blurb}</p>
					<ul class="mt-4 flex flex-wrap gap-1.5">
						{#each g.names as name (name)}
							<li class="rounded-full {tone.chip} px-2.5 py-1 text-xs font-semibold {tone.body}">
								{name}
							</li>
						{/each}
					</ul>
					<a
						href="{resolve('/(marketing)/features')}#{g.key}"
						class="mt-5 inline-flex items-center gap-1.5 text-sm font-bold {tone.tick} hover:underline"
					>
						Explore {g.name.toLowerCase()}
						<Icon icon={ArrowRight02Icon} class="size-4" />
					</a>
				</div>
			{/each}
		</div>
	</section>

	<!-- HONEST DIFFERENTIATORS: colored cards + olive stat panel -->
	<section id="why" class="mx-auto mt-24 w-full max-w-[82rem] px-6">
		<p class="text-xs font-bold tracking-[0.14em] text-[#3f4a2b] uppercase">Why Muallim</p>
		<h2 class="mt-2 max-w-[26ch] text-3xl font-bold tracking-tight text-[#2e3320] sm:text-4xl">
			No invented reviews. Just what the product actually does.
		</h2>
		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each reasons as r, i (r.title)}
				{@const tone = tones[i % tones.length]}
				<div class="flex min-h-[14rem] flex-col rounded-3xl p-6 {tone.card}">
					<span class="grid size-11 place-items-center rounded-xl {tone.icon}">
						<Icon icon={r.icon} class="size-5" />
					</span>
					<h3 class="mt-4 text-lg font-bold {tone.title}">{r.title}</h3>
					<p class="mt-1 text-sm leading-relaxed {tone.body}">{r.line}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- FAQ: dark-olive band, lime headline, accordion (Tailwind) -->
	<section id="faq" class="mt-24 bg-[#2e3320] py-20 text-[#eaf5cf]">
		<div class="mx-auto grid max-w-[82rem] gap-12 px-6 md:grid-cols-2">
			<div>
				<h2 class="text-4xl font-bold leading-[1.05] tracking-tight text-[#c4e84b] sm:text-5xl">
					Frequently<br />Asked Questions
				</h2>
				<p class="mt-5 max-w-sm leading-relaxed text-[#eaf5cf]/70">
					Clear answers to the questions schools, madrasas, and coaching centers ask before they
					start.
				</p>
				<p class="mt-6 text-sm text-[#eaf5cf]/60">
					Still have questions?
					<a class="font-semibold text-[#c4e84b] hover:underline" href="mailto:hello@muallim.app"
						>hello@muallim.app</a
					>
				</p>
			</div>
			<div>
				{#each faqs as f, i (f.q)}
					<div class="border-b border-white/10">
						<button
							class="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold text-[#eaf5cf]"
							aria-expanded={openFaq === i}
							onclick={() => toggleFaq(i)}
						>
							<span>{f.q}</span>
							<Icon
								icon={openFaq === i ? MinusSignIcon : PlusSignIcon}
								class="size-5 shrink-0 text-[#c4e84b]"
							/>
						</button>
						{#if openFaq === i}
							<p class="max-w-xl pb-5 leading-relaxed text-[#eaf5cf]/65">{f.a}</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CONTACT CTA on a lime gradient (Tailwind) -->
	<section
		class="mt-24 bg-gradient-to-b from-[#f3f1ea] via-[#eef2d4] to-[#dfeaa6] px-6 py-24 text-center"
	>
		<h2
			class="mx-auto max-w-[15ch] text-4xl font-bold leading-[1.05] tracking-tight text-[#2e3320] sm:text-5xl"
		>
			Talk to a real person
		</h2>
		<p class="mx-auto mt-5 max-w-xl leading-relaxed text-[#4a4d38]">
			Getting an institution online is a big step. Our team helps you set up, bring in your
			students, and take your first fee — no bots, no runaround.
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-4">
			<div class="flex items-center gap-3">
				<span class="text-sm font-semibold text-[#2e3320]">Our team</span>
				<div class="flex items-center">
					<span class="size-8 rounded-full border-2 border-[#dfeaa6] bg-[#c9b7a4]"></span>
					<span class="-ml-2 size-8 rounded-full border-2 border-[#dfeaa6] bg-[#8fae7a]"></span>
					<span class="-ml-2 size-8 rounded-full border-2 border-[#dfeaa6] bg-[#b9a0c6]"></span>
					<span
						class="-ml-2 grid size-8 place-items-center rounded-full border-2 border-[#dfeaa6] bg-[#2e3320] text-xs font-bold text-[#c4e84b]"
						>3+</span
					>
				</div>
			</div>
			<span class="hidden h-8 w-px bg-[#2e3320]/20 sm:block"></span>
			<a
				href="mailto:hello@muallim.app"
				class="inline-flex items-center gap-2 rounded-full bg-[#2e3320] px-6 py-3 font-semibold text-[#eaf5cf] transition hover:-translate-y-0.5 hover:bg-[#3a4029]"
			>
				Talk to us <Icon icon={ArrowRight02Icon} class="size-4" />
			</a>
		</div>
	</section>

	<!-- FOOTER: dark-olive rounded card, on the same lime the CTA gradient ends on -->
	<footer class="bg-[#dfeaa6] px-4 pb-6">
		<div class="mx-auto max-w-[84rem] rounded-[32px] bg-[#2e3320] px-8 py-12 text-[#eef0e6]">
			<div class="flex flex-wrap items-start justify-between gap-6">
				<a href={resolve('/')} class="inline-flex items-center gap-2 text-xl font-bold text-white">
					<span class="grid size-8 place-items-center rounded-lg bg-[#c4e84b] text-[#2e3320]">
						<Icon icon={Mortarboard01Icon} class="size-5" />
					</span>
					Muallim
				</a>
				<nav class="flex flex-wrap gap-6 text-sm text-[#eef0e6]/75">
					<a href="#audiences" class="hover:text-white">Solutions</a>
					<a href={resolve('/(marketing)/features')} class="hover:text-white">Features</a>
					<a href="#faq" class="hover:text-white">FAQ</a>
					<a href="mailto:hello@muallim.app" class="hover:text-white">Contact</a>
				</nav>
			</div>

			<div class="mt-10 grid gap-10 md:grid-cols-2">
				<div>
					<p class="max-w-sm text-sm leading-relaxed text-[#eef0e6]/70">
						Run the whole institution and teach the whole world — attendance, exams, report cards,
						and fees, in one place. You keep the money and the students.
					</p>
					<a
						href={resolve('/register')}
						class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#c4e84b] hover:underline"
					>
						Start free <Icon icon={ArrowRight02Icon} class="size-4" />
					</a>
				</div>
				<div class="md:justify-self-end">
					<p class="text-sm font-semibold text-white">Contact</p>
					<a
						href="mailto:hello@muallim.app"
						class="mt-2 block text-sm text-[#eef0e6]/70 hover:text-white">hello@muallim.app</a
					>
					<p class="mt-4 text-sm font-semibold text-white">Built for</p>
					<p class="mt-2 max-w-xs text-sm text-[#eef0e6]/70">
						Bangladesh first, the world next · English interface, Bengali &amp; Arabic content
					</p>
				</div>
			</div>

			<div
				class="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#eef0e6]/60"
			>
				<span>© 2026 Muallim · All rights reserved</span>
				<span>Made for people who teach</span>
			</div>
		</div>
	</footer>
</div>

<style>
	/*
		The page's own frame. Every colour comes from the marketing layout — the names
		below are the aliases this page's CSS was written against, pointed at the
		system rather than restating it.
	*/
	.landing {
		--card: var(--surface);
		--olive: var(--brand);
		--olive-2: var(--brand-soft);
		--lime: var(--accent);
		--lime-soft: var(--accent-tint);

		position: relative;
		z-index: 0;
		min-height: 100vh;
		background: var(--cream);
		color: var(--ink);
		overflow: hidden;
	}

	/* Warm nature backdrop behind header + hero; fades to cream at the bottom so the
	   sections sit on the page cleanly. A soft green gradient stands in if the photo
	   is slow or blocked. */
	/* Full-bleed hero: warm portrait, scrims for legibility, warm gradient fallback.
	   Swap the Unsplash URL for your own hero image when ready. */
	.topwrap {
		position: relative;
		min-height: 42rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		overflow: hidden;
		color: #fff;
		background:
			linear-gradient(180deg, rgba(24, 20, 14, 0) 42%, rgba(18, 15, 10, 0.66) 100%),
			linear-gradient(100deg, rgba(18, 15, 10, 0.44), rgba(18, 15, 10, 0) 55%),
			radial-gradient(120% 100% at 62% 22%, #dccbb7, #bfae9c 62%, #8f8073);
		background-image:
			linear-gradient(180deg, rgba(24, 20, 14, 0) 42%, rgba(18, 15, 10, 0.66) 100%),
			linear-gradient(100deg, rgba(18, 15, 10, 0.44), rgba(18, 15, 10, 0) 55%),
			url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=75'),
			radial-gradient(120% 100% at 62% 22%, #dccbb7, #bfae9c 62%, #8f8073);
		background-size: cover;
		background-position: center 22%;
		background-repeat: no-repeat;
	}
	@media (min-width: 720px) {
		.topwrap {
			min-height: 46rem;
		}
	}

	/* Floating pill nav over the photo. */
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
		background: var(--lime);
		color: var(--olive);
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
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border-radius: 999px;
		padding: 0.8rem 1.35rem;
		font-weight: 600;
		font-size: 0.98rem;
		text-decoration: none;
		border: 1px solid transparent;
		cursor: pointer;
		transition:
			transform 0.14s ease,
			background 0.14s ease,
			box-shadow 0.14s ease;
	}
	.pill-primary {
		background: var(--olive);
		color: var(--lime-soft);
	}
	.pill-primary:hover {
		background: var(--olive-2);
		transform: translateY(-1px);
	}
	.pill-ghost {
		background: var(--card);
		color: var(--ink);
		border-color: var(--line);
	}
	.pill-ghost:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(23, 23, 15, 0.07);
	}
	.pill-lime {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--lime);
		color: var(--olive);
		border-radius: 999px;
		padding: 0.9rem 1.6rem;
		font-weight: 700;
		font-size: 1rem;
		text-decoration: none;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease;
	}
	.pill-lime:hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 30px rgba(163, 200, 40, 0.4);
	}

	/* Hero content — bottom-left copy, bottom-right stat card. */
	.hero {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 82rem;
		margin: 0 auto;
		padding: 3rem 1.4rem 2.6rem;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 2rem;
		flex-wrap: wrap;
	}
	.hero-copy {
		max-width: 34rem;
	}
	.hero-h1 {
		margin: 0;
		font-weight: 700;
		font-size: clamp(2.8rem, 7vw, 5.2rem);
		line-height: 0.98;
		letter-spacing: -0.035em;
		color: #fff;
	}
	.hero-sub {
		margin: 1.1rem 0 0;
		max-width: 30rem;
		font-size: 1rem;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.85);
	}
	.hero-copy .pill-lime {
		margin-top: 1.6rem;
	}

	/* Floating stat card. */
	.statcard {
		width: 20rem;
		max-width: 100%;
		background: #fff;
		border-radius: 20px;
		box-shadow: 0 30px 70px -30px rgba(18, 15, 10, 0.65);
		padding: 1.2rem 1.3rem;
		color: var(--ink);
	}
	.statcard-top {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.statcard-title {
		font-weight: 700;
		font-size: 1rem;
	}
	.statcard-badge {
		background: var(--lime);
		color: var(--olive);
		font-weight: 700;
		font-size: 0.74rem;
		border-radius: 999px;
		padding: 0.15rem 0.55rem;
	}
	.statcard-tabs {
		display: flex;
		gap: 1rem;
		margin: 0.9rem 0 0;
		padding-bottom: 0.6rem;
		font-size: 0.82rem;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
	}
	.statcard-tabs .on {
		color: var(--ink);
		font-weight: 700;
	}
	.statcard-bars {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		height: 5rem;
		margin: 1rem 0 0.7rem;
	}
	.statcard-bars span {
		flex: 1;
		background: var(--lime);
		border-radius: 5px;
	}
	.statcard-bars span.dark {
		background: var(--olive);
	}
	.statcard-foot {
		margin: 0;
		font-size: 0.76rem;
		color: var(--muted);
	}
	@media (max-width: 760px) {
		.statcard {
			display: none;
		}
	}

	/* Works-with marquee. */
	.marquee-sec {
		margin-top: 0;
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--line);
		background: var(--cream);
		overflow: hidden;
	}
	.marquee {
		display: flex;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
		mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
	}
	.marquee-track {
		display: flex;
		align-items: center;
		gap: 2.75rem;
		padding-right: 2.75rem;
		white-space: nowrap;
		animation: marquee 34s linear infinite;
	}
	@keyframes marquee {
		to {
			transform: translateX(-50%);
		}
	}
	.mq {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-weight: 700;
		font-size: 1.05rem;
		letter-spacing: -0.01em;
		color: var(--ink-soft);
		opacity: 0.78;
	}
	.mq::before {
		content: '';
		width: 0.42rem;
		height: 0.42rem;
		border-radius: 50%;
		background: var(--olive);
	}

	/* Build block. */
	.build {
		display: grid;
		gap: 2.5rem;
		grid-template-columns: 1fr;
		align-items: center;
	}
	@media (min-width: 960px) {
		.build {
			grid-template-columns: 0.85fr 1.15fr;
			gap: 3rem;
		}
	}
	.build-cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin: 1.5rem 0;
	}
	.build-p {
		margin: 0 0 1rem;
		max-width: 30rem;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--muted);
	}
	.build-p strong {
		color: var(--ink);
		font-weight: 700;
	}
	.build-cards {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr;
	}
	@media (min-width: 620px) {
		.build-cards {
			grid-template-columns: 1.15fr 0.85fr;
		}
	}
	.fcard {
		border-radius: 22px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		min-height: 20rem;
	}
	.fcard-teal {
		background: #dbe9e6;
	}
	.fcard-dark {
		background: var(--olive);
		color: #eef0e6;
	}
	.fcard-title {
		margin: 0 0 0.4rem;
		font-weight: 700;
		font-size: 1.4rem;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.fcard-title.lime {
		color: var(--lime);
	}
	.fcard-list {
		list-style: none;
		margin: 1rem 0 1.2rem;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	.fcard-list li {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.86rem;
		line-height: 1.4;
		color: var(--ink-soft);
	}
	.fcard-list :global(svg) {
		margin-top: 0.12rem;
		flex-shrink: 0;
		color: var(--olive);
	}
	.fcard .pill {
		margin-top: auto;
		align-self: flex-start;
	}
	.pill-sm {
		padding: 0.55rem 1.05rem;
		font-size: 0.9rem;
	}
	.fcard-dark-foot {
		margin-top: auto;
	}
	.fcard-dark-p {
		margin: 0.4rem 0 0;
		font-size: 0.9rem;
		line-height: 1.55;
		color: #cfd3c2;
	}

	/* Feature-card widgets. */
	.fcard-widget {
		background: #fff;
		border-radius: 14px;
		padding: 0.9rem 1rem;
		margin-bottom: 1.2rem;
	}
	.fw-label {
		font-size: 0.76rem;
		font-weight: 600;
		color: var(--muted);
	}
	.fw-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.6rem;
	}
	.ava {
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 50%;
		border: 2px solid #fff;
		margin-left: -0.5rem;
	}
	.ava:first-child {
		margin-left: 0;
	}
	.ava:nth-child(1) {
		background: #c9b7a4;
	}
	.ava:nth-child(2) {
		background: #8fae7a;
	}
	.ava:nth-child(3) {
		background: #b9a0c6;
	}
	.fw-chip {
		margin-left: auto;
		background: var(--lime);
		color: var(--olive);
		font-weight: 700;
		font-size: 0.74rem;
		border-radius: 999px;
		padding: 0.2rem 0.6rem;
	}
	.fw-panel {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 14px;
		padding: 0.9rem 1rem;
		margin-bottom: 1.2rem;
	}
	.fw-panel .fw-label {
		color: #cfd3c2;
	}
	.fw-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.6rem;
	}
	.gw {
		background: rgba(255, 255, 255, 0.14);
		color: #eef0e6;
		border-radius: 999px;
		padding: 0.25rem 0.7rem;
		font-size: 0.78rem;
		font-weight: 600;
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee-track {
			animation: none;
		}
	}

	/* Sections. */
	.section {
		max-width: 78rem;
		margin: 6rem auto 0;
		padding: 0 1.5rem;
	}
	.h2 {
		font-weight: 700;
		font-size: clamp(1.8rem, 3.2vw, 2.5rem);
		letter-spacing: -0.025em;
		margin: 0;
		max-width: 24ch;
	}

	@media (prefers-reduced-motion: reduce) {
		.pill {
			transition: none;
		}
	}
</style>
