<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Alert02Icon,
		Award01Icon,
		Calendar03Icon,
		File01Icon,
		Globe02Icon,
		Megaphone01Icon,
		PlayCircleIcon,
		SquareLock01Icon,
		Task01Icon,
		Tick02Icon,
		UserGroupIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		Difficulty,
		Icon,
		LessonIcon,
		Page,
		Progress,
		Stars,
		Textarea
	} from '$lib/components';
	import { toast } from '$lib/toast.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const mediumDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
	const monthYear = new Intl.DateTimeFormat(undefined, { month: 'numeric', year: 'numeric' });
	const groupedNumber = new Intl.NumberFormat();

	// The star input's live value, seeded from any review the learner already left.
	// A writable $derived: it resettles to the loaded review, and the form writes to it.
	let myRating = $derived(data.myReview?.rating ?? 0);

	const hasReviews = $derived(data.reviewSummary.count > 0);
	const averageLabel = $derived(data.reviewSummary.average.toFixed(1));

	const enrolled = $derived(data.progress !== null);

	const crumbs = $derived([
		{ label: 'Courses', href: resolve('/courses') },
		{ label: data.course.title }
	]);

	const objectives = $derived(data.course.objectives ?? []);
	const requirements = $derived(data.course.requirements ?? []);
	const openPrerequisites = $derived(data.prerequisites.filter((p) => !p.done));

	/*
		Minutes, as a number. The unit is rendered beside it, not inside it.

		`.numeral` swaps in Geist Mono, and it belongs on digits: a whole phrase in it
		sets "17 min" and "5 lessons" in a monospace face, which is a typographic
		choice nobody made on purpose.
	*/
	function minutes(seconds: number): number {
		return Math.round(seconds / 60);
	}

	// "5h 47m", the way a syllabus states a length. Under an hour it is minutes.
	function span(seconds: number): string {
		const total = Math.round(seconds / 60);
		const hours = Math.floor(total / 60);
		return hours === 0 ? `${total}m` : `${hours}h ${total % 60}m`;
	}

	/*
		What the course is made of, counted from the curriculum already loaded.

		Every figure here is a fold over lessons the page was given. Nothing is
		guessed, and nothing costs a request: a course with no video says nothing
		about video rather than claiming zero hours of it.
	*/
	const includes = $derived.by(() => {
		const lessons = data.topics.flatMap((t) => t.lessons ?? []);
		const of = (type: string) => lessons.filter((l) => l.content_type === type);

		const videoSeconds = of('video').reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0);
		const items: { icon: typeof PlayCircleIcon; label: string }[] = [];

		if (videoSeconds > 0) {
			items.push({ icon: PlayCircleIcon, label: `${span(videoSeconds)} on-demand video` });
		}
		const articles = of('text').length;
		if (articles > 0) {
			items.push({
				icon: File01Icon,
				label: `${articles} ${articles === 1 ? 'article' : 'articles'}`
			});
		}
		const quizzes = of('quiz').length;
		if (quizzes > 0) {
			items.push({ icon: Task01Icon, label: `${quizzes} ${quizzes === 1 ? 'quiz' : 'quizzes'}` });
		}
		const assignments = of('assignment').length;
		if (assignments > 0) {
			items.push({
				icon: Task01Icon,
				label: `${assignments} ${assignments === 1 ? 'assignment' : 'assignments'}`
			});
		}
		items.push({ icon: Award01Icon, label: 'Certificate of completion' });
		return items;
	});

	// Sections start closed, as they do on any syllabus long enough to need them —
	// except the first, which is the one a reader opens anyway.
	let open = $state<Record<string, boolean>>({});
	const allOpen = $derived(
		data.topics.length > 0 && data.topics.every((t) => open[t.id] ?? t === data.topics[0])
	);

	function toggleAll() {
		const next = !allOpen;
		open = Object.fromEntries(data.topics.map((t) => [t.id, next]));
	}

	function isOpen(topicId: string, index: number): boolean {
		return open[topicId] ?? index === 0;
	}

	// The description is long by design, so it is clamped until asked for.
	let showFullDescription = $state(false);

	// One announcement open at a time. They are notices, not a thread.
	let shownAnnouncement = $state<string | null>(null);

	// The two acts that change what this reader may do, and both reach the API.
	let enrolling = $state(false);
	let cancelling = $state(false);

	const dripNotice: Record<string, string> = {
		scheduled: 'Lessons in this course open on their own dates.',
		after_enrolment: 'Lessons open a few days apart, counted from the day you enrol.',
		sequential: 'Lessons open one at a time, as you finish the one before.'
	};

	/**
	 * When a lesson opens, for this reader, or an empty string when it is already
	 * open — or when nobody can say.
	 *
	 * Sequential drip is deliberately absent: only muallim-api knows which lesson comes
	 * next, and guessing here would put a padlock on a lesson the server will hand
	 * over. A preview is never dripped.
	 */
	function opensOn(lesson: {
		is_preview: boolean;
		available_at?: string;
		available_after_days?: number;
	}): string {
		if (!enrolled || lesson.is_preview) return '';

		let when: Date | null = null;
		if (data.course.drip_mode === 'scheduled' && lesson.available_at) {
			when = new Date(lesson.available_at);
		} else if (
			data.course.drip_mode === 'after_enrolment' &&
			lesson.available_after_days != null &&
			data.enrolledAt
		) {
			// Constructed, not mutated, and by calendar day rather than by adding
			// milliseconds: muallim-api uses AddDate, and a span crossing a daylight-saving
			// boundary is 23 or 25 hours long, not 24.
			const from = new Date(data.enrolledAt);
			when = new Date(
				from.getFullYear(),
				from.getMonth(),
				from.getDate() + lesson.available_after_days,
				from.getHours(),
				from.getMinutes(),
				from.getSeconds()
			);
		}

		if (!when || when.getTime() <= Date.now()) return '';
		return when.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
	}

	const languageName = $derived.by(() => {
		try {
			return (
				new Intl.DisplayNames(undefined, { type: 'language' }).of(data.course.language) ??
				data.course.language
			);
		} catch {
			return data.course.language;
		}
	});
</script>

<svelte:head><title>{data.course.title} — Muallim</title></svelte:head>

<Page width="full">
	<!--
		The banner is a sunken panel, inset like everything else on the page — not a
		full-bleed band. A band that runs to the viewport's edge fights the page frame
		on every scroll, and the frame is what says where the content starts.

		The panel that asks you to enrol sits beside it and follows you down. On one
		column it comes first: on a phone the fold lands above the first heading.
	-->
	<div class="relative">
		<div class="rounded-card bg-surface-sunken p-6 sm:p-8 lg:pb-20">
			<div class="lg:mr-96 xl:mr-112">
				<Breadcrumbs {crumbs} />

				<div class="mt-5 flex flex-wrap items-center gap-2">
					{#if data.course.status !== 'published'}
						<Badge tone="warning">{data.course.status}</Badge>
					{/if}
					<Difficulty level={data.course.difficulty} />
				</div>

				<h1 class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
					{data.course.title}
				</h1>

				{#if data.course.summary}
					<p class="text-muted mt-4 max-w-2xl text-lg text-pretty">
						{data.course.summary}
					</p>
				{/if}

				<div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
					{#if hasReviews}
						<a href="#reviews" class="flex items-center gap-2">
							<span class="numeral font-medium">{averageLabel}</span>
							<Stars value={data.reviewSummary.average} size="sm" />
							<span class="text-muted underline underline-offset-4">
								<span class="numeral">{groupedNumber.format(data.reviewSummary.count)}</span>
								{data.reviewSummary.count === 1 ? 'rating' : 'ratings'}
							</span>
						</a>
					{/if}

					{#if data.course.learner_count > 0}
						<span class="text-muted flex items-center gap-1.5">
							<Icon icon={UserGroupIcon} class="size-4" />
							<span class="numeral">{groupedNumber.format(data.course.learner_count)}</span>
							{data.course.learner_count === 1 ? 'learner' : 'learners'}
						</span>
					{/if}
				</div>

				{#if data.course.instructor}
					<p class="text-muted mt-4 text-sm">
						Created by <span class="text-text font-medium">{data.course.instructor}</span>
					</p>
				{/if}

				<div class="text-muted mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
					<span class="flex items-center gap-1.5">
						<Icon icon={Calendar03Icon} class="size-4" />
						Last updated
						<span class="numeral">{monthYear.format(new Date(data.course.updated_at))}</span>
					</span>
					<span class="flex items-center gap-1.5">
						<Icon icon={Globe02Icon} class="size-4" />
						{languageName}
					</span>
				</div>
			</div>
		</div>

		<!-- ------------------------------------------------------------- panel -->
		<!--
			`bottom-0` is what makes the card follow you. An absolute box shrinks to its
			content, and a `sticky` child can only travel inside its parent — so without
			a parent as tall as the page, the card sticks for exactly its own height and
			then leaves with the hero.
		-->
		<div class="lg:absolute lg:inset-y-0 lg:top-8 lg:right-8 lg:w-80 xl:w-96">
			<div class="lg:sticky lg:top-24">
				<Card elevation="raised" class="mt-6 p-6 lg:mt-0">
					{#if enrolled}
						<!-- A bar is a picture of a number. The number goes next to it. -->
						<div class="flex items-baseline justify-between">
							<p class="text-sm font-medium">Your progress</p>
							<p class="text-sm font-medium">
								<span class="numeral">{data.progress?.percent ?? 0}</span>%
							</p>
						</div>

						<div class="mt-3">
							<Progress value={data.progress?.percent ?? 0} label="Course progress" />
						</div>

						<p class="text-muted mt-2 text-sm">
							<span class="numeral">{data.progress?.lessons_completed ?? 0}</span>
							of
							<span class="numeral">{data.progress?.lessons_total ?? 0}</span> lessons
						</p>

						{#if data.progress?.percent === 100}
							<p class="mt-4 flex items-center gap-2 text-sm text-success-text">
								<Icon icon={Tick02Icon} class="size-4" />
								You have finished this course.
							</p>

							<Button href={resolve('/certificates')} class="mt-5 w-full">
								View your certificate
							</Button>
						{/if}

						<Button
							href={resolve(`/courses/${data.course.slug}/grades`)}
							variant="secondary"
							size="sm"
							class="mt-3 w-full"
						>
							See your grades
						</Button>

						<Button
							href={resolve(`/courses/${data.course.slug}/notes`)}
							variant="secondary"
							size="sm"
							class="mt-3 w-full"
						>
							Your notes &amp; highlights
						</Button>

						<form
							method="POST"
							action="?/cancel"
							class="mt-3"
							use:enhance={() => {
								cancelling = true;
								return async ({ result, update }) => {
									await update();
									cancelling = false;

									if (result.type === 'failure' || result.type === 'error') return;
									// Progress survives a cancellation, and a learner about to lose
									// access is the person who most needs telling that it does.
									toast.info('Enrolment cancelled. Your progress is kept if you come back.');
								};
							}}
						>
							<Button
								type="submit"
								variant="ghost"
								size="sm"
								class="w-full"
								loading={cancelling}
								disabled={cancelling}
							>
								{cancelling ? 'Cancelling…' : 'Cancel enrolment'}
							</Button>
						</form>
					{:else if !data.signedIn}
						<p class="font-medium">Ready to start?</p>
						<p class="text-muted mt-1 text-sm">
							Sign in to enrol and keep track of what you have finished.
						</p>

						<Button
							href={`${resolve('/login')}?next=${encodeURIComponent(data.next)}`}
							class="mt-5 w-full"
						>
							Sign in to enrol
						</Button>
					{:else if openPrerequisites.length > 0}
						<h2 class="font-medium">Before you enrol</h2>

						<!--
							Every prerequisite, with its state — not only the unfinished ones. A
							learner halfway through a chain wants to see the half they have done.
						-->
						<ul class="mt-3 space-y-2">
							{#each data.prerequisites as prerequisite (prerequisite.slug)}
								<li class="text-sm">
									<a
										class="underline underline-offset-4"
										href={resolve(`/courses/${prerequisite.slug}`)}
									>
										{prerequisite.title}
									</a>
									<span class="text-muted block text-xs">
										{prerequisite.done ? 'finished' : 'not finished yet'}
									</span>
								</li>
							{/each}
						</ul>

						<!--
							Disabled because muallim-api will refuse. It refuses either way — a
							disabled button is a courtesy, not the control — and the list above
							names what to do about it.
						-->
						<Button disabled class="mt-5 w-full">Enrol</Button>
					{:else}
						<p class="font-medium">Ready to start?</p>
						<p class="text-muted mt-1 text-sm">
							Enrol to open every lesson and track what you have finished.
						</p>

						<!--
							Enrolling reaches the API and then reloads the page under you. Without
							a pending state the button is dead for as long as that takes, and a
							dead button is a button you press again.
						-->
						<form
							method="POST"
							action="?/enrol"
							class="mt-5"
							use:enhance={() => {
								enrolling = true;
								return async ({ result, update }) => {
									await update();
									enrolling = false;

									if (result.type === 'failure' || result.type === 'error') return;
									toast.success('You are enrolled. Every lesson is open.');
								};
							}}
						>
							<Button type="submit" class="w-full" loading={enrolling}>
								{enrolling ? 'Enrolling…' : 'Enrol'}
							</Button>
						</form>
					{/if}

					<!-- ------------------------------------------------ this includes -->
					<div class="mt-6 border-t border-border pt-5">
						<p class="text-sm font-medium">This course includes</p>
						<ul class="mt-3 space-y-2">
							{#each includes as item (item.label)}
								<li class="text-muted flex items-center gap-2.5 text-sm">
									<Icon icon={item.icon} class="size-4 shrink-0" />
									{item.label}
								</li>
							{/each}
						</ul>
					</div>

					{#if data.prerequisites.length > 0 && openPrerequisites.length === 0}
						<div class="mt-6 border-t border-border pt-5">
							<p class="text-muted text-xs">Prerequisites, all finished:</p>
							<ul class="mt-2 space-y-1">
								{#each data.prerequisites as prerequisite (prerequisite.slug)}
									<li class="flex items-center gap-1.5 text-xs text-success-text">
										<Icon icon={Tick02Icon} class="size-3.5" />
										{prerequisite.title}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</Card>
			</div>
		</div>

		<!--
			Inside the same positioned wrapper as the panel, deliberately. The panel is
			absolute against this wrapper, and `sticky` can only travel as far as its
			containing block: end the wrapper at the hero and the card stops following
			you exactly where a reader starts needing it.
		-->
		<div class="mt-10 lg:mr-96 lg:mt-8 xl:mr-112">
			{#if form?.message}
				<Alert tone="danger" class="mb-6" role="alert">{form.message}</Alert>
			{/if}

			{#if data.course.drip_mode !== 'none' && dripNotice[data.course.drip_mode]}
				<p class="text-muted mb-6 flex items-start gap-2 text-sm">
					<Icon icon={Alert02Icon} class="mt-0.5 size-3.5 shrink-0" />
					{dripNotice[data.course.drip_mode]}
				</p>
			{/if}

			<!-- ------------------------------------------------- what you'll learn -->
			{#if objectives.length > 0}
				<section>
					<Card class="p-6 sm:p-8">
						<h2 class="text-xl font-semibold">What you'll learn</h2>
						<ul class="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
							{#each objectives as objective (objective)}
								<li class="flex items-start gap-3 text-sm">
									<Icon icon={Tick02Icon} class="text-muted mt-0.5 size-4 shrink-0" />
									<span class="text-pretty">{objective}</span>
								</li>
							{/each}
						</ul>
					</Card>
				</section>
			{/if}

			<!-- ----------------------------------------------------- announcements -->
			<!--
				A notice is worth a line until somebody wants it. Two of them used to open
				the page with a wall of tinted cards, above the syllabus a reader came for
				— so each is a row now, and the body is behind its own title.
			-->
			{#if data.announcements.length > 0}
				<section class="mt-10">
					<h2 class="flex items-center gap-2 text-sm font-medium">
						<Icon icon={Megaphone01Icon} class="text-accent-text size-4" />
						Announcements
						<span class="text-muted numeral text-xs">{data.announcements.length}</span>
					</h2>

					<Card
						class="border-accent-border bg-accent-surface/30 divide-y divide-accent-border mt-3"
					>
						{#each data.announcements as announcement (announcement.id)}
							{@const isShown = shownAnnouncement === announcement.id}
							<div>
								<button
									type="button"
									class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-surface/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
									aria-expanded={isShown}
									aria-controls="announcement-{announcement.id}"
									onclick={() => (shownAnnouncement = isShown ? null : announcement.id)}
								>
									<Icon icon={Megaphone01Icon} class="text-accent-text size-4 shrink-0" />

									<span class="min-w-0 flex-1 truncate text-sm font-medium">
										{announcement.title}
									</span>

									<time class="text-muted numeral hidden shrink-0 text-xs sm:block">
										{mediumDate.format(new Date(announcement.created_at))}
									</time>

									<span class="text-accent-text shrink-0 text-xs font-medium">
										{isShown ? 'Hide' : 'Read'}
									</span>
								</button>

								{#if isShown}
									<p
										id="announcement-{announcement.id}"
										class="text-muted px-4 pb-4 pl-11 text-sm whitespace-pre-wrap"
									>
										{announcement.body}
									</p>
								{/if}
							</div>
						{/each}
					</Card>
				</section>
			{/if}

			<!-- -------------------------------------------------------- curriculum -->
			<section class="mt-12">
				<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
					<h2 class="text-xl font-semibold">Course content</h2>

					{#if data.topics.length > 0}
						<button
							type="button"
							class="text-sm font-medium text-accent-text underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							onclick={toggleAll}
						>
							{allOpen ? 'Collapse all sections' : 'Expand all sections'}
						</button>
					{/if}
				</div>

				{#if data.topics.length === 0}
					<p class="text-muted mt-4 text-sm">This course has no lessons yet.</p>
				{:else}
					<p class="text-muted mt-2 text-sm">
						<span class="numeral">{data.topics.length}</span>
						{data.topics.length === 1 ? 'section' : 'sections'} •
						<span class="numeral">{data.lessonCount}</span>
						{data.lessonCount === 1 ? 'lesson' : 'lessons'}
						{#if data.durationSeconds}
							• <span class="numeral">{span(data.durationSeconds)}</span> total length
						{/if}
					</p>

					<ol class="mt-4 space-y-3">
						{#each data.topics as topic, section (topic.id)}
							{@const lessons = topic.lessons ?? []}
							{@const seconds = lessons.reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0)}
							<li class="overflow-hidden rounded-card border border-border">
								<!--
								A section is a disclosure, not a link. `<details>` would do it without
								script, but "expand all" has to drive them, and a details element
								driven from outside is a details element fighting you.
							-->
								<h3>
									<button
										type="button"
										class="flex w-full items-center gap-3 bg-surface-sunken px-5 py-4 text-left transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
										aria-expanded={isOpen(topic.id, section)}
										aria-controls="section-{topic.id}"
										onclick={() => (open[topic.id] = !isOpen(topic.id, section))}
									>
										<svg
											class="text-muted size-4 shrink-0 transition-transform duration-150"
											class:rotate-180={isOpen(topic.id, section)}
											viewBox="0 0 20 20"
											fill="none"
											stroke="currentColor"
											stroke-width="1.75"
											aria-hidden="true"
										>
											<path
												d="M5 7.5 10 12.5 15 7.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>

										<span class="min-w-0 flex-1 font-medium text-pretty">{topic.title}</span>

										<span class="text-muted shrink-0 text-xs">
											<span class="numeral">{lessons.length}</span>
											{lessons.length === 1 ? 'lecture' : 'lectures'}
											{#if seconds > 0}
												• <span class="numeral">{span(seconds)}</span>
											{/if}
										</span>
									</button>
								</h3>

								{#if isOpen(topic.id, section)}
									<ul id="section-{topic.id}" class="divide-y divide-border border-t border-border">
										{#each lessons as lesson (lesson.id)}
											{@const locked = opensOn(lesson)}
											<li>
												<!--
												Every lesson is linked. Whether its body is readable is decided
												by muallim-api from the reader's entitlement, and a lesson they may
												not open answers 404 — so hiding the link would only make the
												course look emptier than it is.
											-->
												<a
													href={resolve(`/courses/${data.course.slug}/lessons/${lesson.id}`)}
													class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
												>
													<span class="text-muted shrink-0">
														{#if locked}
															<Icon icon={SquareLock01Icon} class="size-4" />
														{:else}
															<LessonIcon contentType={lesson.content_type} />
														{/if}
													</span>

													<span class="min-w-0 flex-1 truncate text-sm">{lesson.title}</span>

													<span class="flex shrink-0 items-center gap-3">
														{#if lesson.is_preview && !enrolled}
															<Badge tone="accent">Preview</Badge>
														{/if}

														{#if locked}
															<span class="text-muted text-xs">Opens {locked}</span>
														{:else if lesson.duration_seconds}
															<span class="text-muted numeral text-xs">
																{minutes(lesson.duration_seconds)}:00
															</span>
														{/if}
													</span>
												</a>
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ol>
				{/if}
			</section>

			<!-- ------------------------------------------------------ requirements -->
			{#if requirements.length > 0 || data.prerequisites.length > 0}
				<section class="mt-12">
					<h2 class="text-xl font-semibold">Requirements</h2>

					<ul class="text-muted mt-4 space-y-2.5">
						{#each requirements as requirement (requirement)}
							<li class="flex items-start gap-3 text-sm">
								<span class="mt-2 size-1.5 shrink-0 rounded-full bg-border-strong"></span>
								<span class="text-pretty">{requirement}</span>
							</li>
						{/each}

						<!--
						A prerequisite course is a requirement with an address. It is listed
						here as well as in the panel, because this is where a reader deciding
						whether to start looks for it.
					-->
						{#each data.prerequisites as prerequisite (prerequisite.slug)}
							<li class="flex items-start gap-3 text-sm">
								<span class="mt-2 size-1.5 shrink-0 rounded-full bg-border-strong"></span>
								<span>
									Finish
									<a
										class="text-accent-text underline underline-offset-4"
										href={resolve(`/courses/${prerequisite.slug}`)}
									>
										{prerequisite.title}
									</a>
									{#if prerequisite.done}
										<span class="text-success-text">— done</span>
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<!-- ------------------------------------------------------- description -->
			{#if data.course.description}
				<section class="mt-12">
					<h2 class="text-xl font-semibold">Description</h2>

					<div class="relative mt-4">
						<div
							id="course-description"
							class="text-muted max-w-2xl space-y-4 text-sm leading-relaxed whitespace-pre-wrap"
							class:max-h-64={!showFullDescription}
							class:overflow-hidden={!showFullDescription}
						>
							{data.course.description}
						</div>

						{#if !showFullDescription}
							<!-- The fade says there is more, before the button has to. -->
							<div
								class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent"
							></div>
						{/if}
					</div>

					<button
						type="button"
						class="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent-text underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						aria-expanded={showFullDescription}
						aria-controls="course-description"
						onclick={() => (showFullDescription = !showFullDescription)}
					>
						{showFullDescription ? 'Show less' : 'Show more'}
					</button>
				</section>
			{/if}

			<!-- ----------------------------------------------------------- reviews -->
			<section id="reviews" class="mt-12 scroll-mt-24">
				<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
					<h2 class="text-xl font-semibold">Reviews</h2>
					{#if hasReviews}
						<span class="text-muted flex items-center gap-2 text-sm">
							<Stars value={data.reviewSummary.average} size="sm" />
							<span>
								<span class="numeral">{averageLabel}</span> from
								<span class="numeral">{data.reviewSummary.count}</span>
								{data.reviewSummary.count === 1 ? 'learner' : 'learners'}
							</span>
						</span>
					{/if}
				</div>

				{#if form?.reviewMessage}
					<Alert tone="danger" class="mt-4" role="alert">{form.reviewMessage}</Alert>
				{/if}

				<!--
				Only an enrolled learner may review, and muallim-api enforces it. The form
				shows for them; everyone else reads the wall.
			-->
				{#if enrolled}
					<Card class="mt-4 p-5">
						<form method="POST" action="?/review" use:enhance>
							<p class="text-sm font-medium">
								{data.myReview ? 'Your review' : 'Share what you thought'}
							</p>
							<div class="mt-3">
								<Stars name="rating" bind:value={myRating} />
							</div>
							<Textarea
								name="body"
								class="mt-4"
								rows={3}
								maxlength={4000}
								placeholder="What would you tell someone deciding whether to take this course? (optional)"
								value={data.myReview?.body ?? ''}
							/>
							<!-- The commit sits at the end of the form, where the eye leaves it. -->
							<div class="mt-4 flex items-center justify-end gap-3">
								{#if data.myReview}
									<Button formaction="?/unreview" type="submit" variant="ghost" size="sm">
										Remove
									</Button>
								{/if}
								<Button type="submit" size="sm">
									{data.myReview ? 'Update review' : 'Post review'}
								</Button>
							</div>
						</form>
					</Card>
				{/if}

				{#if hasReviews}
					<ul class="mt-6 space-y-4">
						{#each data.reviews as review (review.created_at + review.author_name)}
							<li>
								<Card class="p-5">
									<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
										<div class="flex items-center gap-2">
											<Stars value={review.rating} size="sm" />
											<span class="text-sm font-medium">
												{review.author_name || 'A learner'}
											</span>
										</div>
										<time class="text-muted numeral shrink-0 text-xs">
											{mediumDate.format(new Date(review.created_at))}
										</time>
									</div>
									{#if review.body}
										<p class="text-muted mt-2 text-sm whitespace-pre-wrap">{review.body}</p>
									{/if}
								</Card>
							</li>
						{/each}
					</ul>
				{:else if !enrolled}
					<p class="text-muted mt-4 text-sm">No reviews yet.</p>
				{/if}
			</section>
		</div>
	</div>
</Page>
