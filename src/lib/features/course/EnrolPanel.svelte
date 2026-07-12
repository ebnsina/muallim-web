<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Award01Icon,
		File01Icon,
		PlayCircleIcon,
		PlayIcon,
		Task01Icon,
		Tick02Icon
	} from '@hugeicons/core-free-icons';
	import { Button, Card, Icon, Numeral, Progress as ProgressBar } from '$lib/components';
	import { toast } from '$lib/toast.svelte';
	import { span } from './duration';
	import type { CourseDetail, Prerequisite, Progress, TopicView } from './types';

	type Props = {
		course: CourseDetail;
		topics: TopicView[];
		progress: Progress | null;
		prerequisites: Prerequisite[];
		signedIn: boolean;
		/** Where to return to after signing in. */
		next: string;
	};

	let { course, topics, progress, prerequisites, signedIn, next }: Props = $props();

	/*
		⚠️ The stock preview. One clip, every course, and it teaches nothing.

		It is here because the shape of the card needs it and muallim-api cannot answer
		yet: `catalog` has no preview column and `media` has nowhere to put one. When
		the course carries `preview_url` and `preview_poster`, read them off `course`
		and delete these two lines — the markup below does not change.
	*/
	const PREVIEW_SRC = '/stock/course-preview.mp4';
	const PREVIEW_POSTER = '/stock/course-preview.jpg';

	let video = $state<HTMLVideoElement>();
	let playing = $state(false);

	function play() {
		playing = true;
		video?.play();
	}

	const enrolled = $derived(progress !== null);
	const openPrerequisites = $derived(prerequisites.filter((p) => !p.done));

	// The two acts that change what this reader may do, and both reach the API.
	let enrolling = $state(false);
	let cancelling = $state(false);

	/*
		What the course is made of, counted from the curriculum already loaded.

		Every figure is a fold over lessons this component was given. Nothing is
		guessed and nothing costs a request: a course with no video says nothing about
		video rather than claiming zero hours of it.
	*/
	const includes = $derived.by(() => {
		const lessons = topics.flatMap((t) => t.lessons ?? []);
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
</script>

<!-- Float, not a heavier border. It stands on the course's aurora, and a border on
     a card lying on light is an outline drawn around a thing that is already
     plainly separate; the shadow is what says it is lifted off. -->
<Card float class="mt-6 overflow-hidden p-0 lg:mt-0">
	<!--
		The preview, at the top of the card that asks you to enrol — the shape every
		catalogue on the web has settled on, because a person decides with their eyes
		before they read a word of the syllabus.

		⚠️ PLACEHOLDER. `static/stock/course-preview.mp4` is a generated gradient with
		no teaching in it, the same clip on every course. muallim-api has no preview
		field yet: `media` owns uploads and transcoding, `catalog` has no column
		pointing at one. When it does, `previewSrc`/`previewPoster` come off the course
		and this constant goes. Nothing else here changes.
	-->
	<div class="relative aspect-video overflow-hidden rounded-b-card bg-surface-sunken">
		<video
			class="size-full object-cover"
			src={PREVIEW_SRC}
			poster={PREVIEW_POSTER}
			preload="none"
			controls={playing}
			playsinline
			bind:this={video}
		>
			<track kind="captions" />
		</video>

		{#if !playing}
			<!--
				The play button is the whole surface. A 40px target in the middle of a
				200px picture is a target people miss, and the picture is doing nothing
				else with the click.
			-->
			<button
				type="button"
				class="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/35 text-on-solid transition-colors hover:bg-black/45 focus-visible:ring-2 focus-visible:ring-on-solid focus-visible:ring-inset focus-visible:outline-none"
				onclick={play}
			>
				<!-- The mark itself, no disc behind it: the scrim is already the surface it
				     stands on, and a filled circle on top of it is a second one. -->
				<Icon
					icon={PlayIcon}
					class="size-12 transition-transform motion-safe:group-hover:scale-110"
					strokeWidth={1.5}
				/>
				<span class="text-sm font-medium">Preview this course</span>
			</button>
		{/if}
	</div>

	<div class="p-6">
		{#if enrolled}
			<!-- A bar is a picture of a number. The number goes next to it. -->
			<div class="flex items-baseline justify-between">
				<p class="text-sm font-medium">Your progress</p>
				<p class="text-sm font-medium">
					<Numeral countUp value={progress?.percent ?? 0} suffix="%" />
				</p>
			</div>

			<!--
			The bar turns the colour of the state it reached. A finished course is green
			here and green in the donut on the learner's dashboard: one palette, so the
			colour means the same thing wherever they meet it.
		-->
			<div class="mt-3">
				<ProgressBar
					value={progress?.percent ?? 0}
					tone={(progress?.percent ?? 0) === 100 ? 'completed' : 'active'}
					label="Course progress"
				/>
			</div>

			<p class="text-muted mt-2 text-sm">
				<span class="numeral">{progress?.lessons_completed ?? 0}</span>
				of
				<span class="numeral">{progress?.lessons_total ?? 0}</span> lessons
			</p>

			{#if progress?.percent === 100}
				<p class="mt-4 flex items-center gap-2 text-sm text-success-text">
					<Icon icon={Tick02Icon} class="size-4" />
					You have finished this course.
				</p>

				<Button href={resolve('/certificates')} class="mt-5 w-full">View your certificate</Button>
			{/if}

			<Button
				href={resolve(`/courses/${course.slug}/grades`)}
				variant="secondary"
				size="sm"
				class="mt-3 w-full"
			>
				See your grades
			</Button>

			<Button
				href={resolve(`/courses/${course.slug}/notes`)}
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
						// Progress survives a cancellation, and a learner about to lose access is
						// the person who most needs telling that it does.
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
		{:else if !signedIn}
			<p class="font-medium">Ready to start?</p>
			<p class="text-muted mt-1 text-sm">
				Sign in to enrol and keep track of what you have finished.
			</p>

			<Button href={`${resolve('/login')}?next=${encodeURIComponent(next)}`} class="mt-5 w-full">
				Sign in to enrol
			</Button>
		{:else if openPrerequisites.length > 0}
			<h2 class="font-medium">Before you enrol</h2>

			<!--
			Every prerequisite, with its state — not only the unfinished ones. A learner
			halfway through a chain wants to see the half they have done.
		-->
			<ul class="mt-3 space-y-2">
				{#each prerequisites as prerequisite (prerequisite.slug)}
					<li class="text-sm">
						<a class="underline underline-offset-4" href={resolve(`/courses/${prerequisite.slug}`)}>
							{prerequisite.title}
						</a>
						<span class="text-muted block text-xs">
							{prerequisite.done ? 'finished' : 'not finished yet'}
						</span>
					</li>
				{/each}
			</ul>

			<!--
			Disabled because muallim-api will refuse. It refuses either way — a disabled
			button is a courtesy, not the control — and the list above names what to do
			about it.
		-->
			<Button disabled class="mt-5 w-full">Enrol</Button>
		{:else}
			<p class="font-medium">Ready to start?</p>
			<p class="text-muted mt-1 text-sm">
				Enrol to open every lesson and track what you have finished.
			</p>

			<!--
			Enrolling reaches the API and then reloads the page under you. Without a
			pending state the button is dead for as long as that takes, and a dead button
			is a button you press again.
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

		<!-- ------------------------------------------------------------ this includes -->
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

		{#if prerequisites.length > 0 && openPrerequisites.length === 0}
			<div class="mt-6 border-t border-border pt-5">
				<p class="text-muted text-xs">Prerequisites, all finished:</p>
				<ul class="mt-2 space-y-1">
					{#each prerequisites as prerequisite (prerequisite.slug)}
						<li class="flex items-center gap-1.5 text-xs text-success-text">
							<Icon icon={Tick02Icon} class="size-3.5" />
							{prerequisite.title}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</Card>
