<script lang="ts">
	import { resolve } from '$app/paths';
	import { BookOpen01Icon, Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';
	import {
		ActionLink,
		Button,
		CourseCard,
		EmptyState,
		Icon,
		Input,
		Label,
		Page,
		PageHeader,
		Select
	} from '$lib/components';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const DIFFICULTIES = [
		{ value: '', label: 'All levels' },
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
		{ value: 'expert', label: 'Expert' }
	];

	const filtered = $derived(
		Boolean(data.q || data.difficulty || data.author || data.category || data.tag)
	);

	// When the page is one person's work, it says so — and the search box below still
	// searches within it, because the filter is in the URL the form does not name.
	const byline = $derived(data.author ? data.authorName || 'this author' : '');

	// The next page keeps the search and the filter: paging is a continuation of
	// the same query, not a jump back to the whole catalog.
	const moreHref = $derived.by(() => {
		if (!data.nextCursor) return '';
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a throwaway builder for one URL, not reactive state
		const params = new URLSearchParams();
		if (data.q) params.set('q', data.q);
		if (data.difficulty) params.set('difficulty', data.difficulty);
		if (data.author) params.set('author', data.author);
		if (data.category) params.set('category', data.category);
		if (data.tag) params.set('tag', data.tag);
		params.set('cursor', data.nextCursor);
		return `${resolve('/courses')}?${params.toString()}`;
	});
</script>

<svelte:head><title>Courses — Muallim</title></svelte:head>

<Page width="full">
	<PageHeader
		title={byline ? `Courses by ${byline}` : 'Courses'}
		description={byline
			? 'Everything this author has published in this workspace.'
			: 'Everything published in this workspace. Open one to read its syllabus before you enroll.'}
	/>

	{#if data.author}
		<!-- A way back out. A filter with no visible way to clear it is a filter people
		     clear by editing the address bar. -->
		<p class="mt-3">
			<ActionLink href={resolve('/courses')} tone="muted">Every course</ActionLink>
		</p>
	{/if}

	<!--
		A GET form, so a search is a URL the loader reads: bookmarkable, shareable, and
		working with no JavaScript. It names no cursor, so a new search starts from the
		first page rather than mid-way through the last one.
	-->
	<form
		method="GET"
		action={resolve('/courses')}
		class="mt-8 flex flex-wrap items-end gap-3"
		role="search"
	>
		<!-- The author rides along, hidden. A GET form submits the fields it names and
		     nothing else, so without this, searching inside one person's courses would
		     silently drop back to the whole catalog. -->
		{#if data.author}
			<input type="hidden" name="author" value={data.author} />
		{/if}

		<!-- Same for a category or tag filter with no picker to carry it: a search
		     from a signed-out reader would otherwise silently drop the filter. -->
		{#if data.category && data.categories.length === 0}
			<input type="hidden" name="category" value={data.category} />
		{/if}
		{#if data.tag && data.tags.length === 0}
			<input type="hidden" name="tag" value={data.tag} />
		{/if}

		<div class="min-w-0 flex-1">
			<Label for="q" class="sr-only">Search courses</Label>
			<div class="relative">
				<span class="text-muted pointer-events-none absolute inset-y-0 left-3 flex items-center">
					<Icon icon={Search01Icon} class="size-4" />
				</span>
				<Input
					id="q"
					name="q"
					type="search"
					value={data.q}
					placeholder="Search by title…"
					class="pl-9"
				/>
			</div>
		</div>

		<div class="w-44">
			<Label for="difficulty" class="sr-only">Difficulty</Label>
			<Select
				id="difficulty"
				name="difficulty"
				value={data.difficulty}
				onchange={(event) => event.currentTarget.form?.requestSubmit()}
			>
				{#each DIFFICULTIES as level (level.value)}
					<option value={level.value}>{level.label}</option>
				{/each}
			</Select>
		</div>

		<!-- The category and tag pickers only appear when the vocabulary loaded — a
		     signed-in reader with the names to build them. The URL filter still works
		     without them; there is just nothing to click. -->
		{#if data.categories.length > 0}
			<div class="w-44">
				<Label for="category" class="sr-only">Category</Label>
				<Select
					id="category"
					name="category"
					value={data.category}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				>
					<option value="">All categories</option>
					{#each data.categories as category (category.id)}
						<option value={category.id}>{category.name}</option>
					{/each}
				</Select>
			</div>
		{/if}

		{#if data.tags.length > 0}
			<div class="w-44">
				<Label for="tag" class="sr-only">Tag</Label>
				<Select
					id="tag"
					name="tag"
					value={data.tag}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				>
					<option value="">All tags</option>
					{#each data.tags as tag (tag.id)}
						<option value={tag.id}>{tag.name}</option>
					{/each}
				</Select>
			</div>
		{/if}

		<Button type="submit" variant="secondary">
			<Icon icon={Search01Icon} class="size-4" />
			Search
		</Button>

		{#if filtered}
			<Button href={resolve('/courses')} variant="ghost">
				<Icon icon={Cancel01Icon} class="size-4" />
				Clear
			</Button>
		{/if}
	</form>

	{#if data.courses.length === 0}
		<!-- Empty is a state, not an oversight — and a filtered empty says so. -->
		<div class="mt-10">
			{#if filtered}
				<EmptyState
					icon={Search01Icon}
					title="No courses match"
					description="Nothing here fits that search. Try fewer words, or a different level."
				>
					{#snippet action()}
						<Button href={resolve('/courses')} size="sm">
							<Icon icon={Cancel01Icon} class="size-4" />
							Clear the filters
						</Button>
					{/snippet}
				</EmptyState>
			{:else}
				<EmptyState
					icon={BookOpen01Icon}
					title="No courses yet"
					description="When a course is published, it appears here."
				/>
			{/if}
		</div>
	{:else}
		<!--
			Every course here is published. muallim-api's listing filters on status in SQL
			and takes no reader into account, so an author does not find their own
			drafts here either — there is no "my courses" endpoint behind this page.
		-->
		<ul class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.courses as course (course.id)}
				<li class="contents">
					<CourseCard
						title={course.title}
						summary={course.summary}
						difficulty={course.difficulty}
						lessonCount={course.lesson_count}
						instructor={course.instructor}
						instructorHref={course.instructor_id
							? `${resolve('/courses')}?author=${course.instructor_id}`
							: undefined}
						learnerCount={course.learner_count}
						ratingAverage={course.rating_average}
						ratingCount={course.rating_count}
						price={course.price}
						imageUrl={course.image_url ? `/api${course.image_url}` : undefined}
						seed={course.slug}
						href={resolve(`/courses/${course.slug}`)}
					/>
				</li>
			{/each}
		</ul>

		{#if data.nextCursor}
			<!--
				A link, not a button: the next page is a URL, so it survives a reload and
				works with JavaScript off. It carries the search and the filter along.
			-->
			<div class="mt-10 flex justify-center">
				<Button variant="secondary" href={moreHref}>Load more</Button>
			</div>
		{/if}
	{/if}
</Page>
