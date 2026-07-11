<script lang="ts">
	import { resolve } from '$app/paths';
	import { fade, slide } from 'svelte/transition';
	import { ArrowRight01Icon, SparklesIcon, Tick02Icon } from '@hugeicons/core-free-icons';
	import {
		AuroraBackdrop,
		Badge,
		Button,
		Card,
		Icon,
		MarketingFooter,
		MarketingHeader,
		PageAurora,
		Progress,
		Score,
		Verdict
	} from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import { SEGMENTS } from '$lib/content/segments';
	import {
		AI_FEATURES,
		FAQS,
		FEATURES,
		LOGOS,
		MORE_FEATURES,
		PLANS,
		STEPS
	} from '$lib/content/landing';

	const QUEUE = [
		{ who: 'Fatima al-Fihri', what: 'Chapter one · attempt 2', left: 1 },
		{ who: 'Maryam al-Astrulabi', what: 'Chapter one · attempt 1', left: 2 }
	];

	const BOARD = [
		{ who: 'Ibn al-Haytham', points: 940 },
		{ who: 'Al-Biruni', points: 880 },
		{ who: 'Al-Khwarizmi', points: 815 }
	];

	// Placeholder photo (Unsplash) — swap for a licensed image before launch.
	const HERO_IMAGE =
		'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=70';

	// The audiences, cycled through the headline one at a time.
	const ROLES = [
		'solo creators',
		'schools & academies',
		'coaching businesses',
		'agencies',
		'communities'
	];
	let roleIndex = $state(0);
	$effect(() => {
		const id = setInterval(() => (roleIndex = (roleIndex + 1) % ROLES.length), 2400);
		return () => clearInterval(id);
	});

	// Which FAQ is open; one at a time.
	let openFaq = $state<number | null>(null);
</script>

<svelte:head>
	<title>Muallim — teach what you know</title>
	<meta
		name="description"
		content="Build a course, invite your students, and let the marking take care of itself."
	/>
</svelte:head>

<!--
	This page is for someone deciding whether to teach here. It says what they get,
	not how it is built. Anything not built yet wears a "Coming soon" badge — the
	honest signal that it is a roadmap item, not a claim. See `$lib/content/landing`.

	The layout: a full-bleed centered hero on a dark aurora wash with a rotating
	audience in the headline and the product in a browser frame beneath it, a marquee
	of names, two-tone section intros, and a bento of real product UI. The header is
	transparent over the hero and scrolls away with it.
-->

{#snippet intro(eyebrow: string, bold: string, rest: string)}
	<div use:inview class="max-w-3xl">
		<p class="text-sm font-semibold text-accent-text">{eyebrow}</p>
		<h2 class="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
			{bold} <span class="text-muted">{rest}</span>
		</h2>
	</div>
{/snippet}

<div class="relative min-h-dvh bg-surface text-text">
	<PageAurora />
	<MarketingHeader />

	<main>
		<!-- Full-bleed dark hero; the header floats over it and scrolls away. -->
		<section class="hero-blue relative isolate overflow-hidden">
			<AuroraBackdrop />

			<div class="mx-auto max-w-5xl px-6 pt-36 text-center sm:pt-44">
				<h1
					use:inview
					class="text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
				>
					The platform built for
					<!-- The audience cross-fades in place. A fixed row height keeps the layout
					     steady; no overflow clip, so descenders are never cut. -->
					<span class="relative mt-1 block h-[1.3em]">
						{#key roleIndex}
							<span
								in:fade={{ duration: 320 }}
								out:fade={{ duration: 320 }}
								class="absolute inset-x-0 top-0 text-[#3a9ae6]"
							>
								{ROLES[roleIndex]}
							</span>
						{/key}
					</span>
				</h1>

				<p
					use:inview={{ delay: 80 }}
					class="mx-auto mt-6 max-w-xl text-lg text-pretty text-white/75"
				>
					One place to build, teach, quiz, and grade — with the marking handled for you and the
					reasons to come back built in.
				</p>

				<div use:inview={{ delay: 140 }} class="mt-10 flex justify-center">
					<Button
						href={resolve('/register')}
						size="lg"
						pill
						class="!border-transparent !bg-white !text-black hover:!bg-white/90"
					>
						Start teaching
						<Icon icon={ArrowRight01Icon} class="size-4" />
					</Button>
				</div>
			</div>

			<!-- The product, in a browser frame, sitting flush at the foot of the hero.
			     A fixed image height keeps the layout from shifting as it loads. -->
			<div use:inview={{ delay: 160 }} class="mx-auto mt-16 max-w-5xl px-6">
				<div class="overflow-hidden rounded-t-overlay border border-white/15 bg-surface-raised">
					<div class="flex items-center gap-2 border-b border-border px-4 py-3">
						<span class="size-3 rounded-full bg-danger/60"></span>
						<span class="size-3 rounded-full bg-warning/60"></span>
						<span class="size-3 rounded-full bg-success/60"></span>
						<span class="numeral ml-3 text-xs text-muted">muallim.test</span>
					</div>
					<img
						src={HERO_IMAGE}
						alt="A course open in Muallim"
						width="1600"
						height="900"
						class="h-60 w-full object-cover sm:h-[460px]"
					/>
				</div>
			</div>
		</section>

		<div class="mx-auto max-w-6xl">
			<!-- --------------------------------------------------------- logo strip -->
			{#if LOGOS.length > 0}
				<section>
					<div class="px-6 py-12 sm:px-8">
						<p class="text-center text-xs font-medium tracking-wide text-muted uppercase">
							Taught with Muallim
						</p>
						<!-- Two copies of the list slide as one track, so the loop is seamless. -->
						<div use:inview class="fade-x marquee mt-8 overflow-hidden">
							<ul class="marquee-track items-center gap-x-12 text-lg font-semibold text-muted/70">
								{#each [...LOGOS, ...LOGOS] as school, i (i)}
									<li class="shrink-0 whitespace-nowrap" aria-hidden={i >= LOGOS.length}>
										{school}
									</li>
								{/each}
							</ul>
						</div>
					</div>
				</section>
			{/if}

			<!-- ------------------------------------------------------ product bento -->
			<section class="relative overflow-hidden">
				<div
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 -z-10 opacity-60"
					style="background: radial-gradient(48rem 30rem at 100% 0%, var(--accent-surface), transparent 60%);"
				></div>

				<div class="px-6 py-24 sm:px-10">
					{@render intro(
						'The whole teaching loop',
						'One screen, the whole loop.',
						'Marking, progress, and the reasons to come back — drawn from the real product, not a screenshot.'
					)}

					<!-- One product frame, so the widgets read as a single screen, not floating cards. -->
					<div
						use:inview
						class="mt-14 overflow-hidden rounded-overlay border border-border bg-surface-raised"
					>
						<div class="flex items-center gap-2 border-b border-border px-4 py-3">
							<span class="size-3 rounded-full bg-danger/60"></span>
							<span class="size-3 rounded-full bg-warning/60"></span>
							<span class="size-3 rounded-full bg-success/60"></span>
							<span class="numeral ml-3 text-xs text-muted">muallim.test/marking</span>
						</div>
						<div class="grid gap-4 bg-surface p-4 sm:p-6 lg:grid-cols-5">
							<!-- The real marking queue, from the same components the product uses. -->
							<div class="lg:col-span-3">
								<Card elevation="raised" class="h-full overflow-hidden">
									<div class="flex items-center justify-between border-b border-border px-5 py-3.5">
										<p class="text-sm font-medium">Waiting to be marked</p>
										<Badge tone="warning">3 to go</Badge>
									</div>

									<ul class="divide-y divide-border">
										{#each QUEUE as row (row.who)}
											<li class="flex items-center justify-between gap-4 px-5 py-4">
												<div>
													<p class="text-sm font-medium">{row.who}</p>
													<p class="numeral mt-0.5 text-xs text-muted">{row.what}</p>
												</div>
												<Badge tone="warning">
													<span class="numeral">{row.left}</span>
													{row.left === 1 ? 'answer' : 'answers'}
												</Badge>
											</li>
										{/each}
										<li class="flex items-center justify-between gap-4 px-5 py-4">
											<div>
												<p class="text-sm font-medium">Al-Khwarizmi</p>
												<p class="mt-1"><Verdict kind="correct" /></p>
											</div>
											<Badge tone="success">Marked</Badge>
										</li>
									</ul>

									<div class="border-t border-border bg-surface px-5 py-4">
										<Score points={13} maxPoints={15} passed={true} />
									</div>
								</Card>
							</div>

							<div class="flex flex-col gap-4 lg:col-span-2">
								<!-- A quiz result, graded. -->
								<div class="flex-1">
									<Card elevation="raised" class="h-full p-5">
										<p class="text-sm font-medium">Chapter one quiz</p>
										<p class="mt-1 text-xs text-muted">Graded a moment after it was handed in.</p>
										<div class="mt-4">
											<Score points={9} maxPoints={10} passed={true} />
										</div>
										<div class="mt-4 flex items-center gap-2">
											<Verdict kind="correct" />
											<span class="text-xs text-muted">9 of 10 questions</span>
										</div>
									</Card>
								</div>

								<!-- Points and a leaderboard — the reason to come back. -->
								<div class="flex-1">
									<Card elevation="raised" class="h-full p-5">
										<p class="text-sm font-medium">This week's leaders</p>
										<ul class="mt-3 space-y-2.5">
											{#each BOARD as row, i (row.who)}
												<li class="flex items-center gap-3 text-sm">
													<span
														class="numeral grid size-5 shrink-0 place-items-center rounded-pill bg-accent-surface text-xs font-semibold text-accent-text"
													>
														{i + 1}
													</span>
													<span class="flex-1 truncate">{row.who}</span>
													<span class="numeral text-xs text-muted">{row.points}</span>
												</li>
											{/each}
										</ul>
										<div class="mt-4">
											<Progress value={72} label="Class progress this week" tone="success" />
										</div>
									</Card>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- ------------------------------------------------------------ features -->
			<section class="">
				<div class="px-6 py-24 sm:px-10">
					{@render intro(
						'Everything you need',
						'The parts of teaching nobody enjoys.',
						'Marking, chasing, scheduling — handled, so the teaching is what is left.'
					)}

					<div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each FEATURES as feature, index (feature.title)}
							<div use:inview={{ delay: index * 80 }}>
								<Card aurora class="lift h-full p-6">
									<Icon icon={feature.icon} class="size-6 text-accent" />
									<h3 class="mt-4 font-semibold">{feature.title}</h3>
									<p class="mt-2 text-sm text-pretty text-muted">{feature.body}</p>
								</Card>
							</div>
						{/each}
						{#each MORE_FEATURES as feature, index (feature.title)}
							<div use:inview={{ delay: (index % 3) * 80 }}>
								<Card aurora class="lift h-full p-6">
									<div class="flex items-start justify-between gap-3">
										<Icon icon={feature.icon} class="size-6 text-accent" />
										{#if feature.status === 'planned'}
											<Badge tone="neutral">Coming soon</Badge>
										{/if}
									</div>
									<h3 class="mt-4 font-semibold">{feature.title}</h3>
									<p class="mt-2 text-sm text-pretty text-muted">{feature.body}</p>
								</Card>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- ---------------------------------------------------- solutions router -->
			<section class="px-4 sm:px-6">
				<div class="rounded-3xl bg-surface-sunken px-6 py-20 sm:px-10">
					{@render intro(
						'Built for how you teach',
						'Start where you are.',
						'A community, a solo course, a school, a coaching cohort, or a client’s academy — see what works today, and what is still ahead.'
					)}

					<div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each SEGMENTS as s, index (s.slug)}
							<a
								use:inview={{ delay: (index % 3) * 80 }}
								href={resolve('/solutions/[slug]', { slug: s.slug })}
								class="group"
							>
								<Card
									aurora
									class="lift flex h-full flex-col p-6 {index % 2
										? '-rotate-[0.6deg]'
										: 'rotate-[0.6deg]'}"
								>
									<Icon icon={s.heroIcon} class="size-6 text-accent" />
									<h3 class="mt-4 font-semibold">{s.nav}</h3>
									<p class="mt-2 flex-1 text-sm text-pretty text-muted">{s.tagline}</p>
									<span
										class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-text"
									>
										See what fits
										<Icon
											icon={ArrowRight01Icon}
											class="size-4 transition-transform group-hover:translate-x-0.5"
										/>
									</span>
								</Card>
							</a>
						{/each}

						<!-- The router's own catch-all, in the locked dark look so it reads as the CTA. -->
						<div
							use:inview={{ delay: 160 }}
							class="hero-blue relative overflow-hidden rounded-card"
						>
							<div class="relative flex h-full flex-col justify-between gap-6 p-6">
								<p class="text-lg font-semibold text-pretty text-white">
									Not sure where to start? Begin with one course, free.
								</p>
								<Button
									href={resolve('/register')}
									pill
									class="self-start !border-transparent !bg-white !text-black hover:!bg-white/90"
								>
									Get started
									<Icon icon={ArrowRight01Icon} class="size-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- ----------------------------------------------------------------- AI -->
			<section class="relative overflow-hidden">
				<div
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
					style="background: radial-gradient(40rem 24rem at 0% 0%, var(--accent), transparent 65%);"
				></div>

				<div class="px-6 py-24 sm:px-10">
					<div use:inview class="max-w-3xl">
						<span
							class="inline-flex items-center gap-2 rounded-pill border border-accent-border bg-accent-surface px-3 py-1 text-xs font-medium text-accent-text"
						>
							<Icon icon={SparklesIcon} class="size-3.5" />
							Now with AI
						</span>
						<h2 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
							The blank page, solved.
							<span class="text-muted">Draft a course, a lesson, a quiz — then make it yours.</span>
						</h2>
					</div>

					<div class="mt-14 grid gap-4 sm:grid-cols-2">
						{#each AI_FEATURES as feature, index (feature.title)}
							<div use:inview={{ delay: (index % 2) * 80 }}>
								<Card aurora class="lift flex h-full gap-4 p-6">
									<Icon icon={feature.icon} class="mt-0.5 size-6 shrink-0 text-accent" />
									<div>
										<div class="flex flex-wrap items-center gap-2">
											<h3 class="font-semibold">{feature.title}</h3>
											{#if feature.status === 'planned'}
												<Badge tone="neutral">Coming soon</Badge>
											{/if}
										</div>
										<p class="mt-2 text-sm text-pretty text-muted">{feature.body}</p>
									</div>
								</Card>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- ------------------------------------------------------- how it works -->
			<section class="px-4 sm:px-6">
				<div class="rounded-3xl bg-surface-sunken px-6 py-20 sm:px-10">
					{@render intro('How it works', 'Three steps.', 'And the first one is free.')}

					<!-- A connecting rail runs behind the numbers, so the three read as one path. -->
					<ol class="relative mt-16 grid gap-10 sm:grid-cols-3">
						<div
							aria-hidden="true"
							class="absolute top-5 right-[16%] left-[16%] hidden h-px bg-border sm:block"
						></div>
						{#each STEPS as step, index (step.title)}
							<li use:inview={{ delay: index * 90 }} class="relative text-center sm:text-left">
								<span
									class="numeral relative z-10 flex size-10 items-center justify-center rounded-pill bg-accent text-sm font-semibold text-on-solid ring-4 ring-surface-sunken sm:mx-0 max-sm:mx-auto"
								>
									{index + 1}
								</span>
								<h3 class="mt-5 font-semibold">{step.title}</h3>
								<p class="mt-2 text-sm text-pretty text-muted">{step.body}</p>
							</li>
						{/each}
					</ol>
				</div>
			</section>

			<!-- ---------------------------------------------------------- pricing -->
			<section id="pricing" class="scroll-mt-20">
				<div class="px-6 py-24 sm:px-10">
					{@render intro(
						'Pricing',
						'Pay when it is worth paying for.',
						'Start free. Move up when you outgrow it.'
					)}

					<!-- items-stretch equalises the three; the popular plan then scales up from
					     its centre so it stands taller without breaking the row. -->
					<div class="mt-16 grid items-stretch gap-4 lg:grid-cols-3">
						{#each PLANS as plan, index (plan.name)}
							<div use:inview={{ delay: index * 90 }} class={plan.highlighted ? 'lg:z-10' : ''}>
								<Card
									aurora={plan.highlighted}
									elevation={plan.highlighted ? 'raised' : 'flat'}
									class="relative flex h-full flex-col p-8 {plan.highlighted
										? 'origin-center border-accent-border lg:scale-[1.05]'
										: 'lift'}"
								>
									{#if plan.highlighted}
										<!-- The badge floats over the top edge. -->
										<span
											class="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-on-solid"
										>
											Most popular
										</span>
									{/if}
									<h3 class="font-semibold">{plan.name}</h3>

									<p class="mt-5 flex items-baseline gap-1.5">
										<span class="text-4xl font-semibold {/\d/.test(plan.price) ? 'numeral' : ''}">
											{plan.price}
										</span>
										{#if plan.cadence}
											<span class="text-sm text-muted">{plan.cadence}</span>
										{/if}
									</p>

									<p class="mt-3 text-sm text-pretty text-muted">{plan.summary}</p>

									<Button
										href={resolve('/register')}
										size="lg"
										pill
										variant={plan.highlighted ? 'primary' : 'secondary'}
										class="mt-8 w-full"
									>
										{plan.cta}
									</Button>

									<ul class="mt-8 space-y-3 text-sm">
										{#each plan.features as line (line)}
											<li class="flex items-start gap-3">
												<Icon
													icon={Tick02Icon}
													strokeWidth={2.5}
													class="mt-0.5 size-4 shrink-0 text-success-text"
												/>
												<span class="text-muted">{line}</span>
											</li>
										{/each}
									</ul>
								</Card>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- --------------------------------------------------------------- FAQ -->
			<section>
				<div class="px-6 py-24 sm:px-10">
					<div use:inview class="mx-auto max-w-2xl text-center">
						<p class="text-sm font-semibold text-accent-text">Questions</p>
						<h2 class="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
							Before you ask.
						</h2>
					</div>

					<div use:inview class="mx-auto mt-12 max-w-3xl space-y-3">
						{#each FAQS as item, i (item.question)}
							{@const open = openFaq === i}
							<div class="overflow-hidden rounded-card border border-border bg-surface-raised">
								<button
									type="button"
									onclick={() => (openFaq = open ? null : i)}
									aria-expanded={open}
									class="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left font-medium"
								>
									{item.question}
									<span
										aria-hidden="true"
										class="grid size-6 shrink-0 place-items-center rounded-pill border border-border text-muted transition-transform duration-200 {open
											? 'rotate-45'
											: ''}"
									>
										+
									</span>
								</button>
								{#if open}
									<div transition:slide={{ duration: 220 }}>
										<p class="px-5 pb-5 text-sm text-pretty text-muted">{item.answer}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- --------------------------------------------------------------- CTA -->
			<section class="hero-blue relative isolate overflow-hidden rounded-overlay">
				<AuroraBackdrop />

				<div use:inview class="px-6 py-28 text-center sm:px-10">
					<h2 class="text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
						Start with one course.
					</h2>
					<p class="mx-auto mt-4 max-w-lg text-pretty text-white/85">
						Write a lesson, add a quiz, invite the people who should see it. You can do the rest
						later.
					</p>
					<div class="mt-10">
						<Button
							href={resolve('/register')}
							size="lg"
							pill
							class="!border-transparent !bg-white !text-black hover:!bg-white/90"
						>
							Start teaching
						</Button>
					</div>
				</div>
			</section>
		</div>
	</main>

	<MarketingFooter />
</div>
