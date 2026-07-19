<script lang="ts">
	// Dedicated pricing, promoted out of the landing. 0% on collections is structural.
	// The ৳ figures in PLANS are suggested starters, yours to set — the model is the call.
	import { resolve } from '$app/paths';
	import { Icon } from '$lib/components';
	import { Button, Tag, PageHero, SiteCta } from '$lib/features/marketing/ui';
	import {
		ArrowRight01Icon,
		ArrowRight02Icon,
		ArrowUpRight01Icon,
		Tick02Icon,
		UserMultipleIcon
	} from '@hugeicons/core-free-icons';
	import { reveal } from '$lib/reveal';

	const taka = (n: number) => '৳' + new Intl.NumberFormat('en-IN').format(n);
	let monthly = $state(184250);

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

	const ADDONS = [
		{ name: 'Guardian SMS', line: 'Top up credits and pay only for the messages you send.' },
		{ name: 'AI Studio', line: 'Draft courses and quizzes from a prompt, metered by use.' }
	];
</script>

<svelte:head>
	<title>Pricing — Muallim</title>
	<meta
		name="description"
		content="Free to teach and sell. A simple subscription to run the whole institution. And 0% of what you collect — you keep every taka."
	/>
</svelte:head>

<div class="page">
	<PageHero>
		{#snippet eyebrow()}<Tag>Pricing</Tag>{/snippet}
		{#snippet title()}Priced to run on, not to tax you.{/snippet}
		{#snippet subtitle()}
			You pay to run the institution. You keep every taka you collect — 0%, on every plan.
		{/snippet}
		{#snippet actions()}
			<Button href={resolve('/register')} variant="lime">
				Start free <Icon icon={ArrowRight01Icon} class="size-5" />
			</Button>
			<Button href={resolve('/(marketing)/demo')} variant="ghost">
				Book a demo <Icon icon={ArrowUpRight01Icon} class="size-5" />
			</Button>
		{/snippet}
	</PageHero>

	<section use:reveal class="section">
		<div class="mt-2 grid items-stretch gap-4 md:grid-cols-3">
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
					<h2
						class="text-lg font-extrabold tracking-tight {plan.featured
							? 'text-[var(--accent)]'
							: 'text-[var(--ink)]'}"
					>
						{plan.name}
					</h2>
					<p class="mt-3 flex items-baseline gap-1.5">
						<span class="text-3xl font-extrabold tracking-tight">{plan.price}</span>
						<span
							class="text-sm {plan.featured
								? 'text-[color-mix(in_oklab,var(--on-brand)_62%,var(--brand))]'
								: 'text-[var(--muted)]'}">{plan.per}</span
						>
					</p>
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

		<div
			class="mt-4 grid items-center gap-8 rounded-[var(--r-lg)] bg-[var(--brand)] p-8 text-[var(--on-brand)] md:grid-cols-2"
		>
			<div>
				<h2 class="text-2xl font-extrabold tracking-tight text-[var(--accent)]">
					And 0% of what you collect.
				</h2>
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

	<SiteCta />
</div>

<style>
	.page {
		background: var(--cream);
	}
	.section {
		max-width: 76rem;
		margin: 3rem auto 0;
		padding: 0 1.5rem;
	}
</style>
