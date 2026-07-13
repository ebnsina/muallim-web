<script lang="ts">
	import { Clock01Icon, TaskDone01Icon } from '@hugeicons/core-free-icons';
	import { Badge, Card, Icon, Score } from '$lib/components';
	import { inview } from '$lib/actions/inview';
	import Section from './Section.svelte';
	import { QUESTION_TYPES } from './content';
</script>

<Section
	id="assess"
	eyebrow="Assessment"
	title="Ask the question the way you would ask it in a room."
	lead="A quiz is not four bullets and a radio button. Muallim has eleven question types, and two of them take an image as the thing being answered."
	class="grid gap-6 lg:grid-cols-5"
>
	<div class="lg:col-span-3" use:inview>
		<Card float class="h-full p-6 sm:p-8">
			<h3 class="text-sm font-semibold text-muted">Every question type, as the API names it</h3>
			<ul class="mt-5 flex flex-wrap gap-2">
				{#each QUESTION_TYPES as type (type)}
					<li class="rounded-pill border border-border bg-surface px-3 py-1.5 text-sm font-medium">
						{type}
					</li>
				{/each}
			</ul>
			<p class="mt-6 text-sm text-pretty text-muted">
				Write a question once and save it to the workspace's bank; any quiz in any course can pull
				it back out. A learner's attempt is saved as they go, so a closed tab is not a lost paper.
			</p>
		</Card>
	</div>

	<div class="space-y-6 lg:col-span-2">
		<div use:inview={{ delay: 80 }}>
			<Card float class="p-6">
				<div class="flex items-center gap-2 text-sm font-medium">
					<Icon icon={TaskDone01Icon} class="size-4 text-success" strokeWidth={2} />
					Graded on submit
				</div>
				<div class="mt-4">
					<Score points={8} maxPoints={10} passed />
				</div>
				<p class="mt-4 text-sm text-pretty text-muted">
					Choice, ordering, matching, blanks and range are marked the moment the attempt is handed
					in, against the pass mark the quiz was given.
				</p>
			</Card>
		</div>

		<div use:inview={{ delay: 160 }}>
			<Card float class="p-6">
				<div class="flex items-center gap-2 text-sm font-medium">
					<Icon icon={Clock01Icon} class="size-4 text-warning" strokeWidth={2} />
					Waiting for a person
				</div>
				<div class="mt-4">
					<Badge tone="warning" icon={Clock01Icon}>awaiting review</Badge>
				</div>
				<p class="mt-4 text-sm text-pretty text-muted">
					Open-ended answers and uploaded assignments queue up instead of guessing at a grade. Mark
					them, and the result lands in the gradebook.
				</p>
			</Card>
		</div>
	</div>
</Section>
