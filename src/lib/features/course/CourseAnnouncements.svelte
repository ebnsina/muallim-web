<script lang="ts">
	import { Megaphone01Icon } from '@hugeicons/core-free-icons';
	import { slide } from 'svelte/transition';
	import { Alert, Icon } from '$lib/components';
	import { DURATION, easeOut } from '$lib/motion';
	import type { Announcement } from './types';

	type Props = { announcements: Announcement[] };
	let { announcements }: Props = $props();

	const mediumDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

	// One open at a time. They are notices, not a thread.
	let shown = $state<string | null>(null);
</script>

<!--
	An announcement is the design system's Alert, because that is what it is: a
	notice from the course, in the informational tone. It was a hand-rolled tinted
	Card with its own border, its own fill, and its own hover — three decisions the
	system had already made, made again slightly differently.

	`info` and not `warning`: a live session this week is news, not a problem. The
	body stays behind its title, because a notice is worth a line until somebody
	wants the rest of it.
-->
<section class="mt-10">
	<h2 class="flex items-center gap-2 text-sm font-medium">
		<Icon icon={Megaphone01Icon} class="text-accent-text size-4" />
		Announcements
		<span class="text-muted numeral text-xs">{announcements.length}</span>
	</h2>

	<ul class="mt-3 space-y-2">
		{#each announcements as announcement (announcement.id)}
			{@const isShown = shown === announcement.id}
			<li>
				<Alert tone="info" role="status">
					<!--
					The row *is* the button. It was split into a title and a separate "Read"
					link, which reads fine and is wrong: the thing a person aims at to open a
					notice is its headline, and a 40px word beside it is a smaller target for
					the same act. `w-full`, because the Alert lays its content out beside the
					icon and a shrink-to-fit column leaves the date wherever the title ended.
				-->
					<button
						type="button"
						class="flex w-full items-center gap-3 text-left"
						aria-expanded={isShown}
						aria-controls="announcement-{announcement.id}"
						onclick={() => (shown = isShown ? null : announcement.id)}
					>
						<span class="min-w-0 flex-1 truncate text-sm font-medium">
							{announcement.title}
						</span>

						<time class="numeral hidden shrink-0 text-xs opacity-75 sm:block">
							{mediumDate.format(new Date(announcement.created_at))}
						</time>

						<span class="shrink-0 text-xs font-medium underline underline-offset-4">
							{isShown ? 'Hide' : 'Read'}
						</span>
					</button>

					{#if isShown}
						<!--
						It slides. A disclosure that appears in one frame shoves the page under
						whoever is reading it, and they lose their place — the height has to be
						something the eye can follow. Svelte's slide compiles to a CSS animation,
						so a reader who asked for less motion gets it open, immediately.
					-->
						<p
							id="announcement-{announcement.id}"
							class="mt-2 text-sm whitespace-pre-wrap"
							transition:slide={{ duration: DURATION.base, easing: easeOut }}
						>
							{announcement.body}
						</p>
					{/if}
				</Alert>
			</li>
		{/each}
	</ul>
</section>
