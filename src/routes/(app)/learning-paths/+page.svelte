<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight01Icon, Route02Icon } from '@hugeicons/core-free-icons';
	import { Button, Card, EmptyState, Icon, Page, PageHeader } from '$lib/components';
	import { canLoadMore } from '$lib/paging';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const moreHref = $derived(
		canLoadMore(data.paths) ? `${resolve('/learning-paths')}?cursor=${data.paths.cursor}` : ''
	);
</script>

<svelte:head><title>Learning paths — Muallim</title></svelte:head>

<Page>
	<PageHeader
		title="Learning paths"
		description="Courses grouped into a track, in the order they are meant to be taken. Open one to see what it covers and how far you have got."
	/>

	{#if data.paths.rows.length === 0}
		<div class="mt-10">
			<EmptyState
				icon={Route02Icon}
				title="No learning paths yet"
				description="When a track of courses is ready to follow, it appears here."
			/>
		</div>
	{:else}
		<ul class="mt-8 grid gap-5 sm:grid-cols-2">
			{#each data.paths.rows as path (path.id)}
				<li class="contents">
					<Card float class="flex flex-col gap-3">
						<h2 class="font-medium text-pretty">
							<a
								href={resolve(`/learning-paths/${path.slug}`)}
								class="rounded-control underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								{path.title}
							</a>
						</h2>

						{#if path.description}
							<p class="text-muted line-clamp-3 text-sm text-pretty">{path.description}</p>
						{/if}

						<p class="mt-auto pt-1">
							<Button href={resolve(`/learning-paths/${path.slug}`)} variant="ghost" size="sm">
								Open
								<Icon icon={ArrowRight01Icon} class="size-4" />
							</Button>
						</p>
					</Card>
				</li>
			{/each}
		</ul>

		{#if moreHref}
			<!-- A link, not a button: the next page is a URL, so it survives a reload. -->
			<div class="mt-10 flex justify-center">
				<Button variant="secondary" href={moreHref}>Load more</Button>
			</div>
		{/if}
	{/if}
</Page>
