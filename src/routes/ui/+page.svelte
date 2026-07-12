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
		ActionLink,
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		Checkbox,
		Difficulty,
		EmptyState,
		Field,
		Input,
		LessonIcon,
		Numeral,
		PageHeader,
		Progress,
		Radio,
		Row,
		Score,
		Select,
		Textarea,
		ThemeToggle,
		Verdict,
		type ButtonSize,
		type ButtonVariant
	} from '$lib/components';
	import { toast } from '$lib/toast.svelte';
	import {
		DURATION,
		DURATION_USE,
		EASE,
		EASE_STOCK_OUT,
		EASE_USE,
		type EaseName
	} from '$lib/motion';

	const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger', 'glass'];
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

	/*
		Motion, rendered from `$lib/motion` rather than restated here. The gallery is
		only worth having if it cannot disagree with the components.
	*/

	// Longer than any real UI animation, on purpose: at 180ms two curves are the same
	// blur. A demo is explanatory, and explanatory is allowed to take its time.
	const DEMO_MS = 900;

	const DEMOS = [
		...(Object.keys(EASE) as EaseName[]).map((name) => ({
			token: EASE_USE[name].token,
			use: EASE_USE[name].use,
			curve: EASE[name],
			stock: false
		})),
		{
			token: "Tailwind's stock ease-out",
			use: 'replaced — decelerates politely, lands soft',
			curve: EASE_STOCK_OUT,
			stock: true
		}
	];

	const DURATIONS = (Object.keys(DURATION) as (keyof typeof DURATION)[]).map((name) => ({
		name,
		ms: DURATION[name],
		use: DURATION_USE[name]
	}));

	// The rail's width is measured so the dot lands on its end rather than near it.
	let rail = $state(0);
	let playing = $state(false);
	let motionDemo = $state(false);

	// Two frames: one to put the dot back at the start with no transition running, one
	// to let the browser commit that before the new value retargets it.
	function replay() {
		playing = false;
		requestAnimationFrame(() => requestAnimationFrame(() => (playing = true)));
	}

	$effect(() => {
		replay();
	});
</script>

<svelte:head><title>Design system — Muallim</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-4xl px-6 py-16">
	<header>
		<div class="mb-6 flex justify-end"><ThemeToggle /></div>
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

	<!-- ---------------------------------------------------------------- motion -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Motion</h2>
		<p class="mt-1 max-w-2xl text-sm text-muted">
			Every curve and duration in the app comes from <code class="text-sm">$lib/motion</code> and
			the matching
			<code class="text-sm">--ease-*</code>
			/ <code class="text-sm">--duration-*</code> tokens. This section is rendered
			<em>from those objects</em>, not from a copy of them, so it cannot drift from what the
			components actually use.
		</p>

		<!-- The curves. Each row animates on the token it is naming, so the difference
		     between them is watched rather than read. -->
		<Card class="mt-6 p-6">
			<div class="flex flex-wrap items-baseline justify-between gap-3">
				<h3 class="font-medium">Curves</h3>
				<Button variant="secondary" size="sm" onclick={replay}>Replay</Button>
			</div>

			<p class="mt-1 text-sm text-muted">
				Built-in easings are too weak to read as deliberate, so <code class="text-sm"
					>--ease-out</code
				>
				overwrites Tailwind's. The last row is the one it replaced — the same
				<span class="numeral">{DEMO_MS}ms</span>, and it lands like an apology. Never
				<code class="text-sm">ease-in</code> on UI: it withholds the frames the eye is on.
			</p>

			<ul class="mt-5 space-y-5">
				{#each DEMOS as demo (demo.token)}
					<li>
						<div class="flex flex-wrap items-baseline justify-between gap-x-3">
							<code class="text-sm {demo.stock ? 'text-muted line-through' : 'text-accent-text'}">
								{demo.token}
							</code>
							<span class="text-xs text-muted">{demo.use}</span>
						</div>

						<!-- Travel is measured, not guessed, so the dot lands exactly at the end of
						     the rail. `translate` (not `left`) keeps it on the GPU. -->
						<div
							bind:clientWidth={rail}
							class="relative mt-2 h-8 rounded-control border border-border bg-surface-sunken"
						>
							<span
								class="absolute top-1/2 left-1 size-6 -translate-y-1/2 rounded-full
								       {demo.stock ? 'bg-border-strong' : 'bg-accent'}"
								style="translate: {playing ? Math.max(0, rail - 32) : 0}px 0;
								       transition: translate {DEMO_MS}ms {demo.curve};"
							></span>
						</div>

						<code class="mt-1.5 block text-xs text-muted">{demo.curve}</code>
					</li>
				{/each}
			</ul>
		</Card>

		<!-- The durations, straight out of DURATION. -->
		<Card class="mt-4 p-6">
			<h3 class="font-medium">Durations</h3>
			<p class="mt-1 text-sm text-muted">
				Anything a person is waiting on stays under <span class="numeral">200ms</span>; nothing on a
				UI surface goes past <span class="numeral">300ms</span>. In CSS these are reached as
				<code class="text-sm">duration-(--duration-base)</code> — the
				<code class="text-sm">--duration-*</code> namespace mints no utility of its own.
			</p>

			<dl class="mt-5 space-y-3">
				{#each DURATIONS as d (d.name)}
					<div
						class="flex flex-wrap items-baseline gap-x-3 border-b border-border pb-3 last:border-0"
					>
						<dt class="w-40 shrink-0">
							<code class="text-sm text-accent-text">--duration-{d.name}</code>
						</dt>
						<dd class="numeral w-16 shrink-0 text-sm font-medium">{d.ms}ms</dd>
						<dd class="min-w-0 flex-1 text-sm text-muted">{d.use}</dd>
					</div>
				{/each}
			</dl>
		</Card>

		<!-- Feedback. The components below are the live ones — nothing here is a mock. -->
		<Card class="mt-4 p-6">
			<h3 class="font-medium">Feedback</h3>
			<p class="mt-1 text-sm text-muted">
				Press these. A control that does not move under the pointer is a control the interface never
				admitted to hearing. Every one of them is the real component, gated behind
				<code class="text-sm">motion-safe</code>, so a reader who asked for less motion keeps the
				colour and loses the movement.
			</p>

			<div class="mt-5 flex flex-wrap items-center gap-3">
				<Button>Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button loading>Working</Button>
				<label class="ml-2 flex items-center gap-2 text-sm">
					<Checkbox checked={motionDemo} onchange={() => (motionDemo = !motionDemo)} />
					Tick settles in from 90%
				</label>
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

	<!-- --------------------------------------------------------- navigation -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Breadcrumbs</h2>
		<p class="text-muted mt-1 text-sm">
			The trail down to the page you are on. The last crumb is never a link — the component strips
			its href, so no caller has to remember.
		</p>

		<Card class="mt-6 p-5">
			<Breadcrumbs
				crumbs={[
					{ label: 'Courses', href: '/ui' },
					{ label: 'The Book of Optics', href: '/ui' },
					{ label: 'An introduction', href: '/ui' },
					{ label: 'Quiz', href: '/ui' }
				]}
			/>
		</Card>
	</section>

	<!-- --------------------------------------------------------------- rows -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Row</h2>
		<p class="text-muted mt-1 text-sm">
			One item in a list of things. With an <code>href</code> the whole row is the target, because a row
			whose only clickable area is its title is a row people click and miss.
		</p>

		<ul class="mt-6 space-y-2">
			<li>
				<Row href="/ui">
					<div>
						<p class="font-medium">Al-Khwarizmi</p>
						<p class="text-muted text-xs">Handed in · 2 files</p>
					</div>
					<Badge tone="warning">Late</Badge>
				</Row>
			</li>
			<li>
				<Row>
					<div>
						<p class="font-medium">Ibn al-Haytham</p>
						<p class="text-muted text-xs">Not a link — no href</p>
					</div>
					<Badge tone="success">Marked</Badge>
				</Row>
			</li>
		</ul>
	</section>

	<!-- --------------------------------------------------------- difficulty -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Difficulty</h2>
		<p class="text-muted mt-1 text-sm">
			A magnitude, drawn as one. Not a Badge: <code>success</code> and <code>danger</code> mean a pass
			and a failure everywhere else, and colouring "expert" red says a hard course is a broken one.
		</p>

		<Card class="mt-6 flex flex-wrap gap-8 p-5">
			<Difficulty level="beginner" />
			<Difficulty level="intermediate" />
			<Difficulty level="advanced" />
			<Difficulty level="expert" />
		</Card>
	</section>

	<!-- ------------------------------------------------------- lesson icons -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Lesson icons</h2>
		<p class="text-muted mt-1 text-sm">
			One per <code>content_type</code>. A type this list has not heard of gets the page icon, so a
			row never renders with a hole where its icon should be.
		</p>

		<Card class="mt-6 flex flex-wrap gap-6 p-5">
			{#each ['text', 'video', 'quiz', 'assignment', 'live', 'scorm', 'h5p', 'something-new'] as type (type)}
				<span class="text-muted flex items-center gap-2 text-sm">
					<LessonIcon contentType={type} />
					{type}
				</span>
			{/each}
		</Card>
	</section>

	<!-- --------------------------------------------------------- page shell -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Page and PageHeader</h2>
		<p class="text-muted mt-1 text-sm">
			Every page in the app sits in a <code>Page</code>, at one of three widths, with one
			<code>PageHeader</code>. Before these existed the same shell was copied fifteen times, and
			four of the copies had drifted.
		</p>

		<Card class="mt-6 p-5">
			<PageHeader title="Marking" description="What has been handed in, and what is still waiting.">
				{#snippet meta()}
					<Badge tone="neutral">draft</Badge>
					<span class="text-muted"><span class="numeral">12</span> submissions</span>
				{/snippet}
				{#snippet actions()}
					<Button size="sm">Publish</Button>
				{/snippet}
			</PageHeader>
		</Card>
	</section>

	<!-- ------------------------------------------------------------- surfaces -->
	<section class="mt-16">
		<h2 class="text-xl font-semibold">Shape, and the link that leaves</h2>
		<p class="text-muted mt-1 text-sm">
			A border separates and mostly nothing else does — except a card lying <em>on</em> the page
			rather than in it, which floats. Corners are squircles where the browser has
			<code>corner-shape</code>, and a rounded rectangle where it does not.
		</p>

		<div class="mt-6 grid gap-4 sm:grid-cols-3">
			<Card class="p-5">
				<p class="text-sm font-medium">border</p>
				<p class="text-muted mt-1 text-xs">In the page: a form, a table, a panel of rows.</p>
			</Card>

			<Card float class="p-5">
				<p class="text-sm font-medium">float</p>
				<p class="text-muted mt-1 text-xs">
					On the page: one of a scatter of cards. A hairline ring in dark mode, where a shadow is
					nothing.
				</p>
			</Card>

			<Card surface="aurora" class="p-5">
				<p class="text-sm font-medium">aurora</p>
				<p class="text-xs text-on-solid/80 mt-1">
					The brand's own light. Everything on it inverts — a glass button, inverse stars.
				</p>
			</Card>
		</div>

		<Card class="mt-4 flex flex-wrap items-center gap-6 p-5">
			<span class="squircle bg-surface-sunken px-4 py-2 text-sm">squircle · 1rem</span>
			<span class="squircle-sm bg-surface-sunken px-3 py-1.5 text-sm">squircle-sm · 0.75rem</span>
			<ActionLink href={resolve('/ui')}>A link that leaves</ActionLink>
			<ActionLink href={resolve('/ui')} tone="muted">The one beside a heading</ActionLink>
			<a class="underline-grow text-sm font-medium text-accent-text" href={resolve('/ui')}>
				underline-grow
			</a>
		</Card>

		<p class="text-muted mt-3 text-xs">
			The inner radius is smaller than the outer by exactly the gap between them, or the two curves
			do not nest — which is the wobble you see at one corner and nowhere else.
		</p>
	</section>

	<footer class="mt-20 border-t border-border pt-6 text-xs text-muted">
		Tokens in <code>src/lib/design/tokens.css</code> · components in
		<code>src/lib/components</code>
	</footer>
</main>
