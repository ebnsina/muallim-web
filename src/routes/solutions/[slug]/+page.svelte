<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon, Clock01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import { Badge, Button, Card, Icon, MarketingFooter, MarketingHeader } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const segment = $derived(data.segment);

	// Two-tone hero, Stripe-style: first sentence solid, the rest in muted.
	const parts = $derived(segment.headline.split(/(?<=\.)\s+/));
	const headA = $derived(parts[0]);
	const headB = $derived(parts.slice(1).join(' '));
</script>

<svelte:head>
	<title>Muallim for {segment.nav.toLowerCase()}</title>
	<meta name="description" content={segment.blurb} />
</svelte:head>

<div class="min-h-dvh">
	<MarketingHeader />

	<main>
		<div class="mx-auto max-w-6xl">
			<!-- ------------------------------------------------------------- hero -->
			<section class="relative isolate overflow-hidden">
				<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
					<div class="grid-lines absolute inset-0"></div>
					<div class="ribbon absolute -top-40 -right-52 size-[48rem] rounded-full opacity-80"></div>
					<div class="ribbon-threads absolute -top-40 -right-52 size-[48rem]"></div>
				</div>

				<div class="grid items-center gap-12 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-2">
					<div>
						<p use:inview class="inline-flex">
							<Badge tone="accent" icon={segment.heroIcon}>{segment.eyebrow}</Badge>
						</p>

						<h1
							use:inview={{ delay: 60 }}
							class="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
						>
							{headA}
							{#if headB}<span class="text-muted">{headB}</span>{/if}
						</h1>

						<p use:inview={{ delay: 120 }} class="mt-6 max-w-xl text-lg text-pretty text-muted">
							{segment.blurb}
						</p>

						<div use:inview={{ delay: 180 }} class="mt-10 flex flex-wrap gap-3">
							<Button href={resolve('/register')} size="lg">
								Get started
								<Icon icon={ArrowRight01Icon} class="size-4" />
							</Button>
							<Button href={resolve('/courses')} size="lg" variant="secondary"
								>Browse courses</Button
							>
						</div>
					</div>

					<div use:inview={{ delay: 120 }}>
						<img
							src={segment.image}
							alt={segment.imageAlt}
							width="1200"
							height="900"
							class="aspect-[4/3] w-full rounded-overlay border border-border object-cover"
						/>
					</div>
				</div>
			</section>

			<!-- ------------------------------------------------- what works today -->
			<section class="border-t border-border">
				<div class="px-6 py-24 sm:px-10">
					<div use:inview class="max-w-3xl">
						<p class="inline-flex">
							<Badge tone="success" icon={Tick02Icon}>Working today</Badge>
						</p>
						<h2 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
							What you can do now.
						</h2>
					</div>

					<div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each segment.today as item, index (item.title)}
							<div use:inview={{ delay: (index % 3) * 80 }}>
								<Card class="lift h-full p-6">
									<Icon icon={item.icon} class="size-6 text-accent" />
									<h3 class="mt-4 font-semibold">{item.title}</h3>
									<p class="mt-2 text-sm text-pretty text-muted">{item.body}</p>
								</Card>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- ---------------------------------------------------------- highlight -->
			<section class="relative overflow-hidden border-t border-border bg-surface-raised">
				<div
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 -z-10 opacity-70"
					style="background: radial-gradient(46rem 28rem at 100% 100%, var(--accent-surface), transparent 62%);"
				></div>

				<div class="grid items-center gap-12 px-6 py-24 sm:px-10 lg:grid-cols-2">
					<div use:inview>
						<p class="text-sm font-semibold text-accent-text">{segment.highlight.label}</p>
						<h2 class="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
							{segment.highlight.title}
						</h2>
						<p class="mt-4 text-pretty text-muted">{segment.highlight.body}</p>
					</div>

					<div use:inview={{ delay: 120 }}>
						<Card elevation="raised" class="p-6">
							<ul class="space-y-4">
								{#each segment.highlight.points as point (point)}
									<li class="flex items-start gap-3 text-sm">
										<Icon
											icon={Tick02Icon}
											strokeWidth={2.5}
											class="mt-0.5 size-4 shrink-0 text-success-text"
										/>
										<span>{point}</span>
									</li>
								{/each}
							</ul>
						</Card>
					</div>
				</div>
			</section>

			<!-- --------------------------------------------------------- roadmap -->
			<section class="border-t border-border">
				<div class="px-6 py-24 sm:px-10">
					<div use:inview class="max-w-3xl">
						<p class="inline-flex">
							<Badge tone="neutral" icon={Clock01Icon}>On the roadmap</Badge>
						</p>
						<h2 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
							What is still ahead.
							<span class="text-muted">Named honestly, not implied by omission.</span>
						</h2>
					</div>

					<div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each segment.roadmap as item, index (item.title)}
							<div use:inview={{ delay: (index % 3) * 80 }}>
								<Card class="lift flex h-full gap-4 p-6">
									<Icon icon={item.icon} class="mt-0.5 size-6 shrink-0 text-muted" />
									<div>
										<div class="flex flex-wrap items-center gap-2">
											<h3 class="font-semibold">{item.title}</h3>
											<Badge tone="neutral">Coming soon</Badge>
										</div>
										<p class="mt-2 text-sm text-pretty text-muted">{item.body}</p>
									</div>
								</Card>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- --------------------------------------------------------- verdict -->
			<section class="border-t border-border bg-surface-raised">
				<div class="px-6 py-24 sm:px-10">
					<div use:inview class="max-w-3xl">
						<p class="text-sm font-semibold text-accent-text">The honest bottom line</p>
						<h2 class="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
							Ready for you today?
						</h2>
					</div>

					<div class="mt-12 grid gap-4 lg:grid-cols-2">
						<div use:inview>
							<Card class="h-full border-success-border p-6">
								<div class="flex items-center gap-2">
									<Icon icon={Tick02Icon} strokeWidth={2.5} class="size-5 text-success-text" />
									<h3 class="font-semibold">Yes, for this</h3>
								</div>
								<p class="mt-3 text-pretty text-muted">{segment.verdict.ready}</p>
							</Card>
						</div>
						<div use:inview={{ delay: 100 }}>
							<Card class="h-full p-6">
								<div class="flex items-center gap-2">
									<Icon icon={Clock01Icon} class="size-5 text-muted" />
									<h3 class="font-semibold">Wait, if you need this</h3>
								</div>
								<p class="mt-3 text-pretty text-muted">{segment.verdict.wait}</p>
							</Card>
						</div>
					</div>
				</div>
			</section>

			<!-- ------------------------------------------------------------- CTA -->
			<section class="relative isolate overflow-hidden border-t border-border">
				<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
					<div class="ribbon absolute inset-0 opacity-95"></div>
					<div class="ribbon-threads absolute inset-0"></div>
				</div>

				<div use:inview class="px-6 py-28 text-center sm:px-10">
					<h2 class="text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
						Start with one course.
					</h2>
					<p class="mx-auto mt-4 max-w-lg text-pretty text-white/85">
						Everything that works today is free to try. Build it now; the rest arrives as it lands.
					</p>
					<div class="mt-10">
						<Button href={resolve('/register')} size="lg" variant="secondary">Get started</Button>
					</div>
				</div>
			</section>
		</div>
	</main>

	<MarketingFooter />
</div>
