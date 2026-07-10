<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Alert02Icon,
		CheckmarkCircle02Icon,
		Clock01Icon,
		Mortarboard02Icon,
		Quiz01Icon,
		SquareLock01Icon,
		UserGroup03Icon,
		VideoReplayIcon,
		WifiDisconnected01Icon
	} from '@hugeicons/core-free-icons';
	import { Badge, Button, Card, Icon } from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const status = $derived(data.apiStatus);

	/*
		Every claim below is a thing this repository does today. Certificates,
		assignments and the gradebook are not here, so they are not here.
	*/
	const FEATURES = [
		{
			icon: Quiz01Icon,
			title: 'Quizzes that grade themselves',
			body: 'Eight question types, from true/false to matching. Submitting queues a job; nothing is graded in the request, so an essay quiz saves in milliseconds rather than seconds.'
		},
		{
			icon: UserGroup03Icon,
			title: 'Essays a person marks',
			body: 'What a machine cannot grade waits in a queue with the learner beside it. Marking the last answer settles the score and the pass, in the transaction that recorded it.'
		},
		{
			icon: Clock01Icon,
			title: 'Content that arrives when it should',
			body: 'Release a course all at once, on a date, a number of days after each learner enrols, or one lesson at a time as they finish the one before.'
		},
		{
			icon: SquareLock01Icon,
			title: 'Prerequisites and preview',
			body: 'Gate enrolment on finishing another course. Offer a lesson as a free sample. A reader who may not see a draft is told it does not exist, not that they are forbidden.'
		},
		{
			icon: VideoReplayIcon,
			title: 'Video that is safe to embed',
			body: 'YouTube, Vimeo and Cloudflare Stream links become a player URL the server wrote, from a video id it validated. What an author typed never reaches an iframe.'
		},
		{
			icon: Mortarboard02Icon,
			title: 'One workspace per school',
			body: 'Every query is scoped to its tenant, and a row-level security policy in Postgres backs it up. The database refuses what the code forgot.'
		}
	];
</script>

<svelte:head>
	<title>LMS — teach, assess, and prove it</title>
	<meta
		name="description"
		content="A multi-tenant learning management system: courses, drip content, quizzes that grade themselves, and essays a person marks."
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
					Teach, assess, and prove it.
				</h1>

				<p class="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted">
					A multi-tenant learning platform where grading happens in a background job, content
					arrives on a schedule, and a learner is never handed the answer.
				</p>

				<div class="mt-10 flex flex-wrap justify-center gap-3">
					<Button href={resolve('/register')} size="lg">Create a workspace</Button>
					<Button href={resolve('/courses')} size="lg" variant="secondary">Browse courses</Button>
				</div>

				<!--
					Four states, not one. A page that renders only the success case is
					unfinished — and this one is the honest signal that the API behind it is
					or is not answering. There is no loading branch, because `load` resolves
					before the page renders.
				-->
				<div class="mt-10 flex justify-center">
					{#if status.kind === 'ok'}
						<Badge tone="success" icon={CheckmarkCircle02Icon}>
							API reachable · <span class="numeral">{status.version}</span>
						</Badge>
					{:else if status.kind === 'unreachable'}
						<Badge tone="neutral" icon={WifiDisconnected01Icon}>
							API unreachable — run <code class="mx-1">make run</code> in lms-api
						</Badge>
					{:else}
						<Badge tone="warning" icon={Alert02Icon}>
							API returned <span class="numeral">{status.status}</span> · {status.message}
						</Badge>
					{/if}
				</div>
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
					Claim a workspace, write a lesson, attach a quiz. Invite the people who should see it.
				</p>
				<div class="mt-8">
					<Button href={resolve('/register')} size="lg">Create a workspace</Button>
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
			<a class="ml-auto underline-offset-4 hover:underline" href={resolve('/ui')}>Design system</a>
		</div>
	</footer>
</div>
