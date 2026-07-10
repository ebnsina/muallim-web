<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		BookOpen01Icon,
		CheckmarkCircle02Icon,
		File01Icon,
		PencilEdit02Icon,
		SquareLock01Icon
	} from '@hugeicons/core-free-icons';

	import {
		Alert,
		Badge,
		Button,
		Card,
		Checkbox,
		EmptyState,
		Field,
		Input,
		Numeral,
		Progress,
		Radio,
		Score,
		Select,
		Textarea,
		Verdict,
		type ButtonSize,
		type ButtonVariant
	} from '$lib/components';
	import { toast } from '$lib/toast.svelte';

	const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
	const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

	/** The twelve steps, so a designer can see what each one is for. */
	const RAMPS = [
		{ name: 'neutral', prefix: '--n-' },
		{ name: 'brand', prefix: '--b-' },
		{ name: 'success', prefix: '--ok-' },
		{ name: 'danger', prefix: '--no-' },
		{ name: 'warning', prefix: '--wa-' }
	];

	const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

	const SEMANTIC = [
		['surface', 'the page'],
		['surface-raised', 'a card, a field'],
		['surface-sunken', 'a well, a disabled field'],
		['border', 'separates'],
		['border-control', 'identifies a field — 3:1'],
		['accent', 'the primary action'],
		['success', 'passed, correct'],
		['danger', 'failed, destructive'],
		['warning', 'needs attention']
	];

	let choice = $state('a');

	// The rolling numerals and the toast stack both only mean anything in motion,
	// so the gallery has to be able to move them.
	let score = $state(8);
	let toastCount = $state(0);

	const TOAST_TONES = ['info', 'success', 'warning', 'danger'] as const;
</script>

<svelte:head><title>Design system — Muallim</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-4xl px-6 py-16">
	<header>
		<p class="text-sm font-medium text-accent-text">Design system</p>
		<h1 class="mt-1 text-4xl font-semibold">Components</h1>
		<p class="mt-3 max-w-2xl text-muted">
			Every colour here is a semantic token, never a hex. Every pair that carries text or marks the
			edge of a control is checked against WCAG 2.2 AA by
			<code class="text-sm">contrast.spec.ts</code>, in both colour schemes. Change your system
			appearance to see the dark ramp.
		</p>
	</header>

	<!-- ------------------------------------------------------------ typography -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Typography</h2>
		<p class="mt-1 text-sm text-muted">
			Mona Sans for language. Geist Mono for anything the reader compares against another number.
		</p>

		<Card class="mt-6 p-6">
			<p class="text-4xl font-semibold">Introduction to Go</p>
			<p class="mt-2 text-2xl font-semibold">A chapter heading</p>
			<p class="mt-2 text-lg font-medium">A section heading</p>
			<p class="mt-4 text-base">
				Body copy at sixteen pixels. The quick brown fox jumps over the lazy dog — Illegal1 vs
				lIlegaI0, which is why the letterforms matter when a learner types an answer back.
			</p>
			<p class="mt-2 text-sm text-muted">
				Muted, fourteen pixels. Used for hints, timestamps, and the second line of a row.
			</p>

			<hr class="my-6 border-border" />

			<p class="text-sm font-medium">Numerals are monospaced and tabular</p>
			<p class="mt-2 text-xs text-muted">
				Digits keep the same width, so a score changing from 9 to 10 does not nudge the words beside
				it, and a column of marks lines up.
			</p>
			<table class="mt-3 text-sm">
				<tbody>
					{#each [{ who: 'Fatima al-Fihri', score: 8, of: 15 }, { who: 'Maryam al-Astrulabi', score: 13, of: 15 }, { who: 'Al-Khwarizmi', score: 145, of: 150 }] as row (row.who)}
						<tr>
							<td class="py-1 pr-8">{row.who}</td>
							<td class="numeral py-1 text-right">{row.score}</td>
							<td class="py-1 pl-1 text-muted">/</td>
							<td class="numeral py-1 pl-1 text-muted">{row.of}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Card>

		<Card class="mt-4 p-6">
			<p class="text-sm font-medium">Lesson prose</p>
			<p class="mt-1 text-xs text-muted">
				18px / 1.6 over a 65ch measure — the one place the 16px UI default is broken.
			</p>
			<div class="prose mt-4">
				<p>
					Go was designed at Google in 2007 to improve programming productivity in an era of
					multicore, networked machines and large codebases. Its designers wanted to address
					criticism of other languages in use at Google, while keeping their useful characteristics.
				</p>
				<p>
					The line length here is sixty-five characters, which is the middle of a range the reading
					research argues about: Ruder said fifty to sixty, Bringhurst sixty-six, and WCAG caps it
					at eighty.
				</p>
			</div>
		</Card>
	</section>

	<!-- ---------------------------------------------------------------- colour -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Colour</h2>
		<p class="mt-1 text-sm text-muted">
			Twelve steps per ramp, each with one assigned job. Hover and active are steps in the palette,
			not an opacity guess.
		</p>

		<div class="mt-6 space-y-3">
			{#each RAMPS as ramp (ramp.name)}
				<div>
					<p class="mb-1 text-xs font-medium text-muted">{ramp.name}</p>
					<div class="flex overflow-hidden rounded-control border border-border">
						{#each STEPS as step (step)}
							<div
								class="h-10 flex-1"
								style="background: var({ramp.prefix}{step})"
								title="{ramp.prefix}{step}"
							></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<p class="mt-6 text-xs text-muted">
			1–2 backgrounds · 3–5 component fill, hover, active · 6–8 borders · 9–10 solid fill and its
			hover · 11–12 text
		</p>

		<div class="mt-6 grid gap-2 sm:grid-cols-3">
			{#each SEMANTIC as [name, purpose] (name)}
				<div class="flex items-center gap-3 rounded-control border border-border p-2">
					<div
						class="size-8 shrink-0 rounded border border-border"
						style="background: var(--{name})"
					></div>
					<div class="min-w-0">
						<p class="truncate text-xs font-medium">{name}</p>
						<p class="truncate text-xs text-muted">{purpose}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- --------------------------------------------------------------- buttons -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Button</h2>

		<Card class="mt-6 space-y-6 p-6">
			<div class="flex flex-wrap items-center gap-3">
				{#each VARIANTS as variant (variant)}
					<Button {variant}>{variant}</Button>
				{/each}
			</div>

			<div class="flex flex-wrap items-center gap-3">
				{#each SIZES as size (size)}
					<Button {size} variant="secondary">size {size}</Button>
				{/each}
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<Button disabled>disabled</Button>
				<Button loading>submitting</Button>
				<Button href={resolve('/ui')} variant="secondary">a link, not a button</Button>
				<Button href={resolve('/ui')} disabled variant="secondary">a disabled link</Button>
			</div>
		</Card>
	</section>

	<!-- ----------------------------------------------------------------- forms -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Form controls</h2>
		<p class="mt-1 text-sm text-muted">
			<code class="text-xs">Field</code> owns the label, the hint, and the error, and hands the control
			the ids to point at.
		</p>

		<Card class="mt-6 space-y-6 p-6">
			<Field id="demo-title" label="Course title" hint="Shown in the catalogue.">
				{#snippet children({ id, describedBy, invalid })}
					<Input {id} aria-describedby={describedBy} {invalid} placeholder="Introduction to Go" />
				{/snippet}
			</Field>

			<Field
				id="demo-points"
				label="Points"
				hint="Zero or more."
				error="Points must be a whole number."
			>
				{#snippet children({ id, describedBy, invalid })}
					<Input {id} aria-describedby={describedBy} {invalid} value="three" class="numeral" />
				{/snippet}
			</Field>

			<Field id="demo-type" label="Question type">
				{#snippet children({ id, describedBy, invalid })}
					<Select {id} aria-describedby={describedBy} {invalid}>
						<option>single choice</option>
						<option>multiple choice</option>
						<option>open ended</option>
					</Select>
				{/snippet}
			</Field>

			<Field id="demo-body" label="Lesson body">
				{#snippet children({ id, describedBy, invalid })}
					<Textarea {id} aria-describedby={describedBy} {invalid} placeholder="Write the lesson…" />
				{/snippet}
			</Field>

			<fieldset class="space-y-2">
				<legend class="text-sm font-medium">Which is compiled?</legend>
				{#each [['a', 'Python'], ['b', 'Go']] as [value, label] (value)}
					<div class="flex items-center gap-2">
						<Radio
							id="demo-radio-{value}"
							name="demo-radio"
							{value}
							checked={choice === value}
							onchange={() => (choice = value)}
						/>
						<label for="demo-radio-{value}" class="text-sm">{label}</label>
					</div>
				{/each}
			</fieldset>

			<div class="flex items-center gap-2">
				<Checkbox id="demo-preview" />
				<label for="demo-preview" class="text-sm">Free preview — readable without enrolling</label>
			</div>
		</Card>
	</section>

	<!-- --------------------------------------------------------------- notices -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Alert</h2>
		<p class="mt-1 text-sm text-muted">
			Icon, colour, and a visually-hidden word. A screen reader hears “Error:” before the message;
			colour is never the only signal.
		</p>

		<div class="mt-6 space-y-3">
			<Alert tone="info"
				>Your attempt is being graded. This page will update when it is ready.</Alert
			>
			<Alert tone="success" title="Passed">You scored 13 of 15. The lesson is complete.</Alert>
			<Alert tone="warning">One of your answers needs a person. Your score is not final yet.</Alert>
			<Alert tone="danger">A single-choice question has exactly one correct option.</Alert>
		</div>
	</section>

	<!-- --------------------------------------------------------- status, scores -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Status</h2>

		<Card class="mt-6 space-y-6 p-6">
			<div class="flex flex-wrap gap-2">
				<Badge icon={PencilEdit02Icon}>Draft</Badge>
				<Badge tone="success" icon={CheckmarkCircle02Icon}>Published</Badge>
				<Badge tone="accent" icon={BookOpen01Icon}>Enrolled</Badge>
				<Badge tone="warning" icon={SquareLock01Icon}>Locked</Badge>
				<Badge tone="danger">3 waiting</Badge>
			</div>

			<div class="flex flex-wrap gap-6">
				<Verdict kind="correct" />
				<Verdict kind="partial" />
				<Verdict kind="incorrect" />
				<Verdict kind="pending" />
			</div>

			<hr class="border-border" />

			<div class="space-y-6">
				<Score points={13} maxPoints={15} passed={true} />
				<Score points={5} maxPoints={15} passed={false} />
				<Score points={5} maxPoints={15} />
			</div>
		</Card>
	</section>

	<!-- ------------------------------------------------------------- numerals -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Rolling numerals</h2>
		<p class="mt-1 text-sm text-muted">
			A score that changes rolls to its new value. The digits are real text in a translated column,
			so the number is in the DOM whether or not it animates — and under <code class="text-xs"
				>prefers-reduced-motion</code
			> it simply jumps.
		</p>

		<Card class="mt-6 space-y-6 p-6">
			<Numeral value={score} class="text-5xl font-semibold" />

			<div class="flex flex-wrap gap-3">
				<Button size="sm" variant="secondary" onclick={() => (score = Math.max(0, score - 1))}>
					−1
				</Button>
				<Button size="sm" variant="secondary" onclick={() => (score += 1)}>+1</Button>
				<Button size="sm" variant="secondary" onclick={() => (score += 37)}>+37</Button>
				<Button size="sm" variant="ghost" onclick={() => (score = 0)}>reset</Button>
			</div>

			<p class="text-xs text-muted">
				Watch the units column when it crosses ten: it rolls 9 → 0 and a tens column slides in
				beside it, because the columns are keyed by place and not by index.
			</p>
		</Card>
	</section>

	<!-- --------------------------------------------------------------- toasts -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Toast</h2>
		<p class="mt-1 text-sm text-muted">
			Collapsed to a stack, fanned out on hover or focus. Hovering pauses every countdown, so a
			notice cannot expire out from under the cursor reaching for its dismiss button. Errors are
			pinned until dismissed.
		</p>

		<Card class="mt-6 space-y-4 p-6">
			<div class="flex flex-wrap gap-3">
				{#each TOAST_TONES as tone (tone)}
					<Button
						size="sm"
						variant={tone === 'danger' ? 'danger' : 'secondary'}
						onclick={() => {
							toastCount += 1;
							toast[tone](`Notice number ${toastCount}.`, {
								title: tone === 'success' ? 'Saved' : undefined
							});
						}}
					>
						{tone}
					</Button>
				{/each}

				<Button
					size="sm"
					variant="ghost"
					onclick={() => {
						for (let i = 0; i < 4; i++) {
							toastCount += 1;
							toast.info(`Notice number ${toastCount}.`, { duration: 0 });
						}
					}}
				>
					stack four
				</Button>
			</div>

			<p class="text-xs text-muted">
				They appear in the corner of the window. Three are drawn; the rest wait behind.
			</p>
		</Card>
	</section>

	<!-- -------------------------------------------------------------- progress -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Progress</h2>
		<p class="mt-1 text-sm text-muted">
			A bar is a picture of a number, so the number is always beside it.
		</p>

		<Card class="mt-6 space-y-5 p-6">
			<div>
				<div class="mb-2 flex items-baseline justify-between text-sm">
					<span class="font-medium">Introduction to Go</span>
					<span class="numeral text-muted">8 of 12 lessons · 66%</span>
				</div>
				<Progress value={8} max={12} label="8 of 12 lessons complete" />
			</div>

			<div>
				<div class="mb-2 flex items-baseline justify-between text-sm">
					<span class="font-medium">Concurrency</span>
					<span class="numeral text-muted">12 of 12 lessons · 100%</span>
				</div>
				<Progress value={12} max={12} tone="success" label="Course complete" />
			</div>
		</Card>
	</section>

	<!-- ----------------------------------------------------------- empty states -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Empty state</h2>

		<div class="mt-6 grid gap-4 sm:grid-cols-2">
			<EmptyState
				icon={File01Icon}
				title="Nothing to mark"
				description="Submitted essays will appear here as learners finish the quiz."
			/>
			<EmptyState
				icon={BookOpen01Icon}
				title="No courses yet"
				description="Create one to get started."
			>
				{#snippet action()}
					<Button size="sm">Create a course</Button>
				{/snippet}
			</EmptyState>
		</div>
	</section>

	<footer class="mt-20 border-t border-border pt-6 text-xs text-muted">
		Tokens in <code>src/lib/design/tokens.css</code> · components in
		<code>src/lib/components</code>
	</footer>
</main>
