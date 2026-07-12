<script lang="ts">
	import { enhance } from '$app/forms';
	import { Delete02Icon } from '@hugeicons/core-free-icons';
	import { Icon } from '$lib/components';
	import { exactTime, relativeTime } from './relative-time';
	import type { components } from '$lib/api/schema';

	type Props = {
		post: components['schemas']['ForumPostView'];
		/** A moderator may delete anyone's reply; an author only their own. */
		deletable: boolean;
	};

	let { post, deletable }: Props = $props();
</script>

<article class="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
	<div class="min-w-0">
		<p class="text-muted text-xs">
			<span class="text-text font-medium">{post.author_name || 'A member'}</span>
			·
			<span title={exactTime(post.created_at)}>{relativeTime(post.created_at)}</span>
		</p>
		<p class="mt-1.5 text-sm text-pretty whitespace-pre-wrap">{post.body}</p>
	</div>

	{#if deletable}
		<form method="POST" action="?/deletePost" use:enhance>
			<input type="hidden" name="id" value={post.id} />
			<button
				type="submit"
				class="text-muted hover:text-danger-text shrink-0 rounded-control p-1 transition-colors"
				aria-label="Delete this reply"
			>
				<Icon icon={Delete02Icon} class="size-4" />
			</button>
		</form>
	{/if}
</article>
