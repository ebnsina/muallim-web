<script lang="ts">
	import { resolve } from '$app/paths';
	import { BookOpen01Icon, GlobalIcon, Message01Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import type { components } from '$lib/api/schema';

	type Props = { space: components['schemas']['ForumSpaceView'] };

	let { space }: Props = $props();

	// The glyph is the only thing distinguishing the two kinds of board at a glance;
	// the meta line spells it out for anyone who does not read icons.
	const glyph = $derived(space.workspace ? GlobalIcon : BookOpen01Icon);
</script>

<!-- One board in the index. The whole row is the link: a title-only target is a target people miss. -->
<a
	href={resolve(`/forum/spaces/${space.id}`)}
	class="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none sm:px-5"
>
	<span
		class="flex size-9 shrink-0 items-center justify-center rounded-control {space.workspace
			? 'bg-accent-surface text-accent-text'
			: 'bg-surface-sunken text-muted'}"
	>
		<Icon icon={glyph} class="size-4.5" />
	</span>

	<span class="min-w-0 flex-1">
		<span class="block font-medium text-pretty">{space.title}</span>
		{#if space.description}
			<span class="text-muted mt-0.5 line-clamp-1 block text-sm">{space.description}</span>
		{/if}
		<span class="text-muted mt-1 block text-xs">
			{space.workspace ? 'Workspace board' : (space.course_title ?? 'Course board')}
		</span>
	</span>

	<span class="text-muted flex shrink-0 items-center gap-1.5 self-center text-xs">
		<Icon icon={Message01Icon} class="size-3.5" />
		<span class="numeral">{space.thread_count}</span>
		<span class="hidden sm:inline">{space.thread_count === 1 ? 'thread' : 'threads'}</span>
	</span>
</a>
