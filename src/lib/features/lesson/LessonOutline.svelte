<script lang="ts">
	import { resolve } from '$app/paths';
	import { LessonIcon } from '$lib/components';
	import { cn } from '$lib/utils';
	import type { TopicView } from '$lib/features/course';

	type Props = {
		slug: string;
		courseTitle: string;
		topics: TopicView[];
		/** The lesson being read, marked as the current page. */
		currentLessonId: string;
	};

	let { slug, courseTitle, topics, currentLessonId }: Props = $props();
</script>

<nav aria-label="Course outline">
	<a href={resolve(`/courses/${slug}`)} class="underline-grow block text-sm font-semibold">
		{courseTitle}
	</a>

	<ol class="mt-4 space-y-5">
		{#each topics as topic, section (topic.id)}
			<li>
				<p class="text-muted flex items-baseline gap-2 text-xs font-medium tracking-wide uppercase">
					<span class="numeral">{String(section + 1).padStart(2, '0')}</span>
					<span class="text-text normal-case">{topic.title}</span>
				</p>

				<ul class="mt-2 space-y-0.5">
					{#each topic.lessons ?? [] as lesson (lesson.id)}
						{@const current = lesson.id === currentLessonId}
						<li>
							<a
								href={resolve(`/courses/${slug}/lessons/${lesson.id}`)}
								aria-current={current ? 'page' : undefined}
								class={cn(
									'flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-sm transition-colors',
									current
										? 'bg-accent-surface font-medium text-accent-text'
										: 'text-muted hover:bg-surface-sunken hover:text-text'
								)}
							>
								<span class="shrink-0">
									<LessonIcon contentType={lesson.content_type} />
								</span>
								<span class="min-w-0 flex-1 truncate">{lesson.title}</span>
								{#if lesson.is_preview}
									<span class="text-accent-text shrink-0 text-xs">Free</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ol>
</nav>
