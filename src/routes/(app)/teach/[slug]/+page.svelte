<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, Breadcrumbs, Button, Input, Label, Select } from '$lib/components';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const crumbs = $derived([
		{ label: 'Teach', href: resolve('/teach') },
		{ label: data.course.title }
	]);

	const dripModes = [
		{ value: 'none', label: 'All at once' },
		{ value: 'scheduled', label: 'On a fixed date' },
		{ value: 'after_enrolment', label: 'Days after enrolling' },
		{ value: 'sequential', label: 'One lesson at a time' }
	];

	const hints: Record<string, string> = {
		none: 'Every lesson is available as soon as a learner enrols.',
		scheduled: 'Each lesson opens at its own date and time, the same for everybody.',
		after_enrolment: "Each lesson opens a number of days after each learner's own enrolment.",
		sequential: 'A lesson opens when the learner has finished every lesson before it.'
	};

	const dripHint = $derived(hints[data.course.drip_mode] ?? '');
</script>

<svelte:head><title>{data.course.title} — Teach</title></svelte:head>

<main class="mx-auto max-w-2xl px-6 py-16">
	<Breadcrumbs {crumbs} />

	<h1 class="mt-4 text-2xl font-semibold">{data.course.title}</h1>
	<p class="text-muted mt-1 text-sm">
		{data.course.status} · {data.lessonCount}
		{data.lessonCount === 1 ? 'lesson' : 'lessons'}
	</p>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">
			{form.message}
		</Alert>
	{/if}

	<section class="mt-8 space-y-6 rounded-card border p-4">
		<div>
			<h2 class="font-medium">Release schedule</h2>
			<p class="text-muted mt-1 text-sm">
				How this course hands its lessons to a learner. A free preview is never held back, and
				neither are you.
			</p>

			<form method="POST" action="?/setDripMode" class="mt-3 flex items-center gap-2" use:enhance>
				<Label class="sr-only" for="drip-mode">Release schedule</Label>
				<Select id="drip-mode" name="mode">
					{#each dripModes as mode (mode.value)}
						<option value={mode.value} selected={mode.value === data.course.drip_mode}>
							{mode.label}
						</option>
					{/each}
				</Select>
				<Button type="submit" variant="secondary" size="sm">Save</Button>
			</form>

			<p class="text-muted mt-2 text-xs">{dripHint}</p>
		</div>

		<div>
			<h2 class="font-medium">Prerequisites</h2>
			<p class="text-muted mt-1 text-sm">
				Courses a learner must finish before they may enrol on this one. An administrator granting
				an enrolment overrides them.
			</p>

			{#if data.prerequisites.length === 0}
				<p class="text-muted mt-3 text-sm">None. Anyone may enrol.</p>
			{:else}
				<ul class="mt-3 space-y-2">
					{#each data.prerequisites as prerequisite (prerequisite.id)}
						<li class="flex items-center justify-between gap-3 border-t pt-2 text-sm">
							<span>
								{prerequisite.title}
								{#if prerequisite.status !== 'published'}
									<span class="text-muted ml-2 text-xs uppercase">
										{prerequisite.status}
									</span>
								{/if}
							</span>
							<form method="POST" action="?/removePrerequisite" use:enhance>
								<input type="hidden" name="requires_slug" value={prerequisite.slug} />
								<Button type="submit" variant="ghost" size="sm">Remove</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}

			{#if data.candidates.length > 0}
				<form
					method="POST"
					action="?/addPrerequisite"
					class="mt-4 flex items-center gap-2"
					use:enhance
				>
					<Label class="sr-only" for="requires-slug">Course to require</Label>
					<Select id="requires-slug" name="requires_slug">
						{#each data.candidates as candidate (candidate.id)}
							<option value={candidate.slug}>{candidate.title}</option>
						{/each}
					</Select>
					<Button type="submit" variant="secondary" size="sm">Require</Button>
				</form>
			{:else}
				<p class="text-muted mt-4 text-sm">
					There is no other course in this workspace to require.
				</p>
			{/if}
		</div>
	</section>

	{#if data.topics.length === 0}
		<p class="text-muted mt-10 text-sm">
			This course has no sections yet. A course needs at least one lesson before it can be
			published.
		</p>
	{/if}

	<ol class="mt-8 space-y-6">
		{#each data.topics as topic, topicIndex (topic.id)}
			<li class="rounded-card border p-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<form method="POST" action="?/renameTopic" class="flex items-center gap-2" use:enhance>
						<input type="hidden" name="id" value={topic.id} />
						<Label class="sr-only" for="topic-{topic.id}">Section title</Label>
						<Input id="topic-{topic.id}" name="title" value={topic.title} class="w-64" />
						<Button type="submit" variant="secondary" size="sm">Rename</Button>
					</form>

					<div class="flex items-center gap-1">
						<!--
							Move buttons rather than drag-and-drop: a form works before JavaScript
							loads, and is reachable from a keyboard without any ARIA of our own.
							The endpoint is the same either way.
						-->
						<form method="POST" action="?/moveTopic" use:enhance>
							<input type="hidden" name="id" value={topic.id} />
							<input type="hidden" name="direction" value="up" />
							<Button
								type="submit"
								variant="ghost"
								size="sm"
								disabled={topicIndex === 0}
								aria-label="Move section {topic.title} up">↑</Button
							>
						</form>

						<form method="POST" action="?/moveTopic" use:enhance>
							<input type="hidden" name="id" value={topic.id} />
							<input type="hidden" name="direction" value="down" />
							<Button
								type="submit"
								variant="ghost"
								size="sm"
								disabled={topicIndex === data.topics.length - 1}
								aria-label="Move section {topic.title} down">↓</Button
							>
						</form>

						<form method="POST" action="?/deleteTopic" use:enhance>
							<input type="hidden" name="id" value={topic.id} />
							<Button type="submit" variant="ghost" size="sm">Delete</Button>
						</form>
					</div>
				</div>

				<ul class="mt-4 space-y-2">
					{#each topic.lessons ?? [] as lesson, lessonIndex (lesson.id)}
						<li class="flex flex-wrap items-center justify-between gap-3 border-t pt-2 text-sm">
							<a
								class="underline-offset-4 hover:underline"
								href={resolve(`/teach/${data.course.slug}/lessons/${lesson.id}`)}
							>
								{lesson.title}
							</a>

							<div class="flex items-center gap-1">
								<span class="text-muted mr-2 text-xs">{lesson.content_type}</span>

								<form method="POST" action="?/togglePreview" use:enhance>
									<input type="hidden" name="id" value={lesson.id} />
									<input type="hidden" name="is_preview" value={String(!lesson.is_preview)} />
									<Button
										type="submit"
										variant={lesson.is_preview ? 'secondary' : 'ghost'}
										size="sm"
									>
										{lesson.is_preview ? 'Preview' : 'Make preview'}
									</Button>
								</form>

								<form method="POST" action="?/moveLesson" use:enhance>
									<input type="hidden" name="id" value={lesson.id} />
									<input type="hidden" name="topic_id" value={topic.id} />
									<input type="hidden" name="direction" value="up" />
									<Button
										type="submit"
										variant="ghost"
										size="sm"
										disabled={lessonIndex === 0}
										aria-label="Move lesson {lesson.title} up">↑</Button
									>
								</form>

								<form method="POST" action="?/moveLesson" use:enhance>
									<input type="hidden" name="id" value={lesson.id} />
									<input type="hidden" name="topic_id" value={topic.id} />
									<input type="hidden" name="direction" value="down" />
									<Button
										type="submit"
										variant="ghost"
										size="sm"
										disabled={lessonIndex === (topic.lessons?.length ?? 0) - 1}
										aria-label="Move lesson {lesson.title} down">↓</Button
									>
								</form>

								<form method="POST" action="?/deleteLesson" use:enhance>
									<input type="hidden" name="id" value={lesson.id} />
									<Button type="submit" variant="ghost" size="sm">Delete</Button>
								</form>
							</div>
						</li>
					{/each}
				</ul>

				<form method="POST" action="?/addLesson" class="mt-4 flex items-center gap-2" use:enhance>
					<input type="hidden" name="topic_id" value={topic.id} />
					<Label class="sr-only" for="lesson-title-{topic.id}">New lesson title</Label>
					<Input
						id="lesson-title-{topic.id}"
						name="title"
						placeholder="New lesson"
						class="w-64"
						required
					/>
					<Button type="submit" variant="secondary" size="sm">Add lesson</Button>
				</form>
			</li>
		{/each}
	</ol>

	<form method="POST" action="?/addTopic" class="mt-8 flex items-center gap-2" use:enhance>
		<Label class="sr-only" for="new-topic">New section title</Label>
		<Input id="new-topic" name="title" placeholder="New section" class="w-64" required />
		<Button type="submit">Add section</Button>
	</form>
</main>
