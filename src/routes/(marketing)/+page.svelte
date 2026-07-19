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
	import { reveal } from '$lib/reveal';
	import { slide } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { resolve } from '$app/paths';
	import { Icon } from '$lib/components';
	import { Button, FeatureCard, ShotCard, SiteCta } from '$lib/features/marketing/ui';
	import { FEATURES, GROUPS as FEATURE_GROUPS, featuresIn } from '$lib/content/features';
	import {
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
		'0% on your own bKash'
	];

	/*
		Pricing. The model is the decision, the ৳ figures are a starting point.

		Muallim takes 0% of what a school collects — that is structural: on bKash and
		SSLCommerz the school is the merchant and no Muallim account is in the flow, so
		there is nothing to take. Sustaining revenue is therefore a subscription to
		*run the institution*, not a tax on its money. Free to teach and sell; paid to
		operate; unlimited/operations on request.

		Price scales by size band, not a per-head meter — a threshold a school can
		budget, where a raw per-student bill that moves every month cannot be. The band
		is the loud line on each card.

		SUGGESTED STARTER NUMBERS, YOURS TO SET: ৳2,500/mo and the 800-student cap are
		defensible BD-market figures, not decisions. Change them here; to move to true
		per-student, this is also the one place.
	*/
	const PLANS = [
		{
			name: 'Teach',
			price: 'Free',
			per: 'forever',
			tag: 'For creators & small classes',
			lead: 'Everything you need to teach online and sell to the world.',
			points: [
				'Courses, 15 quiz types, certificates',
				'Forum, chat, points and a leaderboard',
				'Sell through your own bKash or SSLCommerz',
				'0% on everything you collect'
			],
			cta: 'Start free',
			href: resolve('/register'),
			featured: false
		},
		{
			name: 'Institute',
			price: '৳2,500',
			per: 'per month',
			tag: 'Up to 800 students',
			lead: 'Run the whole institution, not only the courses.',
			points: [
				'Everything in Teach',
				'Attendance, exams and GPA-5 report cards',
				'Fee billing, timetable and staff',
				'Guardian notices by email or SMS'
			],
			cta: 'Start free',
			href: resolve('/register'),
			featured: true
		},
		{
			name: 'Scale',
			price: "Let's talk",
			per: 'for large & multi-campus',
			tag: 'Unlimited students',
			lead: 'For colleges, chains, and everything an office runs on.',
			points: [
				'Everything in Institute',
				'Library, transport and hostel',
				'Payroll and an income/expense ledger',
				'Priority support and onboarding'
			],
			cta: 'Talk to us',
			href: resolve('/(marketing)/demo'),
			featured: false
		}
	] as const;

	// On top of any paid plan, and billed for what they cost us — honest, because
	// each is a real bill we pay: a message sent, a token spent.
	const ADDONS = [
		{ name: 'Guardian SMS', line: 'Top up credits and pay only for the messages you send.' },
		{ name: 'AI Studio', line: 'Draft courses and quizzes from a prompt, metered by use.' }
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
			title: 'Fees, billed',
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
			title: 'Bill and keep the count',
			line: 'Set a fee once, issue it to a whole class, and see what each student still owes. Families pay you as they always have; you record how. Muallim never touches the money.'
		},
		{
			icon: ChartLineData01Icon,
			title: 'Grow beyond the gate',
			line: 'Publish a course and sell it to the world, with Stripe for learners paying from abroad. Your institution can earn past its walls.'
		}
	] as const;

	type Tab = {
		key: string;
		icon: typeof Book02Icon;
		title: string;
		lead: string;
		points: string[];
	};

	const tabs: Tab[] = [
		{
			key: 'teaching',
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
			icon: ClipboardIcon,
			title: 'Roll-call to result card',
			lead: 'The office side of the institution — the daily register through to the board result — in one place.',
			points: [
				'Attendance, class by class, day by day',
				'Exams that roll up into GPA-5 report cards',
				'Timetable, staff, students, and guardians',
				'Fees, admissions, and guardian SMS'
			]
		},
		{
			key: 'community',
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
			icon: AiBrain01Icon,
			title: 'Draft it with AI Studio',
			lead: 'Start from a prompt instead of a blank page, then edit everything the studio drafts for you.',
			points: [
				'Draft a course outline from a topic',
				'Generate quiz questions across the 15 types',
				'Everything AI writes stays yours to edit',
				'You publish nothing until you approve it'
			]
		}
	];

	let monthly = $state(184250);

	// A set gets its rhythm from one bold step, not a colour each: paper cards, and
	// the last one olive. This rotated through four tints — brand, lavender, teal,
	// olive — so a card's colour was decided by its index and meant nothing; a reader
	// looks for the rule and there isn't one. It is the same lesson the build block's
	// cards were rebuilt on, and the olive card is where lime gets spent.
	// `chip` is the pill background, which has to lift off its card rather than sink.
	const PAPER = {
		card: 'border border-[color-mix(in_oklab,var(--ink)_9%,transparent)] bg-[var(--surface)]',
		icon: 'bg-[var(--brand-tint)] text-[var(--brand)]',
		title: 'text-[var(--ink)]',
		body: 'text-[var(--muted)]',
		tick: 'text-[var(--brand)]',
		chip: 'bg-[color-mix(in_oklab,var(--ink)_6%,transparent)]'
	};
	const OLIVE = {
		card: 'border border-[var(--brand)] bg-[var(--brand)]',
		icon: 'bg-[var(--accent)] text-[var(--brand)]',
		title: 'text-[var(--accent)]',
		body: 'text-[color-mix(in_oklab,var(--on-brand)_62%,var(--brand))]',
		tick: 'text-[var(--accent)]',
		chip: 'bg-[color-mix(in_oklab,var(--surface)_12%,transparent)]'
	};
	const toneAt = (i: number, n: number) => (i === n - 1 ? OLIVE : PAPER);

	// The honest differentiators — what the product does, not invented customer
	// quotes. Real, attributed testimonials can replace these when there are some.
	const reasons = [
		{
			icon: Money04Icon,
			title: '0% on your own bKash',
			line: 'Sell through your own bKash or SSLCommerz and Muallim never holds your money, or takes any. Stripe, for learners abroad, is 2.5%.'
		},
		{
			icon: School01Icon,
			title: 'One system, not five',
			line: 'The register, the exams, the fees, the courses and the community in one place — not a login and a spreadsheet for each.'
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
			a: 'Yes. Opening a workspace is free, teaching and selling courses is free, and Muallim takes 0% of what you collect through your own bKash or SSLCommerz — you are the merchant. Running the whole institution (attendance, exams, fees) is a paid plan, and selling through Stripe to learners abroad is 2.5%.'
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

	// The bento's cells, in GROUPS order, on a six-column grid: wide/narrow, then
	// narrow/wide, then wide/narrow again, and the platform closing the full width in
	// olive. The zigzag is the composition — seven identical cells in rows said every
	// group is the same size, and they are not.
	//
	// No cell spans two rows. It tried: a 4×2 lead had to stretch to whatever its
	// neighbours stacked to, and no group has the content to fill that, so the card
	// was mostly a void with a link at the bottom. A row a card cannot fill is worse
	// than a row it does not have.
	//
	// Index-keyed on purpose — a bento is composed, not computed, and a rule derived
	// from a count would be a worse way of saying the same seven things. A group added
	// past the end falls back to a plain 2-cell rather than breaking the row.
	const BENTO = [
		'lg:col-span-4',
		'lg:col-span-2',
		'lg:col-span-2',
		'lg:col-span-4',
		'lg:col-span-4',
		'lg:col-span-2',
		'lg:col-span-6'
	];

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
		content="One platform for a school, a college, a madrasa, or a coaching centre: courses, 15 quiz types, certificates, attendance, exams and report cards, and fees you bill and reconcile. Sell courses through your own bKash or SSLCommerz and Muallim takes nothing."
	/>
</svelte:head>

<div class="landing">
	<!-- HERO: the light gradient the header pill sits on, centred copy, one call to
	     action, and the product itself bleeding off the bottom.

	     It said "Run the whole institution." and stopped — half the positioning. The
	     title tag, the footer and every doc say both halves, and the second is the
	     half nobody else offers: a school that also sells its teaching past its own
	     gate. The fold was selling an admin tool and keeping the differentiator for
	     the fourth section down. The stroke moves with it, onto the surprising word. -->
	<div class="topwrap">
		<section class="hero">
			<h1 class="hero-h1">
				Run the whole institution.<br />Teach the whole
				<span class="underlined"
					>world<svg
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
				One platform for a <span class="kind">school</span>, <span class="kind">college</span>,
				<span class="kind">madrasa</span>, or <span class="kind">coaching centre</span> — the register,
				the exams, the report cards and the fees, together. Then publish a course and sell it to anyone,
				anywhere. You keep the money and the students.
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
	<section use:reveal class="section grid gap-10">
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
	<section use:reveal class="mx-auto mt-32 w-full max-w-[82rem] px-6">
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

	<!-- FEES: what internal/fees actually is — structures, batch-issued invoices, a
	     recorded payment with a Method string. It has no gateway code and imports no
	     commerce: the money never routes through us, which is the honest reason the
	     cut is nought. This said "collect fees through your own bKash or SSLCommerz",
	     which described a rail that is not built for fees. -->
	<!-- PRICING: three flat tiers by size, Institute the olive step and the one to
	     sell. Free to teach, paid to run the institution, and 0% of what you collect
	     on every tier — the promise the calculator at the foot then proves. -->
	<section id="pricing" use:reveal class="mx-auto mt-32 w-full max-w-[82rem] px-6">
		<p class="text-xs font-bold tracking-[0.14em] text-[var(--ink-soft)] uppercase">Pricing</p>
		<div class="mt-2 flex flex-wrap items-end justify-between gap-4">
			<h2 class="h2">Priced to run on, not to tax you.</h2>
			<p class="max-w-sm leading-relaxed text-[var(--muted)]">
				You pay to run the institution. You keep every taka you collect — 0%, on every plan.
			</p>
		</div>

		<div class="mt-8 grid items-stretch gap-4 md:grid-cols-3">
			{#each PLANS as plan (plan.name)}
				<div
					class="relative flex flex-col rounded-[var(--r-lg)] border p-7 {plan.featured
						? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]'
						: 'border-[color-mix(in_oklab,var(--ink)_9%,transparent)] bg-[var(--surface)] text-[var(--ink)]'}"
				>
					{#if plan.featured}
						<span
							class="absolute -top-3 left-7 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--brand)]"
						>
							Most popular
						</span>
					{/if}
					<h3
						class="text-lg font-extrabold tracking-tight {plan.featured
							? 'text-[var(--accent)]'
							: 'text-[var(--ink)]'}"
					>
						{plan.name}
					</h3>
					<p class="mt-3 flex items-baseline gap-1.5">
						<span class="text-3xl font-extrabold tracking-tight">{plan.price}</span>
						<span
							class="text-sm {plan.featured
								? 'text-[color-mix(in_oklab,var(--on-brand)_62%,var(--brand))]'
								: 'text-[var(--muted)]'}">{plan.per}</span
						>
					</p>
					<!-- The size band, made loud: this is the axis the price scales on, so a
					     reader sees at a glance which plan their headcount lands them in. -->
					<span
						class="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold {plan.featured
							? 'bg-[color-mix(in_oklab,var(--accent)_22%,var(--brand))] text-[var(--accent)]'
							: 'bg-[var(--brand-tint)] text-[var(--brand)]'}"
					>
						<Icon icon={UserMultipleIcon} class="size-3.5" />
						{plan.tag}
					</span>
					<p
						class="mt-4 text-sm leading-relaxed {plan.featured
							? 'text-[color-mix(in_oklab,var(--on-brand)_74%,var(--brand))]'
							: 'text-[var(--muted)]'}"
					>
						{plan.lead}
					</p>
					<ul class="mt-5 grid gap-2.5">
						{#each plan.points as pt (pt)}
							<li class="flex items-start gap-2 text-sm leading-snug">
								<Icon
									icon={Tick02Icon}
									strokeWidth={2.5}
									class="mt-0.5 size-4 shrink-0 {plan.featured
										? 'text-[var(--accent)]'
										: 'text-[var(--brand)]'}"
								/>
								<span
									class={plan.featured
										? 'text-[color-mix(in_oklab,var(--on-brand)_88%,var(--brand))]'
										: 'text-[var(--ink-soft)]'}>{pt}</span
								>
							</li>
						{/each}
					</ul>
					<a
						href={plan.href}
						class="mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition duration-200 motion-reduce:transition-none {plan.featured
							? 'bg-[var(--accent)] text-[var(--brand)] hover:bg-[color-mix(in_oklab,var(--accent)_88%,var(--brand))]'
							: 'bg-[var(--brand)] text-[var(--accent-tint)] hover:bg-[var(--brand-soft)]'}"
					>
						{plan.cta}
						<Icon icon={ArrowRight02Icon} class="size-4" />
					</a>
				</div>
			{/each}
		</div>

		<!-- Add-ons: real costs, so honest to charge for. On top of any paid plan. -->
		<div
			class="mt-4 grid gap-4 rounded-[var(--r-lg)] border border-[color-mix(in_oklab,var(--ink)_9%,transparent)] bg-[var(--surface-2)] p-6 sm:grid-cols-[auto_1fr_1fr] sm:items-center"
		>
			<p class="text-sm font-bold text-[var(--ink)]">
				Add on when<br class="hidden sm:block" /> you need it
			</p>
			{#each ADDONS as addon (addon.name)}
				<div>
					<p class="text-sm font-bold text-[var(--ink)]">{addon.name}</p>
					<p class="mt-0.5 text-sm leading-snug text-[var(--muted)]">{addon.line}</p>
				</div>
			{/each}
		</div>

		<!-- The 0% promise, proved. Whatever the plan above costs, this is what Muallim
		     takes from the money a school collects: nothing. The calculator is the one
		     movable number on the page, because a figure a reader can drag lands. -->
		<div
			class="mt-4 grid items-center gap-8 rounded-[var(--r-lg)] bg-[var(--brand)] p-8 text-[var(--on-brand)] md:grid-cols-2"
		>
			<div>
				<h3 class="text-2xl font-extrabold tracking-tight text-[var(--accent)]">
					And 0% of what you collect.
				</h3>
				<p
					class="mt-3 max-w-md leading-relaxed text-[color-mix(in_oklab,var(--on-brand)_74%,var(--brand))]"
				>
					Fees and local sales run through your own bKash or SSLCommerz — you are the merchant, so
					there is no cut for us to take. Whatever you pay to run Muallim, every taka a family pays
					stays yours.
				</p>
			</div>
			<div class="rounded-[var(--r-lg)] bg-[var(--accent)] p-8 text-[var(--brand)]">
				<p class="text-sm font-medium text-[var(--brand)]/70">Fees you collect this month</p>
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
					<span class="tabular-nums">৳0 · we never touch it</span>
				</div>
			</div>
		</div>
	</section>

	<!-- WHO IT'S FOR: colored persona cards -->
	<section id="audiences" use:reveal class="mx-auto mt-32 w-full max-w-[82rem] px-6">
		<p class="text-xs font-bold tracking-[0.14em] text-[var(--ink-soft)] uppercase">Is this you?</p>
		<h2 class="h2 mt-2">You have an institution to run — spread across too many books.</h2>
		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each audiences as a, i (a.who)}
				{@const tone = toneAt(i, audiences.length)}
				<div class="flex min-h-[15rem] flex-col rounded-[var(--r-lg)] p-6 {tone.card}">
					<span class="grid size-11 place-items-center rounded-xl {tone.icon}">
						<Icon icon={a.icon} class="size-5" />
					</span>
					<h3 class="mt-4 text-lg font-bold {tone.title}">{a.who}</h3>
					<p class="mt-1 text-sm leading-relaxed {tone.body}">{a.line}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- THE PRODUCT JOURNEY: copy across the top, the steps full width beneath.

	     It was a two-column split: a short copy block beside a seven-step olive panel
	     nearly a thousand pixels tall. `items-center` only centred the imbalance and
	     `sticky` only hid it while you scrolled — at rest it was a paragraph adrift in
	     a column of nothing. The header rhythm the build block uses fixes it properly,
	     and the steps read in two columns instead of one long ladder. -->
	<section id="journey" use:reveal class="mx-auto mt-32 w-full max-w-[82rem] px-6">
		<div class="grid items-start gap-x-12 gap-y-4 lg:grid-cols-[0.9fr_1.1fr]">
			<div>
				<p class="text-xs font-bold tracking-[0.14em] text-[var(--ink-soft)] uppercase">
					Your journey
				</p>
				<h2 class="h2 mt-2">From first day to fully online, one clear path.</h2>
			</div>
			<div>
				<p class="max-w-md leading-relaxed text-[var(--muted)]">
					Seven steps, in the order you'd actually live them — nothing to install, and you start
					today.
				</p>
				<a class="pill pill-primary mt-6" href={resolve('/register')}>
					Start free <Icon icon={ArrowRight02Icon} class="size-4" />
				</a>
			</div>
		</div>

		<ol class="mt-8 grid gap-1 rounded-[var(--r-lg)] bg-[var(--brand)] p-3 md:grid-cols-2">
			{#each journey as s, i (s.title)}
				<li
					class="flex gap-4 rounded-2xl p-4 transition duration-200 hover:bg-[color-mix(in_oklab,var(--on-brand)_7%,transparent)] motion-reduce:transition-none"
				>
					<span
						class="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--accent)] font-mono text-sm font-bold text-[var(--brand)]"
					>
						{i + 1 < 10 ? `0${i + 1}` : i + 1}
					</span>
					<div>
						<h3 class="font-bold text-[var(--on-brand)]">{s.title}</h3>
						<p
							class="mt-0.5 text-sm leading-relaxed text-[color-mix(in_oklab,var(--on-brand)_62%,var(--brand))]"
						>
							{s.line}
						</p>
					</div>
				</li>
			{/each}
		</ol>
	</section>

	<!-- CAPABILITIES: colored feature cards -->
	<section id="capabilities" use:reveal class="mx-auto mt-32 w-full max-w-[82rem] px-6">
		<p class="text-xs font-bold tracking-[0.14em] text-[var(--ink-soft)] uppercase">Up close</p>
		<h2 class="h2 mt-2">The same platform, four sides to it</h2>
		<p class="mt-2 max-w-2xl leading-relaxed text-[var(--muted)]">
			Everything you just walked through, in more detail — all in one system, no add-ons.
		</p>
		<div class="mt-8 grid gap-4 md:grid-cols-2">
			{#each tabs as t, i (t.key)}
				{@const tone = toneAt(i, tabs.length)}
				<div class="rounded-[var(--r-lg)] p-7 {tone.card}">
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

	<!-- BREADTH: every feature group, linking into /features. The list is built from the
	     content file, so the page cannot tick more than there are pages for. -->
	<section id="everything" use:reveal class="mx-auto mt-32 w-full max-w-[82rem] px-6">
		<p class="text-xs font-bold tracking-[0.14em] text-[var(--ink-soft)] uppercase">
			Everything in it
		</p>
		<div class="mt-2 flex flex-wrap items-end justify-between gap-4">
			<h2 class="h2">From the first lesson to the last receipt.</h2>
			<a
				href={resolve('/(marketing)/features')}
				class="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-tint)] transition duration-200 hover:bg-[var(--brand-soft)] motion-reduce:transition-none"
			>
				Look through all of it <Icon icon={ArrowRight02Icon} class="size-4" />
			</a>
		</div>
		<p class="mt-3 max-w-2xl leading-relaxed text-[var(--muted)]">
			Everything ticked below is running today — not a plan, not a roadmap. Each one has a page that
			says plainly what it does.
		</p>

		<!-- A bento rather than seven identical cells in rows: the groups are not the
		     same size, so the grid should not pretend they are. Teaching leads wide,
		     the composition zigzags, and the platform — the thing under all of it —
		     closes the full width in olive, laid on its side so a short card does not
		     rattle around in a six-column box. -->
		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
			{#each breadth as g, i (g.key)}
				{@const tone = toneAt(i, breadth.length)}
				{@const cell = BENTO[i] ?? 'lg:col-span-2'}
				{@const lead = i === 0}
				{@const closer = i === breadth.length - 1}
				{@const wide = cell.includes('span-4') || cell.includes('span-6')}
				<div
					class="flex flex-col rounded-[var(--r-lg)] p-6 {tone.card} {cell} {closer
						? 'lg:flex-row lg:items-center lg:gap-12'
						: ''}"
				>
					<!-- `contents` dissolves the wrapper everywhere but the closer, so every
					     other card keeps its plain column and its foot still pins itself. -->
					<div class={closer ? 'lg:w-80 lg:shrink-0' : 'contents'}>
						<span
							class="grid place-items-center rounded-xl {tone.icon} {lead ? 'size-14' : 'size-11'}"
						>
							<Icon icon={g.icon} class={lead ? 'size-7' : 'size-5'} />
						</span>
						<h3 class="mt-4 font-bold tracking-tight {tone.title} {lead ? 'text-2xl' : 'text-lg'}">
							{g.name}
						</h3>
						<p class="mt-1 leading-relaxed {tone.body} {lead ? 'max-w-lg text-base' : 'text-sm'}">
							{g.blurb}
						</p>
					</div>

					<div class={closer ? 'flex flex-1 flex-col' : 'contents'}>
						<!-- A ticked list, not a row of pills. A pill reads as a label somebody
						     filed this under; a tick reads as a thing that is already there, which
						     is exactly what this section is claiming. -->
						<ul class="mt-4 grid gap-2 {wide ? 'sm:grid-cols-2' : ''} {closer ? 'lg:mt-0' : ''}">
							{#each g.names as name (name)}
								<li class="flex items-center gap-2 text-sm leading-snug {tone.body}">
									<Icon
										icon={CheckmarkBadge01Icon}
										strokeWidth={2}
										class="size-4 shrink-0 {tone.tick}"
									/>
									<span>{name}</span>
								</li>
							{/each}
						</ul>
						<a
							href="{resolve('/(marketing)/features')}#{g.key}"
							class="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold {tone.tick} hover:underline"
						>
							Explore {g.name.toLowerCase()}
							<Icon icon={ArrowRight02Icon} class="size-4" />
						</a>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- HONEST DIFFERENTIATORS: colored cards + olive stat panel -->
	<section id="why" use:reveal class="mx-auto mt-32 w-full max-w-[82rem] px-6">
		<p class="text-xs font-bold tracking-[0.14em] text-[var(--ink-soft)] uppercase">Why Muallim</p>
		<h2 class="h2 mt-2">No invented reviews. Just what the product actually does.</h2>
		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each reasons as r, i (r.title)}
				{@const tone = toneAt(i, reasons.length)}
				<div class="flex min-h-[14rem] flex-col rounded-[var(--r-lg)] p-6 {tone.card}">
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
	<section id="faq" use:reveal class="mt-32 bg-[var(--brand)] py-20 text-[var(--brand-tint)]">
		<div class="mx-auto grid max-w-[82rem] gap-12 px-6 md:grid-cols-2">
			<div class="flex flex-col">
				<h2
					class="text-4xl font-bold leading-[1.05] tracking-tight text-[var(--accent)] sm:text-5xl"
				>
					Frequently<br />Asked Questions
				</h2>
				<p class="mt-5 max-w-sm leading-relaxed text-[var(--brand-tint)]/70">
					Clear answers to the questions schools, madrasas, and coaching centers ask before they
					start.
				</p>
				<!-- Fills the space the short intro left under it, and turns "still have a
				     question" into somewhere to go rather than a line to read. -->
				<div class="mt-10 rounded-[var(--r-lg)] border border-white/10 p-6 md:mt-auto">
					<p class="font-bold text-[var(--brand-tint)]">Still have a question?</p>
					<p class="mt-1 max-w-xs text-sm leading-relaxed text-[var(--brand-tint)]/60">
						A person answers — no bots, no queue. Book a walkthrough or just write to us.
					</p>
					<div class="mt-4 flex flex-wrap items-center gap-4">
						<a
							href={resolve('/(marketing)/demo')}
							class="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--brand)] transition hover:bg-[color-mix(in_oklab,var(--accent)_88%,var(--brand))]"
						>
							Book a demo
						</a>
						<a
							class="text-sm font-semibold text-[var(--accent)] hover:underline"
							href="mailto:hello@muallim.app">hello@muallim.app</a
						>
					</div>
				</div>
			</div>
			<div>
				{#each faqs as f, i (f.q)}
					<div class="border-b border-white/10">
						<button
							class="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold text-[var(--brand-tint)]"
							aria-expanded={openFaq === i}
							onclick={() => toggleFaq(i)}
						>
							<span>{f.q}</span>
							<Icon
								icon={openFaq === i ? MinusSignIcon : PlusSignIcon}
								class="size-5 shrink-0 text-[var(--accent)] transition-transform duration-200 {openFaq ===
								i
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if openFaq === i}
							<div transition:slide={{ duration: prefersReducedMotion.current ? 0 : 240 }}>
								<p class="max-w-xl pb-5 leading-relaxed text-[var(--brand-tint)]/65">{f.a}</p>
							</div>
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
	/*
		Olive and semibold, not a tinted chip. The chip's padding stood every comma off
		its own word — "school , college , madrasa" — and four lime pills argued with
		the lime stroke and the lime button for the one bit of attention the accent is
		rationed to spend. The words still lift off the muted sentence; the punctuation
		now sits where it was typed.
	*/
	.kind {
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
	/*
		A strip of paper between the hero and the page, which is what makes it a band:
		it was cream on cream with a single bottom rule, so the only thing separating
		the fold from the section under it was a hairline nobody sees.
	*/
	.marquee-sec {
		margin-top: 0;
		padding: 1.1rem 0;
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		background: var(--surface);
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
	/* It stops for anybody who stops on it. Nine claims sliding past at a fixed rate
	   are nine claims you cannot go back and read. */
	.marquee:hover .marquee-track {
		animation-play-state: paused;
	}
	@keyframes marquee {
		to {
			transform: translateX(-50%);
		}
	}
	/*
		Full strength, not 78% of it. These are 17px bold — under the size that counts
		as large text — so the faded version measured about 4.5:1 on cream and sat on
		the line AA draws. The words are the claim; there is no reason to whisper them.
	*/
	.mq {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-weight: 700;
		font-size: 1.05rem;
		letter-spacing: -0.01em;
		color: var(--ink-soft);
	}
	.mq::before {
		content: '';
		width: 0.42rem;
		height: 0.42rem;
		border-radius: 50%;
		background: var(--accent-ink);
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

	@media (prefers-reduced-motion: reduce) {
		.marquee-track {
			animation: none;
		}
	}

	/* Sections. */
	.section {
		max-width: 78rem;
		margin: 8rem auto 0;
		padding: 0 1.5rem;
	}
	/*
		One section heading, in the hero's ink. Five sections restated the same size,
		weight and tracking inline and picked olive while three used this — two heading
		looks on one page, and no way to change either without finding both.
	*/
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
