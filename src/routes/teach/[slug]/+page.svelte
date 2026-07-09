<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>{data.course.title} — Teach</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-2xl px-6 py-16">
	<p class="text-muted-foreground text-sm">
		<a class="underline" href={resolve('/teach')}>Your courses</a>
	</p>

	<h1 class="mt-2 text-2xl font-semibold">{data.course.title}</h1>
	<p class="text-muted-foreground mt-1 text-sm">
		{data.course.status} · {data.lessonCount}
		{data.lessonCount === 1 ? 'lesson' : 'lessons'}
	</p>

	{#if form?.message}
		<Alert variant="destructive" class="mt-6" role="alert">
			<AlertDescription>{form.message}</AlertDescription>
		</Alert>
	{/if}

	{#if data.topics.length === 0}
		<p class="text-muted-foreground mt-10 text-sm">
			This course has no sections yet. A course needs at least one lesson before it can be
			published.
		</p>
	{/if}

	<ol class="mt-8 space-y-6">
		{#each data.topics as topic, topicIndex (topic.id)}
			<li class="rounded-lg border p-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<form method="POST" action="?/renameTopic" class="flex items-center gap-2" use:enhance>
						<input type="hidden" name="id" value={topic.id} />
						<Label class="sr-only" for="topic-{topic.id}">Section title</Label>
						<Input id="topic-{topic.id}" name="title" value={topic.title} class="w-64" />
						<Button type="submit" variant="outline" size="sm">Rename</Button>
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
								<span class="text-muted-foreground mr-2 text-xs">{lesson.content_type}</span>

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
					<Button type="submit" variant="outline" size="sm">Add lesson</Button>
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
