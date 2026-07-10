<!--
	This page is for someone deciding whether to teach here. It says what they get,
	not how it is built. There is nothing about tenants, transactions, row-level
	security or iframes on it, because none of those are things a teacher wants and
	all of them are things a teacher has to translate.

	The healthcheck that used to sit in the middle of it has moved to /status,
	where the person who needs it can find it.
-->

<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Clock01Icon,
		Mortarboard02Icon,
		Quiz01Icon,
		SquareLock01Icon,
		UserGroup03Icon,
		VideoReplayIcon
	} from '@hugeicons/core-free-icons';
	import { Button, Card, Icon } from '$lib/components';

	/*
		Six things a teacher gets. Each one is something this system does today —
		certificates, assignments and the gradebook are not built, so they are not
		advertised — and each is said in the words a teacher would use.
	*/
	const FEATURES = [
		{
			icon: Quiz01Icon,
			title: 'Quizzes that mark themselves',
			// Marking really is queued, and the result page really does say "marking"
			// for a moment. Saying "instant" here would be a promise the product breaks
			// on the first slow day.
			body: 'Eight kinds of question, from true-or-false to matching pairs. Students hand one in and the result comes back a moment later, however long the quiz.'
		},
		{
			icon: UserGroup03Icon,
			title: 'Essays come to you',
			body: "Anything a computer shouldn't be judging lands in one tidy list, with the student's work beside it. Give it a mark and a comment; the grade settles itself."
		},
		{
			icon: Clock01Icon,
			title: 'Lessons on your schedule',
			body: 'Open a course all at once, on a chosen date, a few days after each student joins, or one lesson at a time as they finish the last.'
		},
		{
			icon: SquareLock01Icon,
			title: 'Let people try before they join',
			body: 'Offer a lesson as a free sample. Ask students to finish one course before they start the next. Everything else stays yours.'
		},
		{
			icon: VideoReplayIcon,
			title: 'Videos that simply play',
			body: 'Paste a link from YouTube, Vimeo or Cloudflare Stream. We tidy it up, drop the tracking, and it plays.'
		},
		{
			icon: Mortarboard02Icon,
			title: 'A space of your own',
			body: 'Your courses, your students, your name on the door. Nobody outside your school can see in.'
		}
	];
</script>

<svelte:head>
	<title>LMS — teach what you know</title>
	<meta
		name="description"
		content="Build a course, invite your students, and let the marking take care of itself."
	/>
</svelte:head>

<div class="min-h-dvh">
	<!-- The theme toggle floats at top-right, so the header keeps out of its way. -->
	<header class="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
		<div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6 pr-16">
			<a href={resolve('/')} class="flex items-center gap-2.5 font-semibold">
				<Icon icon={Mortarboard02Icon} class="size-6 text-accent" />
				LMS
			</a>

			<nav class="ml-auto flex items-center gap-2 text-sm">
				<Button href={resolve('/courses')} variant="ghost" size="sm">Courses</Button>
				<Button href={resolve('/login')} variant="ghost" size="sm">Sign in</Button>
				<Button href={resolve('/register')} size="sm">Get started</Button>
			</nav>
		</div>
	</header>

	<main>
		<!-- ------------------------------------------------------------------ hero -->
		<section class="relative overflow-hidden">
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 opacity-[0.07]"
				style="background: radial-gradient(48rem 28rem at 50% -10%, var(--accent), transparent 70%);"
			></div>

			<div class="relative mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
				<h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
					Teach what you know.
				</h1>

				<p class="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted">
					Build a course, invite your students, and let the marking take care of itself.
				</p>

				<div class="mt-10 flex flex-wrap justify-center gap-3">
					<Button href={resolve('/register')} size="lg">Start teaching</Button>
					<Button href={resolve('/courses')} size="lg" variant="secondary">Browse courses</Button>
				</div>

				<p class="mt-6 text-sm text-muted">It takes a minute to set up.</p>
			</div>
		</section>

		<!-- -------------------------------------------------------------- features -->
		<section class="mx-auto max-w-6xl px-6 pb-24">
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each FEATURES as feature (feature.title)}
					<Card class="p-6">
						<Icon icon={feature.icon} class="size-6 text-accent" />
						<h2 class="mt-4 font-semibold">{feature.title}</h2>
						<p class="mt-2 text-sm text-pretty text-muted">{feature.body}</p>
					</Card>
				{/each}
			</div>
		</section>

		<!-- ---------------------------------------------------------------- closing -->
		<section class="border-t border-border bg-surface-raised">
			<div class="mx-auto max-w-3xl px-6 py-20 text-center">
				<h2 class="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
					Start with one course.
				</h2>
				<p class="mx-auto mt-3 max-w-lg text-pretty text-muted">
					Write a lesson, add a quiz, invite the people who should see it. You can do the rest
					later.
				</p>
				<div class="mt-8">
					<Button href={resolve('/register')} size="lg">Start teaching</Button>
				</div>
			</div>
		</section>
	</main>

	<footer class="border-t border-border">
		<div
			class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-sm text-muted"
		>
			<span class="font-medium text-text">LMS</span>
			<a class="underline-offset-4 hover:underline" href={resolve('/courses')}>Courses</a>
			<a class="underline-offset-4 hover:underline" href={resolve('/login')}>Sign in</a>
			<a class="ml-auto underline-offset-4 hover:underline" href={resolve('/status')}>Status</a>
			<a class="underline-offset-4 hover:underline" href={resolve('/ui')}>Design system</a>
		</div>
	</footer>
</div>
