<script lang="ts">
	// Ask to be shown the product. Three steps, each checked by its slice of the
	// $lib/demo schema; the action re-checks all of it and muallim-api checks again.
	// Steps slide by direction; reduced motion stills them.
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { PageHero, SiteCta } from '$lib/features/marketing/ui';
	import { Icon } from '$lib/components';
	import {
		ArrowLeft01Icon,
		ArrowRight02Icon,
		CheckmarkBadge01Icon
	} from '@hugeicons/core-free-icons';
	import { INTENTS, stepSchemas, type Intent } from '$lib/demo';
	import { fieldErrors, type FieldErrors } from '$lib/validation';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const STEPS = [
		{ legend: 'What are you running?', hint: 'So we show you the parts that matter to you.' },
		{ legend: 'Who should we ask for?', hint: 'A person calls or writes — whichever you prefer.' },
		{ legend: 'One last thing.', hint: 'Then we are done.' }
	];

	let step = $state(0);
	let direction = $state(1);
	let errors = $state<FieldErrors>({});

	// The reader's answers. Held here rather than read off the DOM so a step that is
	// out of the document still submits — every field is posted at the end.
	let intent = $state<Intent | ''>('');
	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let agreed = $state(false);

	// The server rejected it: put them back where the problem is, with what they
	// typed. Anything else asks somebody to fill in their own phone number twice.
	$effect(() => {
		if (!form || !('values' in form) || !form.values) return;
		intent = (form.values.intent ?? '') as Intent | '';
		name = form.values.name ?? '';
		email = form.values.email ?? '';
		phone = form.values.phone ?? '';
		errors = form.errors ?? {};
		step = form.step ?? 0;
	});

	const values = $derived({ intent, name, email, phone, agreed: agreed ? 'on' : undefined });

	function advance() {
		const result = stepSchemas[step].safeParse(values);
		if (!result.success) {
			errors = fieldErrors(result.error);
			return;
		}
		errors = {};
		direction = 1;
		step += 1;
	}

	function back() {
		errors = {};
		direction = -1;
		step -= 1;
	}

	// The slide, or nothing at all.
	const slide = $derived(
		prefersReducedMotion.current
			? { duration: 0 }
			: { x: direction * 28, duration: 260, opacity: 0 }
	);

	const field =
		'mt-1.5 w-full rounded-xl border bg-[var(--surface)] px-4 py-3 text-[var(--ink)] outline-none transition placeholder:text-[color-mix(in_oklab,var(--muted)_70%,transparent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--brand)_25%,transparent)]';
	const ok = 'border-[var(--line)] focus-visible:border-[var(--brand)]';
	const bad = 'border-[var(--rose)] focus-visible:border-[var(--rose)]';
	const label = 'block text-sm font-semibold text-[var(--ink)]';
</script>

<svelte:head>
	<title>See Muallim — book a demo</title>
	<meta
		name="description"
		content="Tell us what you run and we will show you Muallim on it — a school, a college, a madrasa, a coaching centre, or a course you want to sell."
	/>
</svelte:head>

<div class="page">
	<PageHero>
		{#snippet eyebrow()}See it for yourself{/snippet}
		{#snippet title()}Let us show you Muallim.{/snippet}
		{#snippet subtitle()}
			Three short questions, and a person walks you through it on your own terms — no bots, no
			runaround, and nothing installed to find out.
		{/snippet}
	</PageHero>

	<section class="mx-auto mt-16 mb-24 w-full max-w-[44rem] px-6">
		{#if form?.sent}
			<div
				class="rounded-[var(--r-lg)] border border-[color-mix(in_oklab,var(--ink)_9%,transparent)] bg-[var(--surface)] p-8 text-center"
				in:fly={prefersReducedMotion.current ? { duration: 0 } : { y: 12, duration: 300 }}
			>
				<span
					class="mx-auto grid size-12 place-items-center rounded-full bg-[var(--accent)] text-[var(--brand)]"
				>
					<Icon icon={CheckmarkBadge01Icon} class="size-6" />
				</span>
				<h2 class="mt-4 text-2xl font-extrabold tracking-tight text-[var(--ink)]">
					Check your inbox shortly.
				</h2>
				<p class="mx-auto mt-2 max-w-md leading-relaxed text-[var(--muted)]">
					We will email you the demo link at
					<strong class="font-semibold text-[var(--ink)]">{form.email}</strong>, and a person will
					call if you would rather be walked through it. If it is urgent, write to
					<a class="font-semibold text-[var(--brand)] underline" href="mailto:hello@muallim.app"
						>hello@muallim.app</a
					>.
				</p>
			</div>
		{:else}
			<!-- The bar is the whole of the progress: three questions is short enough that
		     counting them out loud only makes it sound longer. It still announces
		     itself, because a bar a screen reader cannot read is decoration. -->
			<div
				class="h-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--ink)_8%,transparent)]"
				role="progressbar"
				aria-valuenow={step + 1}
				aria-valuemin={1}
				aria-valuemax={STEPS.length}
				aria-label="Step {step + 1} of {STEPS.length}"
			>
				<div
					class="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300 motion-reduce:transition-none"
					style="width: {((step + 1) / STEPS.length) * 100}%"
				></div>
			</div>

			<h2 class="mt-5 text-2xl font-extrabold tracking-tight text-[var(--ink)]">
				{STEPS[step].legend}
			</h2>
			<p class="mt-1 text-sm text-[var(--muted)]">{STEPS[step].hint}</p>

			<form method="POST" use:enhance class="mt-6">
				<!-- Every answer posts, whichever step is on screen. -->
				<input type="hidden" name="intent" value={intent} />
				{#if step !== 1}
					<input type="hidden" name="name" value={name} />
					<input type="hidden" name="email" value={email} />
					<input type="hidden" name="phone" value={phone} />
				{/if}
				{#if step !== 2 && agreed}
					<input type="hidden" name="agreed" value="on" />
				{/if}

				<!-- `key` restarts the transition; the grid stacks the outgoing step on the
			     incoming one so the card does not collapse mid-slide. -->
				{#key step}
					<div class="grid [&>*]:col-start-1 [&>*]:row-start-1">
						<div in:fly={slide}>
							{#if step === 0}
								<fieldset class="grid gap-2 sm:grid-cols-2">
									<legend class="sr-only">{STEPS[0].legend}</legend>
									{#each INTENTS as opt (opt.value)}
										<label
											class="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition {intent ===
											opt.value
												? 'border-[var(--brand)] bg-[var(--brand-tint)]'
												: 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'}"
										>
											<input
												class="mt-1 size-4 shrink-0 accent-[var(--brand)]"
												type="radio"
												value={opt.value}
												bind:group={intent}
											/>
											<span>
												<span class="block text-sm font-bold text-[var(--ink)]">{opt.label}</span>
												<span class="mt-0.5 block text-xs text-[var(--muted)]">{opt.line}</span>
											</span>
										</label>
									{/each}
								</fieldset>
							{:else if step === 1}
								<div class="grid gap-5">
									<div>
										<label class={label} for="name">Your name</label>
										<input
											class="{field} {errors.name ? bad : ok}"
											id="name"
											name="name"
											type="text"
											maxlength="200"
											autocomplete="name"
											aria-invalid={!!errors.name}
											bind:value={name}
										/>
										{#if errors.name}
											<p class="mt-1.5 text-sm font-semibold text-[var(--rose)]">{errors.name}</p>
										{/if}
									</div>
									<div class="grid gap-5 sm:grid-cols-2">
										<div>
											<label class={label} for="phone">Phone</label>
											<input
												class="{field} {errors.phone ? bad : ok}"
												id="phone"
												name="phone"
												type="tel"
												maxlength="40"
												autocomplete="tel"
												inputmode="tel"
												placeholder="01712 345678"
												aria-invalid={!!errors.phone}
												bind:value={phone}
											/>
											{#if errors.phone}
												<p class="mt-1.5 text-sm font-semibold text-[var(--rose)]">
													{errors.phone}
												</p>
											{/if}
										</div>
										<div>
											<label class={label} for="email">Email</label>
											<input
												class="{field} {errors.email ? bad : ok}"
												id="email"
												name="email"
												type="email"
												maxlength="320"
												autocomplete="email"
												aria-invalid={!!errors.email}
												bind:value={email}
											/>
											{#if errors.email}
												<p class="mt-1.5 text-sm font-semibold text-[var(--rose)]">
													{errors.email}
												</p>
											{/if}
										</div>
									</div>
								</div>
							{:else}
								<div class="grid gap-4">
									<!-- What they are about to send, before they agree to us holding it. -->
									<dl
										class="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm"
									>
										{#each [['Running', INTENTS.find((i) => i.value === intent)?.label ?? ''], ['Name', name], ['Phone', phone], ['Email', email]] as [k, v] (k)}
											<div class="flex justify-between gap-4">
												<dt class="text-[var(--muted)]">{k}</dt>
												<dd class="truncate font-semibold text-[var(--ink)]">{v}</dd>
											</div>
										{/each}
									</dl>

									<!-- Never pre-ticked, never re-ticked after a failure. Agreement is the
								     one thing on this page we must not do on somebody's behalf. -->
									<label class="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
										<input
											class="mt-1 size-4 shrink-0 accent-[var(--brand)]"
											type="checkbox"
											name="agreed"
											bind:checked={agreed}
											aria-invalid={!!errors.agreed}
										/>
										<span class="text-[var(--muted)]">
											I agree to the <a
												class="font-semibold text-[var(--brand)] underline"
												href="/#faq">terms and conditions</a
											>, and to Muallim holding these details to reply to me.
										</span>
									</label>
									{#if errors.agreed}
										<p class="text-sm font-semibold text-[var(--rose)]" role="alert">
											{errors.agreed}
										</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/key}

				{#if errors.intent}
					<p class="mt-3 text-sm font-semibold text-[var(--rose)]" role="alert">{errors.intent}</p>
				{/if}
				{#if form?.message}
					<p
						class="mt-4 rounded-xl border border-[color-mix(in_oklab,var(--rose)_40%,transparent)] bg-[var(--rose-tint)] px-4 py-3 text-sm font-semibold text-[var(--rose)]"
						role="alert"
					>
						{form.message}
					</p>
				{/if}

				<div class="mt-7 flex items-center justify-end gap-3">
					{#if step > 0}
						<button class="pill pill-quiet" type="button" onclick={back}>
							<Icon icon={ArrowLeft01Icon} class="size-4" /> Back
						</button>
					{/if}
					{#if step < STEPS.length - 1}
						<button class="pill pill-primary" type="button" onclick={advance}>
							Continue <Icon icon={ArrowRight02Icon} class="size-4" />
						</button>
					{:else}
						<button class="pill pill-primary" type="submit">
							Request a demo <Icon icon={ArrowRight02Icon} class="size-4" />
						</button>
					{/if}
				</div>
			</form>
		{/if}
	</section>

	<SiteCta />
</div>

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border-radius: 999px;
		padding: 0.8rem 1.4rem;
		font-weight: 600;
		text-decoration: none;
		border: 1px solid transparent;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}
	.pill-primary {
		background: var(--brand);
		color: var(--accent-tint);
	}
	.pill-primary:hover {
		background: var(--brand-soft);
	}
	.pill-quiet {
		background: var(--surface);
		border-color: var(--line);
		color: var(--ink);
	}
	.pill-quiet:hover {
		background: var(--surface-2);
	}
	@media (prefers-reduced-motion: reduce) {
		.pill {
			transition: none;
		}
	}
</style>
