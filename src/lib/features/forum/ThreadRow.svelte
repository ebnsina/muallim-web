<script lang="ts">
	import { resolve } from '$app/paths';
	import { PinIcon, SquareLock01Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import { exactTime, relativeTime } from './relative-time';
	import type { components } from '$lib/api/schema';

	type Props = { thread: components['schemas']['ForumThreadView'] };

	let { thread }: Props = $props();
</script>

<!--
	One thread. The reply count is the column, not a word in the meta line: on a board
	the size of the conversation is what a reader is scanning for.
-->
<a
	href={resolve(`/forum/threads/${thread.id}`)}
	class="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none sm:px-5"
>
	<span class="min-w-0 flex-1">
		<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
			{#if thread.pinned}
				<Icon icon={PinIcon} class="size-3.5 shrink-0 text-accent-text" title="Pinned" />
			{/if}
			<span class="font-medium text-pretty">{thread.title}</span>
			{#if thread.locked}
				<span class="text-muted inline-flex items-center gap-1 text-xs">
					<Icon icon={SquareLock01Icon} class="size-3.5" />
					Locked
				</span>
			{/if}
		</span>

		<span class="text-muted mt-0.5 block text-xs">
			{thread.author_name || 'A member'} ·
			<span title={exactTime(thread.created_at)}>{relativeTime(thread.created_at)}</span>
			{#if thread.reply_count > 0}
				· latest reply
				<span title={exactTime(thread.last_activity_at)}>
					{relativeTime(thread.last_activity_at)}
				</span>
			{/if}
		</span>
	</span>

	<span class="w-14 shrink-0 text-center">
		<span class="numeral block font-medium">{thread.reply_count}</span>
		<span class="text-muted block text-xs">
			{thread.reply_count === 1 ? 'reply' : 'replies'}
		</span>
	</span>
</a>
