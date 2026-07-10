<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		ArrowRight01Icon,
		Mortarboard02Icon,
		SparklesIcon,
		Tick02Icon
	} from '@hugeicons/core-free-icons';
	import { Badge, Button, Card, Icon, Score, Verdict } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import {
		AI_FEATURES,
		FAQS,
		FEATURES,
		LOGOS,
		MORE_FEATURES,
		PLANS,
		STEPS
	} from '$lib/content/landing';

	const PROMO_POINTS = [
		'Marked the instant it is submitted',
		'Essays queued, never lost',
		'One click settles the grade'
	];

	const QUEUE = [
		{ who: 'Fatima al-Fihri', what: 'Chapter one · attempt 2', left: 1 },
		{ who: 'Maryam al-Astrulabi', what: 'Chapter one · attempt 1', left: 2 }
	];
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
	not how it is built. There is nothing about tenants, transactions, row-level
	security or iframes on it, because none of those are things a teacher wants and
	all of them are things a teacher has to translate.

	Anything not built yet wears a "Coming soon" badge, and the AI section says so
	in its own headline. See `$lib/content/landing` for that rule, and for what on
	this page is still a placeholder that must not ship.
-->

{#snippet heading(eyebrow: string, title: string, blurb?: string)}
	<div use:inview class="mx-auto max-w-2xl text-center">
		<p class="text-sm font-semibold text-accent-text">{eyebrow}</p>
		<h2 class="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
		{#if blurb}
			<p class="mt-4 text-pretty text-muted">{blurb}</p>
		{/if}
	</div>
{/snippet}

<div class="min-h-dvh">
	<!-- The theme toggle floats at top-right, so the header keeps out of its way. -->
	<header class="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
		<div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6 pr-16">
			<a href={resolve('/')} class="flex items-center gap-2.5 font-semibold">
				<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
				Muallim
			</a>

			<nav class="ml-auto flex items-center gap-1 text-sm sm:gap-2">
				<Button href="#pricing" variant="ghost" size="sm" class="hidden sm:inline-flex">
					Pricing
				</Button>
				<Button href={resolve('/courses')} variant="ghost" size="sm">Courses</Button>
				<Button href={resolve('/login')} variant="ghost" size="sm">Sign in</Button>
				<Button href={resolve('/register')} size="sm">Get started</Button>
			</nav>
		</div>
	</header>

	<main>
		<!-- ------------------------------------------------------------------ hero -->
		<section class="relative isolate overflow-hidden">
			<!--
				Depth, in three layers, and every colour in it comes from the brand ramp.
				A hero gradient that introduces two hues the design system has never heard
				of is a hero that belongs to somebody else's product.

				Layer one: a grid, masked so it exists only where the eye already is.
				Layer two: two washes of blue, blurred past recognition, drifting over
				half a minute. Layer three: nothing. Three would be one too many.
			-->
			<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
				<div class="grid-lines absolute inset-0"></div>

				<div
					class="aurora absolute -top-48 left-1/2 size-[46rem] -translate-x-1/2 rounded-full blur-3xl"
					style="background: radial-gradient(closest-side, var(--b-7), transparent 72%); opacity: 0.55;"
				></div>
				<div
					class="aurora-slow absolute -top-32 right-[6%] size-[32rem] rounded-full blur-3xl"
					style="background: radial-gradient(closest-side, var(--b-6), transparent 70%); opacity: 0.5;"
				></div>
				<div
					class="aurora-slow absolute -top-24 left-[4%] size-[26rem] rounded-full blur-3xl"
					style="background: radial-gradient(closest-side, var(--b-5), transparent 70%); opacity: 0.45;"
				></div>
			</div>

			<div class="relative mx-auto max-w-3xl px-6 py-28 text-center sm:py-36">
				<p use:inview class="inline-flex">
					<Badge tone="accent" icon={SparklesIcon}>Quizzes that mark themselves</Badge>
				</p>

				<h1
					use:inview={{ delay: 60 }}
					class="mt-8 text-5xl font-semibold tracking-tight text-balance sm:text-7xl"
				>
					Teach what you know.
				</h1>

				<p
					use:inview={{ delay: 120 }}
					class="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted sm:text-xl"
				>
					Build a course, invite your students, and let the marking take care of itself.
				</p>

				<div use:inview={{ delay: 180 }} class="mt-10 flex flex-wrap justify-center gap-3">
					<Button href={resolve('/register')} size="lg">Start teaching</Button>
					<Button href={resolve('/courses')} size="lg" variant="secondary">Browse courses</Button>
				</div>

				<p use:inview={{ delay: 240 }} class="mt-6 text-sm text-muted">
					It takes a minute to set up.
				</p>
			</div>
		</section>

		<!-- ------------------------------------------------------------- logo strip -->
		{#if LOGOS.length > 0}
			<section class="border-y border-border bg-surface-raised">
				<div class="mx-auto max-w-6xl px-6 py-10">
					<p class="text-center text-xs font-medium tracking-wide text-muted uppercase">
						Taught with Muallim
					</p>
					<ul
						use:inview
						class="fade-x mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-semibold text-muted/70"
					>
						{#each LOGOS as school (school)}
							<li>{school}</li>
						{/each}
					</ul>
				</div>
			</section>
		{/if}

		<!-- -------------------------------------------------------------- features -->
		<section class="mx-auto max-w-6xl px-6 py-24">
			{@render heading(
				'Everything you need',
				'The parts of teaching nobody enjoys',
				'Marking, chasing, scheduling. Handled, so the teaching is what is left.'
			)}

			<div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each FEATURES as feature, index (feature.title)}
					<!-- `use:` is a directive on elements, and a component is not one, so the
					     reveal rides on a wrapper. The grid does not mind. -->
					<div use:inview={{ delay: index * 80 }}>
						<Card class="lift h-full p-6">
							<Icon icon={feature.icon} class="size-6 text-accent" />
							<h3 class="mt-4 font-semibold">{feature.title}</h3>
							<p class="mt-2 text-sm text-pretty text-muted">{feature.body}</p>
						</Card>
					</div>
				{/each}
			</div>
		</section>

		<!-- ------------------------------------------------------------------ promo -->
		<section class="border-y border-border bg-surface-raised">
			<div class="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
				<div use:inview>
					<p class="text-sm font-semibold text-accent-text">Marking</p>
					<h2 class="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
						Hand it in on Friday. Marked before you sit down.
					</h2>
					<p class="mt-4 text-pretty text-muted">
						Everything a computer can judge is judged the moment it arrives. What is left — the
						essays, the answers that need a person — waits in one list, oldest first, with the
						student's work beside it.
					</p>

					<ul class="mt-8 space-y-3 text-sm">
						{#each PROMO_POINTS as line (line)}
							<li class="flex items-center gap-3">
								<Icon
									icon={Tick02Icon}
									strokeWidth={2.5}
									class="size-4 shrink-0 text-success-text"
								/>
								{line}
							</li>
						{/each}
					</ul>

					<div class="mt-10">
						<Button href={resolve('/register')}>
							Start teaching
							<Icon icon={ArrowRight01Icon} class="size-4" />
						</Button>
					</div>
				</div>

				<!--
					Not a screenshot. This is the real marking queue, drawn from the same
					components the product uses — so it cannot drift out of date, and it
					themes with the rest of the page.
				-->
				<div use:inview={{ delay: 120 }}>
					<Card elevation="raised" class="overflow-hidden">
						<div class="border-b border-border px-5 py-3.5">
							<p class="text-sm font-medium">Waiting to be marked</p>
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
			</div>
		</section>

		<!-- --------------------------------------------------------- more features -->
		<section class="mx-auto max-w-6xl px-6 py-24">
			{@render heading('And the rest', 'The details that decide it')}

			<div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each MORE_FEATURES as feature, index (feature.title)}
					<div use:inview={{ delay: (index % 3) * 80 }}>
						<Card class="lift h-full p-6">
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
		</section>

		<!-- --------------------------------------------------------------------- AI -->
		<section class="relative overflow-hidden border-y border-border bg-surface-raised">
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 opacity-[0.06]"
				style="background: radial-gradient(40rem 24rem at 80% 0%, var(--accent), transparent 65%);"
			></div>

			<div class="relative mx-auto max-w-6xl px-6 py-24">
				<div class="mx-auto max-w-2xl text-center">
					<span
						class="inline-flex items-center gap-2 rounded-pill border border-accent-border bg-accent-surface px-3 py-1 text-xs font-medium text-accent-text"
					>
						<Icon icon={SparklesIcon} class="size-3.5" />
						Not built yet
					</span>

					<h2 class="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
						The blank page, solved
					</h2>
					<p class="mt-4 text-pretty text-muted">
						Writing the first draft of a course is the part that stops people. This is what we are
						building next — and none of it is here today, which is why it says so.
					</p>
				</div>

				<div class="mt-14 grid gap-4 sm:grid-cols-2">
					{#each AI_FEATURES as feature, index (feature.title)}
						<div use:inview={{ delay: (index % 2) * 80 }}>
							<Card class="lift flex h-full gap-4 p-6">
								<Icon icon={feature.icon} class="mt-0.5 size-6 shrink-0 text-accent" />
								<div>
									<div class="flex flex-wrap items-center gap-2">
										<h3 class="font-semibold">{feature.title}</h3>
										<Badge tone="neutral">Coming soon</Badge>
									</div>
									<p class="mt-2 text-sm text-pretty text-muted">{feature.body}</p>
								</div>
							</Card>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ---------------------------------------------------------- how it works -->
		<section class="mx-auto max-w-6xl px-6 py-24">
			{@render heading('How it works', 'Three steps, and the first one is free')}

			<ol class="mt-14 grid gap-8 sm:grid-cols-3">
				{#each STEPS as step, index (step.title)}
					<li use:inview={{ delay: index * 90 }}>
						<span
							class="numeral flex size-10 items-center justify-center rounded-pill bg-accent text-sm font-semibold text-on-solid"
						>
							{index + 1}
						</span>
						<h3 class="mt-5 font-semibold">{step.title}</h3>
						<p class="mt-2 text-sm text-pretty text-muted">{step.body}</p>
					</li>
				{/each}
			</ol>
		</section>

		<!-- ---------------------------------------------------------------- pricing -->
		<section id="pricing" class="scroll-mt-20 border-y border-border bg-surface-raised">
			<div class="mx-auto max-w-6xl px-6 py-24">
				{@render heading('Pricing', 'Pay when it is worth paying for')}

				<div class="mt-14 grid items-start gap-4 lg:grid-cols-3">
					{#each PLANS as plan, index (plan.name)}
						<div use:inview={{ delay: index * 90 }}>
							<Card
								elevation={plan.highlighted ? 'raised' : 'flat'}
								class="lift relative h-full p-8 {plan.highlighted ? 'border-accent-border' : ''}"
							>
								{#if plan.highlighted}
									<!-- A hairline of the ramp along the top edge. Not a full glow: the
								     card is already raised, and two signals for one idea is noise. -->
									<span
										aria-hidden="true"
										class="absolute inset-x-8 top-0 h-px"
										style="background: linear-gradient(to right, transparent, var(--accent), transparent);"
									></span>
								{/if}
								<div class="flex items-center justify-between gap-3">
									<h3 class="font-semibold">{plan.name}</h3>
									{#if plan.highlighted}
										<Badge tone="accent">Most popular</Badge>
									{/if}
								</div>

								<p class="mt-5 flex items-baseline gap-1.5">
									<!--
									`numeral` is the monospaced, tabular face, and it is for figures a
									reader compares against other figures. "Talk to us" is a sentence,
									and setting it in that face makes a price look like a typo.
								-->
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

		<!-- -------------------------------------------------------------------- FAQ -->
		<section class="mx-auto max-w-3xl px-6 py-24">
			{@render heading('Questions', 'Before you ask')}

			<!--
				`<details>` and `<summary>`. An accordion built from divs is a keyboard
				implementation, a screen-reader implementation, and a find-in-page
				implementation to get wrong; the browser has all three, and Ctrl+F opens
				the right panel for free.
			-->
			<div use:inview class="mt-12 divide-y divide-border border-y border-border">
				{#each FAQS as item (item.question)}
					<details class="group py-5">
						<summary
							class="flex cursor-pointer list-none items-center justify-between gap-4 font-medium"
						>
							{item.question}
							<span
								aria-hidden="true"
								class="grid size-6 shrink-0 place-items-center rounded-pill border border-border text-muted transition-transform group-open:rotate-45"
							>
								+
							</span>
						</summary>
						<p class="mt-3 pr-10 text-sm text-pretty text-muted">{item.answer}</p>
					</details>
				{/each}
			</div>
		</section>

		<!-- -------------------------------------------------------------------- CTA -->
		<section class="relative isolate overflow-hidden border-t border-border bg-accent">
			<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
				<div
					class="aurora absolute -top-24 left-[15%] size-[28rem] rounded-full blur-3xl"
					style="background: radial-gradient(closest-side, var(--b-10), transparent 70%); opacity: 0.6;"
				></div>
				<div
					class="aurora-slow absolute -right-16 -bottom-32 size-[26rem] rounded-full blur-3xl"
					style="background: radial-gradient(closest-side, var(--b-8), transparent 70%); opacity: 0.45;"
				></div>
			</div>

			<div use:inview class="relative mx-auto max-w-3xl px-6 py-24 text-center">
				<h2 class="text-3xl font-semibold tracking-tight text-balance text-on-solid sm:text-4xl">
					Start with one course.
				</h2>
				<p class="mx-auto mt-4 max-w-lg text-pretty text-on-solid/80">
					Write a lesson, add a quiz, invite the people who should see it. You can do the rest
					later.
				</p>
				<div class="mt-10">
					<Button href={resolve('/register')} size="lg" variant="secondary">Start teaching</Button>
				</div>
			</div>
		</section>
	</main>

	<!-- ------------------------------------------------------------------ footer -->
	<footer class="border-t border-border">
		<div class="mx-auto max-w-6xl px-6 py-16">
			<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<a href={resolve('/')} class="flex items-center gap-2.5 font-semibold">
						<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
						Muallim
					</a>
					<p class="mt-4 max-w-xs text-sm text-pretty text-muted">
						Build a course, invite your students, and let the marking take care of itself.
					</p>
				</div>

				<nav aria-label="Product">
					<h2 class="text-sm font-semibold">Product</h2>
					<ul class="mt-4 space-y-2.5 text-sm text-muted">
						<li><a class="underline-offset-4 hover:underline" href="#pricing">Pricing</a></li>
						<li>
							<a class="underline-offset-4 hover:underline" href={resolve('/courses')}>Courses</a>
						</li>
						<li>
							<a class="underline-offset-4 hover:underline" href={resolve('/ui')}>Design system</a>
						</li>
					</ul>
				</nav>

				<nav aria-label="Account">
					<h2 class="text-sm font-semibold">Account</h2>
					<ul class="mt-4 space-y-2.5 text-sm text-muted">
						<li>
							<a class="underline-offset-4 hover:underline" href={resolve('/login')}>Sign in</a>
						</li>
						<li>
							<a class="underline-offset-4 hover:underline" href={resolve('/register')}>
								Create an account
							</a>
						</li>
						<li>
							<a class="underline-offset-4 hover:underline" href={resolve('/forgot-password')}>
								Forgot your password
							</a>
						</li>
					</ul>
				</nav>

				<nav aria-label="More">
					<h2 class="text-sm font-semibold">More</h2>
					<ul class="mt-4 space-y-2.5 text-sm text-muted">
						<li>
							<a class="underline-offset-4 hover:underline" href={resolve('/status')}>Status</a>
						</li>
					</ul>
				</nav>
			</div>

			<div
				class="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted"
			>
				<p>© <span class="numeral">2026</span> Muallim</p>
				<p>Made for people who teach.</p>
			</div>
		</div>
	</footer>
</div>
