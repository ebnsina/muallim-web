<script lang="ts">
	import { untrack } from 'svelte';
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		ArrowLeft01Icon,
		ArrowUp01Icon,
		Delete02Icon,
		FloppyDiskIcon,
		PlusSignIcon,
		Route02Icon,
		SentIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Card,
		EmptyState,
		Field,
		Icon,
		Input,
		PageHeader,
		Select,
		Textarea
	} from '$lib/components';
	import {
		PATH_LIMITS,
		editPathSchema,
		pathStatusLabel,
		pathStatusTone,
		type Path
	} from '$lib/learnpath';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The server owns the path; a copy is mutated in place as it is edited, published
	// and reordered, so the page never has to reload to reflect a change it just made.
	let path = $state<Path>(untrack(() => data.path));
	let order = $state<string[]>(untrack(() => data.path.course_ids ?? []));
	let addId = $state('');

	// Re-seed when navigating to a different path — the component is reused across slugs.
	$effect(() => {
		const fresh = data.path;
		untrack(() => {
			path = fresh;
			order = fresh.course_ids ?? [];
		});
	});

	let errors = $state<FieldErrors>({});
	let savingDetails = $state(false);
	let togglingStatus = $state(false);
	let savingOrder = $state(false);

	const isDraft = $derived(path.status === 'draft');

	// The workspace's courses, to name an id and to offer the ones not yet on the path.
	const courseTitles = $derived(new Map(data.courses.map((c) => [c.id, c.title])));
	const courseTitle = (id: string) => courseTitles.get(id) ?? 'Unknown course';
	const available = $derived(data.courses.filter((c) => !order.includes(c.id)));

	function addCourse() {
		if (!addId || order.includes(addId)) return;
		order = [...order, addId];
		addId = '';
	}

	function removeCourse(id: string) {
		order = order.filter((c) => c !== id);
	}

	function move(index: number, delta: number) {
		const next = index + delta;
		if (next < 0 || next >= order.length) return;
		const copy = [...order];
		[copy[index], copy[next]] = [copy[next], copy[index]];
		order = copy;
	}
</script>

<svelte:head><title>{path.title} — Muallim</title></svelte:head>

<a
	href={resolve('/teach/learning-paths')}
	class="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
>
	<Icon icon={ArrowLeft01Icon} class="size-4" />
	All learning paths
</a>

<div class="mt-4">
	<PageHeader title={path.title}>
		{#snippet meta()}
			<Badge tone={pathStatusTone(path.status)}>{pathStatusLabel(path.status)}</Badge>
			<span class="text-muted">{order.length} {order.length === 1 ? 'course' : 'courses'}</span>
			<span class="text-muted/70">{path.slug}</span>
		{/snippet}
		{#snippet actions()}
			<form
				method="POST"
				action="?/setStatus"
				use:enhance={() => {
					togglingStatus = true;
					return async ({ result }) => {
						togglingStatus = false;
						if (result.type !== 'success') return applyAction(result);
						const saved = result.data?.savedPath as Path | undefined;
						if (saved) {
							path = saved;
							toast.success(
								saved.status === 'published'
									? 'The path is published.'
									: 'The path is a draft again.'
							);
						}
					};
				}}
			>
				<input type="hidden" name="status" value={isDraft ? 'published' : 'draft'} />
				<Button
					type="submit"
					variant={isDraft ? 'primary' : 'secondary'}
					loading={togglingStatus}
					disabled={togglingStatus}
				>
					<Icon icon={SentIcon} class="size-4" />
					{isDraft ? 'Publish' : 'Unpublish'}
				</Button>
			</form>
		{/snippet}
	</PageHeader>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<!-- --------------------------------------------------------------------- details -->
<section class="mt-8">
	<h2 class="text-lg font-semibold">Details</h2>
	<p class="mt-1 text-sm text-muted">The title and description a learner sees.</p>

	<form
		method="POST"
		action="?/edit"
		class="mt-4"
		use:enhance={validated(
			editPathSchema,
			(next) => (errors = next),
			() => {
				savingDetails = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					savingDetails = false;
					if (result.type !== 'success') return;
					const saved = result.data?.savedPath as Path | undefined;
					if (saved) {
						path = saved;
						toast.success('The details have been saved.');
					}
				};
			}
		)}
	>
		<div class="grid gap-5">
			<Field id="title" label="Title" error={errors.title}>
				{#snippet children({ id, describedBy, invalid })}
					<Input
						{id}
						{invalid}
						name="title"
						value={path.title}
						aria-describedby={describedBy}
						{...PATH_LIMITS.title}
					/>
				{/snippet}
			</Field>

			<Field id="description" label="Description" error={errors.description}>
				{#snippet children({ id, describedBy, invalid })}
					<Textarea
						{id}
						{invalid}
						name="description"
						value={path.description ?? ''}
						placeholder="What a learner works through, and why."
						aria-describedby={describedBy}
						{...PATH_LIMITS.description}
					/>
				{/snippet}
			</Field>
		</div>

		<div class="mt-4">
			<Button type="submit" loading={savingDetails} disabled={savingDetails}>
				<Icon icon={FloppyDiskIcon} class="size-4" />
				Save details
			</Button>
		</div>
	</form>
</section>

<!-- --------------------------------------------------------------------- courses -->
<section class="mt-10">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 class="text-lg font-semibold">Courses</h2>
			<p class="mt-1 text-sm text-muted">
				The track, in order. Rearrange it, then save — the whole list is sent at once.
			</p>
		</div>
	</div>

	<!-- add a course -->
	{#if available.length > 0}
		<div class="mt-4 flex flex-wrap items-end gap-3">
			<div class="w-72 max-w-full">
				<Field id="add-course" label="Add a course">
					{#snippet children({ id })}
						<Select {id} name="add" bind:value={addId}>
							<option value="">Choose a course</option>
							{#each available as course (course.id)}
								<option value={course.id}>{course.title}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
			<Button type="button" variant="secondary" onclick={addCourse} disabled={!addId}>
				<Icon icon={PlusSignIcon} class="size-4" />
				Add
			</Button>
		</div>
	{/if}

	<!-- the ordered list -->
	<div class="mt-6">
		{#if order.length === 0}
			<EmptyState
				icon={Route02Icon}
				title="No courses on this path yet"
				description="Add a course above to start the track."
			/>
		{:else}
			<ol class="space-y-2">
				{#each order as id, index (id)}
					<li>
						<Card class="flex items-center gap-3 p-3">
							<span class="numeral w-6 shrink-0 text-center text-sm text-muted">{index + 1}</span>
							<span class="min-w-0 flex-1 truncate font-medium">{courseTitle(id)}</span>
							<div class="flex shrink-0 items-center gap-1">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onclick={() => move(index, -1)}
									disabled={index === 0}
									aria-label="Move up"
								>
									<Icon icon={ArrowUp01Icon} class="size-4" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onclick={() => move(index, 1)}
									disabled={index === order.length - 1}
									aria-label="Move down"
								>
									<Icon icon={ArrowDown01Icon} class="size-4" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onclick={() => removeCourse(id)}
									aria-label="Remove {courseTitle(id)}"
								>
									<Icon icon={Delete02Icon} class="size-4" />
								</Button>
							</div>
						</Card>
					</li>
				{/each}
			</ol>
		{/if}
	</div>

	<!-- save the whole order -->
	<form
		method="POST"
		action="?/setCourses"
		class="mt-6"
		use:enhance={() => {
			savingOrder = true;
			return async ({ result }) => {
				savingOrder = false;
				if (result.type !== 'success') return applyAction(result);
				const saved = result.data?.savedPath as Path | undefined;
				if (saved) {
					path = saved;
					order = saved.course_ids ?? [];
					toast.success('The course order has been saved.');
				}
			};
		}}
	>
		{#each order as id (id)}
			<input type="hidden" name="course_ids" value={id} />
		{/each}
		<Button type="submit" loading={savingOrder} disabled={savingOrder}>
			<Icon icon={FloppyDiskIcon} class="size-4" />
			Save course order
		</Button>
	</form>
</section>
