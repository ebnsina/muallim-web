<script lang="ts">
	import { MarketingFooter } from '$lib/components';
	import {
		Capabilities,
		Certificates,
		Closing,
		Hero,
		Nav,
		Platform,
		QUESTION_TYPES,
		Sales,
		Segments,
		Showcase
	} from '$lib/features/marketing';
</script>

<svelte:head>
	<title>Muallim — teach it, mark it, certify it, sell it</title>
	<meta
		name="description"
		content="A learning platform for schools and creators: courses, quizzes, assignments, a gradebook, a forum, verifiable certificates, and course sales through your own payment account."
	/>
</svelte:head>

<Nav />

<main>
	<Hero />

	<Showcase
		id="author"
		index={1}
		eyebrow="Author"
		title="A course, in the order you actually build one"
		lead="Topics, then lessons, then the work. Reorder by drag, by keyboard, or by the arrows beside a row — and nothing you have not published is visible to anybody."
		points={[
			'Text and video lessons, with a preview that plays before anyone enrolls',
			'Drip a course: on a date, so many days after enrolling, or one lesson at a time',
			'A course can require another course first',
			'A draft is filtered out of the catalog, not merely hidden from a menu'
		]}
		src="/marketing/editor.webp"
		alt="The course editor: topics with their lessons, each row draggable, each lesson labelled and previewable."
		path="muallim.app/teach/medicine-the-canon"
	/>

	<Showcase
		id="assess"
		index={2}
		eyebrow="Assess and mark"
		title="Grade it against your scale, not ours"
		lead="Eleven question types, graded the moment they are submitted — except the ones only a person can judge, which queue up and wait for you."
		points={[
			'A question bank: write a question once, reuse it in any quiz',
			'Attempts resume where the learner left them',
			'Assignments with file upload, and late work allowed or refused',
			'A gradebook: every learner, every graded item, one table'
		]}
		src="/marketing/grading.webp"
		alt="The grading scales page: the workspace's default scale, and a new scale being built band by band with a live preview."
		path="muallim.app/teach/grading"
		flip
		tinted
	>
		<div class="flex flex-wrap gap-1.5">
			{#each QUESTION_TYPES as type (type)}
				<span
					class="squircle-sm bg-surface px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-border"
				>
					{type}
				</span>
			{/each}
		</div>
	</Showcase>

	<Showcase
		id="learn"
		index={3}
		eyebrow="Learn"
		title="A course page worth an evening"
		lead="Before a learner commits, they see the preview video, who teaches it, how hard it is, and what the people who finished it made of it."
		points={[
			'Private notes and highlights, kept against the lesson they were made in',
			'Progress recomputed the moment a lesson is completed',
			'Deadlines on the dashboard: what is owed, and when it is late',
			'Reviews and star ratings, written by learners who took the course'
		]}
		src="/marketing/course.webp"
		alt="A course page: the preview video, the level, the rating, the instructor, and the panel a learner enrolls from."
		path="muallim.app/courses/medicine-the-canon"
	/>

	<Sales />
	<Certificates />
	<Capabilities />
	<Segments />
	<Platform />
	<Closing />
</main>

<MarketingFooter />
