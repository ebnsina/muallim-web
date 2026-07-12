<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import type { LessonView } from '$lib/features/course';

	type Props = {
		slug: string;
		previous: LessonView | null;
		next: LessonView | null;
	};

	let { slug, previous, next }: Props = $props();
</script>

<!--
	The two steps out of a lesson, side by side. Each names the lesson it goes to, so a
	reader knows what is next before they leave what they are on. The pair sits below
	everything, where a page turn belongs.
-->
<nav aria-label="Lesson" class="mt-14 grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
	{#if previous}
		<a
			href={resolve(`/courses/${slug}/lessons/${previous.id}`)}
			class="lift group flex items-center gap-3 rounded-card bg-surface-raised p-4 shadow-card sm:col-start-1"
		>
			<Icon
				icon={ArrowLeft01Icon}
				class="text-muted size-5 shrink-0 transition-colors group-hover:text-text"
			/>
			<span class="min-w-0">
				<span class="text-muted text-xs">Previous</span>
				<span class="block truncate text-sm font-medium">{previous.title}</span>
			</span>
		</a>
	{/if}

	{#if next}
		<a
			href={resolve(`/courses/${slug}/lessons/${next.id}`)}
			class="lift group flex items-center gap-3 rounded-card bg-surface-raised p-4 text-right shadow-card sm:col-start-2"
		>
			<span class="min-w-0 flex-1">
				<span class="text-muted text-xs">Next</span>
				<span class="block truncate text-sm font-medium">{next.title}</span>
			</span>
			<Icon
				icon={ArrowRight01Icon}
				class="text-muted size-5 shrink-0 transition-colors group-hover:text-text"
			/>
		</a>
	{/if}
</nav>
