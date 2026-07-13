<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Award01Icon,
		Cancel01Icon,
		CheckmarkCircle02Icon,
		File01Icon,
		Invoice01Icon,
		PlayCircleIcon,
		PlayIcon,
		ShoppingCart01Icon,
		StickyNote02Icon,
		Task01Icon,
		Tick02Icon,
		UserAdd01Icon
	} from '@hugeicons/core-free-icons';
	import {
		Button,
		Card,
		Icon,
		Label,
		Numeral,
		Progress as ProgressBar,
		Select
	} from '$lib/components';
	import { formatMoney } from '$lib/money';
	import { toast } from '$lib/toast.svelte';
	import { auroraFor, cn } from '$lib/utils';
	import { span } from './duration';
	import type { CourseDetail, Enrolment, Prerequisite, Progress, TopicView } from './types';

	type Props = {
		course: CourseDetail;
		topics: TopicView[];
		progress: Progress | null;
		prerequisites: Prerequisite[];
		signedIn: boolean;
		/** This reader's own enrolment, when they have one: how it was come by, and its state. */
		enrolment: Enrolment | null;
		/** The gateways the workspace has ready — empty for a reader who may not ask. */
		gateways: string[];
		/** Where to return to after signing in. */
		next: string;
	};

	let { course, topics, progress, prerequisites, signedIn, enrolment, gateways, next }: Props =
		$props();

	// A bought enrolment is not cancellable: muallim-api answers 409, and rightly —
	// cancelling would not return the money. The workspace refunds it.
	const bought = $derived(enrolment?.source === 'purchase');

	// A preview plays when it is asked to: an autoplaying clip on a page somebody is
	// reading is a clip they did not ask for.
	let playing = $state(false);

	// The enrolment says so, not the progress: a course bought a second ago has an
	// enrolment and no progress row yet, and offering to sell it again would be a lie.
	const enrolled = $derived(
		progress !== null || enrolment?.status === 'active' || enrolment?.status === 'completed'
	);
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

		`preview_embed_url` and never `preview_url`: the first is written by muallim-api
		from a validated id, the second is whatever an author typed. Framing the second
		would run an author's URL on this origin.
	-->
	{#if course.preview_embed_url}
		<div class="relative aspect-video overflow-hidden rounded-b-card bg-surface-sunken">
			{#if playing}
				<iframe
					class="size-full"
					src="{course.preview_embed_url}{course.preview_embed_url.includes('?')
						? '&'
						: '?'}autoplay=1"
					title="Preview of {course.title}"
					allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
					allowfullscreen
				></iframe>
			{:else}
				<!-- The cover is the poster, and the whole surface is the button: a 40px
				     target in the middle of a picture is a target people miss. -->
				<div class={cn('absolute inset-0', auroraFor(course.slug))}></div>

				<button
					type="button"
					class="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/35 text-on-solid transition-colors hover:bg-black/45 focus-visible:ring-2 focus-visible:ring-on-solid focus-visible:ring-inset focus-visible:outline-none"
					onclick={() => (playing = true)}
				>
					<Icon
						icon={PlayIcon}
						class="size-12 transition-transform motion-safe:group-hover:scale-110"
						strokeWidth={1.5}
					/>
					<span class="text-sm font-medium">Preview this course</span>
				</button>
			{/if}
		</div>
	{/if}

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
			The bar turns the color of the state it reached. A finished course is green
			here and green in the donut on the learner's dashboard: one palette, so the
			color means the same thing wherever they meet it.
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

				<Button href={resolve('/certificates')} class="mt-5 w-full">
					<Icon icon={Award01Icon} class="size-4" />
					View your certificate
				</Button>
			{/if}

			<Button
				href={resolve(`/courses/${course.slug}/grades`)}
				variant="secondary"
				size="sm"
				class="mt-3 w-full"
			>
				<Icon icon={Task01Icon} class="size-4" />
				See your grades
			</Button>

			<Button
				href={resolve(`/courses/${course.slug}/notes`)}
				variant="secondary"
				size="sm"
				class="mt-3 w-full"
			>
				<Icon icon={StickyNote02Icon} class="size-4" />
				Your notes &amp; highlights
			</Button>

			{#if bought}
				<!--
					Bought, so there is nothing to cancel. The workspace holds the money — it is
					the merchant — so it is the workspace that gives it back, and a button here
					would only earn a 409 saying so.
				-->
				<div class="mt-5 border-t border-border pt-5">
					<p class="flex items-center gap-2 text-sm font-medium text-success-text">
						<Icon icon={CheckmarkCircle02Icon} class="size-4" />
						You bought this course.
					</p>
					<p class="text-muted mt-1 text-sm">
						It is yours to keep. A refund is issued by the workspace that sold it — ask them, and
						the enrollment comes off with the money.
					</p>

					<Button href={resolve('/receipts')} variant="secondary" size="sm" class="mt-3 w-full">
						<Icon icon={Invoice01Icon} class="size-4" />
						See your purchase
					</Button>
				</div>
			{:else}
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
							toast.info('Enrollment cancelled. Your progress is kept if you come back.');
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
						<Icon icon={Cancel01Icon} class="size-4" />
						{cancelling ? 'Cancelling…' : 'Cancel enrollment'}
					</Button>
				</form>
			{/if}
		{:else if !signedIn}
			{#if course.price}
				<p class="numeral text-3xl font-semibold tracking-tight">{formatMoney(course.price)}</p>
				<p class="text-muted mt-1 text-sm">Sign in to buy it.</p>
			{:else}
				<p class="font-medium">Ready to start?</p>
				<p class="text-muted mt-1 text-sm">
					Sign in to enroll and keep track of what you have finished.
				</p>
			{/if}

			<Button href={`${resolve('/login')}?next=${encodeURIComponent(next)}`} class="mt-5 w-full">
				<Icon icon={UserAdd01Icon} class="size-4" />
				{course.price ? 'Sign in to buy' : 'Sign in to enroll'}
			</Button>
		{:else if openPrerequisites.length > 0}
			<h2 class="font-medium">Before you enroll</h2>

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
			<Button disabled class="mt-5 w-full">
				<Icon icon={UserAdd01Icon} class="size-4" />
				Enroll
			</Button>
		{:else if course.price}
			<!--
				A priced course is bought, not enrolled on: muallim-api answers 402 to a free
				enrolment, and the button that would earn it is a button that ends in an
				apology. The checkout is the school's own gateway; a card never touches us.
			-->
			<p class="numeral text-3xl font-semibold tracking-tight">
				{formatMoney(course.price)}
			</p>
			<p class="text-muted mt-1 text-sm">One payment. The course is yours to keep.</p>

			<form method="POST" action="?/buy" class="mt-5 space-y-3" use:enhance>
				<!--
					A choice only when there is one. With a single connected gateway the buyer is
					not asked a question with one answer; the action sends them to it.
				-->
				{#if gateways.length > 1}
					<div class="space-y-2">
						<Label for="checkout-gateway">Pay with</Label>
						<Select id="checkout-gateway" name="gateway" class="w-full">
							{#each gateways as gateway (gateway)}
								<option value={gateway} class="capitalize">{gateway}</option>
							{/each}
						</Select>
					</div>
				{/if}

				<Button type="submit" class="w-full">
					<Icon icon={ShoppingCart01Icon} class="size-4" />
					Buy this course
				</Button>
			</form>
		{:else}
			<p class="font-medium">Ready to start?</p>
			<p class="text-muted mt-1 text-sm">
				Enroll to open every lesson and track what you have finished.
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
					<Icon icon={UserAdd01Icon} class="size-4" />
					{enrolling ? 'Enrolling…' : 'Enroll'}
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
