<script lang="ts">
	/**
	 * The landing: one dark header pill on a light hero gradient, centred copy, a
	 * single call to action, and the product itself bleeding off the fold below it.
	 * Olive and lime, big rounded cards. The tokens are the marketing layout's —
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
	import { Button, FeatureCard, ShotCard, SiteCta } from '$lib/features/marketing/ui';
	import { FEATURES, GROUPS as FEATURE_GROUPS, featuresIn } from '$lib/content/features';
	import {
		ArrowLeft01Icon,
		ArrowRight01Icon,
		ArrowRight02Icon,
		Tick02Icon,
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

	// The four cards under the build heading. Each links to the feature page that
	// proves it — a "learn more" with nowhere to go is the affordance lying.
	const BUILD_CARDS = [
		{
			title: 'Take the register,',
			tail: 'class by class',
			kind: 'clipboard',
			href: resolve('/(marketing)/features/[slug]', { slug: 'attendance' }),
			label: 'Learn more about attendance'
		},
		{
			title: 'Exams, marked',
			tail: 'and reported',
			kind: 'medal',
			href: resolve('/(marketing)/features/[slug]', { slug: 'exams-and-report-cards' }),
			label: 'Learn more about exams and report cards'
		},
		{
			title: 'Fees, collected',
			tail: 'and reconciled',
			kind: 'note',
			href: resolve('/(marketing)/features/[slug]', { slug: 'fees' }),
			label: 'Learn more about fees'
		},
		{
			title: 'Teach beyond',
			tail: 'the gate',
			kind: 'plane',
			tone: 'dark',
			href: resolve('/(marketing)/features/[slug]', { slug: 'payments' }),
			label: 'Learn more about selling courses'
		}
	] as const;

	// Screens of the running app, captioned with what is actually in them. Every
	// caption was written from the picture, not from the plan — the landing this
	// replaced invented a GPA and a register nobody had ever marked.
	const SHOTS = [
		{
			src: '/marketing/course.webp',
			alt: "A course page in Muallim: “Medicine: The Canon”, marked Expert, rated 4.0 from 2 ratings with 12 learners, created by Ibn al-Haytham. A “Preview this course” panel sits beside the learner's progress at 0 of 12 lessons.",
			title: 'Every course, its own page',
			line: 'A preview before enrolling, progress, notes and highlights, and lessons that open on their own dates.'
		},
		{
			src: '/marketing/grading.webp',
			alt: 'The Grading scales screen: a built-in Default scale banding A at 90%, B at 80%, C at 70%, D at 60% and F at 0%, beside a form building a new scale with a live Pass/Fail preview.',
			title: 'Grade on your own scale',
			line: 'Turn a percentage into a letter. A course grades by the workspace default until you point it at a scale you named yourself.'
		},
		{
			src: '/marketing/forum.webp',
			alt: 'The General discussion forum: two threads — “Welcome to the community” with 3 replies and “Anyone up for a study group?” with 2 — each showing its author and when it was last answered.',
			title: 'A room to ask in',
			line: 'Threaded discussion across the workspace and inside every course, so a question gets answered once.'
		}
	] as const;

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

	let monthly = $state(184250);

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
	<!-- HERO: the light gradient the header pill sits on, centred copy, one call to
	     action, and the product itself bleeding off the bottom. -->
	<div class="topwrap">
		<section class="hero">
			<h1 class="hero-h1">
				Run the whole<br /><span class="underlined"
					>institution<svg
						class="swoosh"
						viewBox="0 0 200 10"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<path d="M3 7.2C42 2.6 86 8.4 120 4.6 150 1.4 178 5 197 3.2" />
					</svg></span
				>.
			</h1>
			<p class="hero-sub">
				One platform to run a <span class="kind">school</span>, <span class="kind">college</span>,
				<span class="kind">madrasa</span>, or <span class="kind">coaching centre</span> — and teach the
				world online. Attendance, exams, report cards, and fees, together. You keep the money and the
				students.
			</p>
			<Button href={resolve('/register')} variant="lime">
				Get started <Icon icon={ArrowRight02Icon} class="size-5" />
			</Button>
			<div class="hero-frame">
				<img
					class="hero-shot"
					src="/marketing/dashboard.webp"
					alt="A learner's Muallim dashboard: a “Welcome back” greeting, courses in progress, lessons completed, average progress, and a calendar."
					width="2360"
					height="1342"
				/>
			</div>
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
	<section class="section grid gap-10">
		<!-- The copy reads once across the top; the cards carry the rest. -->
		<div class="grid items-start gap-x-12 lg:grid-cols-[0.9fr_1.1fr]">
			<h2 class="h2 lg:row-span-2">Built for how your institution actually runs</h2>
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

		<div class="grid gap-4 md:grid-cols-2">
			{#each BUILD_CARDS as c (c.href)}
				<FeatureCard
					title={c.title}
					tail={c.tail}
					kind={c.kind}
					tone={'tone' in c ? c.tone : 'paper'}
					href={c.href}
					label={c.label}
				/>
			{/each}
		</div>
	</section>

	<!-- SEE IT RUNNING: real screenshots, one call to action. The three cards this
	     replaced drew the UI in HTML — a GPA nobody earned, a register nobody teaches —
	     behind a stock photo of strangers, and repeated the build block's topics besides. -->
	<section class="mx-auto mt-24 w-full max-w-[82rem] px-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<h2 class="h2">See it running</h2>
			<a
				href="#capabilities"
				class="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition duration-200 hover:bg-[var(--brand-tint)] motion-reduce:transition-none"
			>
				Learn more <Icon icon={ArrowRight02Icon} class="size-4" />
			</a>
		</div>

		<div class="mt-8 grid gap-4 md:grid-cols-3">
			{#each SHOTS as s (s.src)}
				<ShotCard src={s.src} alt={s.alt} title={s.title} line={s.line} />
			{/each}
		</div>
	</section>

	<!-- FEE TRANSPARENCY: copy + the "what you keep" slider. The claim here is scoped
	     to fees collected through the school's own bKash or SSLCommerz, where no
	     platform account exists and our cut is structurally zero. Selling a course
	     through Stripe is a different number — see MUALLIM_PLATFORM_FEE_BPS. -->
	<section class="mx-auto mt-24 w-full max-w-[82rem] px-6">
		<div class="grid items-center gap-10 md:grid-cols-2">
			<div>
				<h2 class="h2">One clear price.<br />No hidden cut.</h2>
				<p class="mt-5 max-w-md leading-relaxed text-[var(--muted)]">
					You collect fees through your own bKash or SSLCommerz account, so Muallim never holds your
					money. The only fee is the one bKash or SSLCommerz charges — Muallim takes 0%.
				</p>
				<a class="pill pill-primary mt-6" href={resolve('/register')}>
					Start free <Icon icon={ArrowRight02Icon} class="size-4" />
				</a>
			</div>

			<!-- The one lime field on the page: a number a reader can move is the thing
			     that should catch their eye here. -->
			<div class="rounded-[var(--r-lg)] bg-[var(--accent)] p-8 text-[var(--brand)]">
				<p class="text-lg font-semibold">Fee calculator</p>
				<div class="mt-4 h-px w-full bg-[var(--brand)]/20"></div>
				<p class="mt-6 text-sm font-medium text-[var(--brand)]/70">Fees you collect this month</p>
				<p class="mt-1 text-5xl font-bold tracking-tight tabular-nums">{taka(monthly)}</p>
				<input
					type="range"
					min="20000"
					max="1000000"
					step="5000"
					bind:value={monthly}
					aria-label="Fees collected this month"
					class="mt-5 h-5 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-9 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--brand)] [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[var(--brand)]/20 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--brand)]/20 [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--brand)]"
				/>
				<div class="mt-5 h-px w-full bg-[var(--brand)]/20"></div>
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

	<SiteCta />

	<!-- FOOTER: dark-olive rounded card, on the same lime the CTA gradient ends on -->
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

	/* The hero band: the shared light gradient, near-white where the header pill sits
	   and warm low down. `overflow: hidden` is what crops the screenshot. */
	.topwrap {
		position: relative;
		/* The header floats out of the flow above this, so the hero reserves its band
		   rather than sliding up underneath it. */
		padding-top: 5.2rem;
		/* Tall enough that the screenshot is always cut by the fold, short viewport or
		   not — that crop is what says the product goes on past the page. */
		min-height: 100svh;
		display: flex;
		overflow: hidden;
		background: var(--hero-backdrop);
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
	/* Hero content — centred copy, one button, the product below it. */
	.hero {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 72rem;
		margin: 0 auto;
		padding: 3rem 1.4rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	/* The button holds the gap open; the shot's auto margin above it takes whatever
	   height is left, so the shot always lands on the band's bottom edge. */
	.hero :global(.btn) {
		margin-bottom: 3.4rem;
	}
	.hero-h1 {
		margin: 0;
		font-weight: 700;
		font-size: clamp(2.6rem, 7vw, 5rem);
		line-height: 0.98;
		letter-spacing: -0.035em;
		color: var(--ink);
	}

	/*
		The lime stroke under the word the whole page turns on. Drawn as a pseudo
		element rather than an underline so it can sit low, run wide of the letters,
		and keep its weight as the headline scales.
	*/
	.underlined {
		position: relative;
		white-space: nowrap;
	}
	/*
		Drawn, not ruled: a line that lifts a little to the right, the way a hand does.
		`preserveAspectRatio: none` stretches it to whatever the word measures, and
		non-scaling-stroke keeps the nib's weight while it does.
	*/
	.swoosh {
		position: absolute;
		bottom: -0.1em;
		left: -0.06em;
		/* Sized to the word, not to itself. An SVG left on `auto` takes its width from
		   its viewBox ratio times its height and overshoots the letters it underlines. */
		width: calc(100% + 0.12em);
		height: 0.3em;
		overflow: visible;
	}
	.swoosh path {
		fill: none;
		stroke: var(--accent);
		stroke-width: 7;
		stroke-linecap: round;
		vector-effect: non-scaling-stroke;
	}

	/* The four kinds of institution, each its own thing rather than a list of words
	   the eye slides over. */
	.kind {
		padding: 0.06em 0.3em;
		border-radius: 0.4em;
		background: var(--accent-tint);
		color: var(--brand);
		font-weight: 600;
		white-space: nowrap;
	}
	.hero-sub {
		margin: 2.4rem 0 2rem;
		max-width: 38rem;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--muted);
	}
	/* Cropped by .topwrap: the screenshot runs off the bottom of the band rather than
	   ending on it, so the page keeps going. */
	/*
		The pane the screenshot sits in: a hair of padding and a see-through paper fill,
		so the picture has a border that is part of the page rather than a line drawn
		around it — the gradient carries on through the glass.
	*/
	.hero-frame {
		width: 100%;
		max-width: 64rem;
		margin-top: auto;
		margin-bottom: -5rem;
		padding: 0.6rem;
		border: 1px solid var(--frame-line);
		border-radius: calc(var(--r-lg) + 0.6rem);
		background: var(--frame);
		backdrop-filter: blur(14px) saturate(1.1);
		box-shadow: 0 40px 90px -40px rgba(23, 23, 15, 0.45);
	}
	.hero-shot {
		display: block;
		width: 100%;
		height: auto;
		border-radius: var(--r-lg);
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

	/* Build block: only the paragraph survives as scoped CSS — the rest is Tailwind. */
	.build-p {
		margin: 0 0 1rem;
		max-width: 34rem;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--muted);
	}
	.build-p strong {
		color: var(--ink);
		font-weight: 700;
	}

	/* Feature-card widgets. */
	.ava:nth-child(2) {
		background: #8fae7a;
	}
	.fw-panel .fw-label {
		color: #cfd3c2;
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
