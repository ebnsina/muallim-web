<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		ArrowUp01Icon,
		BookOpen01Icon,
		FloppyDiskIcon,
		PlusSignIcon,
		RemoveCircleIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Breadcrumbs,
		Button,
		EmptyState,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Select,
		Textarea
	} from '$lib/components';
	import { BUNDLE_LIMITS, bundleEditSchema, toMajor, type Bundle } from '$lib/bundles';
	import type { components } from '$lib/api/schema';
	import { formatMoney } from '$lib/money';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	type Course = components['schemas']['CourseSummary'];

	let { data, form }: PageProps = $props();

	let bundle = $derived(data.bundle as Bundle);
	const courses = $derived(data.courses as Course[]);
	const courseTitle = $derived(new Map(courses.map((c) => [c.id, c.title])));

	const crumbs = $derived([
		{ label: 'Teach', href: resolve('/teach') },
		{ label: 'Bundles', href: resolve('/teach/bundles') },
		{ label: bundle.name }
	]);

	let editErrors = $state<FieldErrors>({});
	let saving = $state(false);
	let savingCourses = $state(false);

	// The ordered course ids the admin is arranging. Seeded once from the bundle
	// (`untrack`, because the initial snapshot is the point) and mutated in place by
	// add, remove, and the two nudges; the server is told the whole list on Save,
	// which replaces the bundle's list wholesale.
	let orderedIds = $state<string[]>(untrack(() => [...(data.bundle.course_ids ?? [])]));

	// The saved order, to know whether the working list has drifted from it.
	let savedIds = $state<string[]>(untrack(() => [...(data.bundle.course_ids ?? [])]));

	const dirty = $derived(
		orderedIds.length !== savedIds.length || orderedIds.some((id, i) => id !== savedIds[i])
	);

	// Courses not already in the bundle, for the picker. A course the title map does
	// not know (the workspace has more than the page fetched) still shows by id.
	const available = $derived(courses.filter((c) => !orderedIds.includes(c.id)));

	const titleFor = (id: string) => courseTitle.get(id) ?? id;

	let picked = $state('');

	function addCourse() {
		if (picked && !orderedIds.includes(picked)) orderedIds = [...orderedIds, picked];
		picked = '';
	}

	function removeCourse(id: string) {
		orderedIds = orderedIds.filter((c) => c !== id);
	}

	function move(index: number, delta: number) {
		const to = index + delta;
		if (to < 0 || to >= orderedIds.length) return;
		const next = [...orderedIds];
		[next[index], next[to]] = [next[to], next[index]];
		orderedIds = next;
	}
</script>

<svelte:head><title>{bundle.name} — Bundles — Muallim</title></svelte:head>

<Page width="wide">
	<Breadcrumbs {crumbs} class="mb-6" />

	<PageHeader title={bundle.name} description="Edit this bundle and choose the courses it sells.">
		{#snippet meta()}
			<span class="text-muted">/{bundle.slug}</span>
			<span class="font-medium">
				{formatMoney({ amount_minor: bundle.price_amount, currency: bundle.currency })}
			</span>
		{/snippet}
	</PageHeader>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<!-- ------------------------------------------------------------- details -->
	<section class="mt-8">
		<form
			method="POST"
			action="?/save"
			use:enhance={validated(
				bundleEditSchema,
				(next) => (editErrors = next),
				() => {
					saving = true;
					return async ({ result, update }) => {
						await update({ invalidateAll: false });
						saving = false;
						if (result.type !== 'success') return;

						const saved = result.data?.savedBundle as Bundle | undefined;
						if (saved) {
							bundle = saved;
							toast.success('The bundle has been saved.');
						}
					};
				}
			)}
		>
			<div class="rounded-card border border-border bg-surface-raised p-5 sm:p-6">
				<h2 class="text-lg font-semibold">Details</h2>
				<p class="mt-1 text-sm text-muted">The name, the price in taka, and an optional blurb.</p>

				<div class="mt-5 grid gap-5">
					<Field id="name" label="Name" error={editErrors.name}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="name"
								value={bundle.name}
								aria-describedby={describedBy}
								{...BUNDLE_LIMITS.name}
							/>
						{/snippet}
					</Field>

					<Field id="price" label="Price (৳)" error={editErrors.price}>
						{#snippet children({ id, describedBy, invalid })}
							<Input
								{id}
								{invalid}
								name="price"
								inputmode="decimal"
								value={toMajor(bundle.price_amount)}
								aria-describedby={describedBy}
								{...BUNDLE_LIMITS.price}
							/>
						{/snippet}
					</Field>

					<Field id="description" label="Description" error={editErrors.description}>
						{#snippet children({ id, describedBy, invalid })}
							<Textarea
								{id}
								{invalid}
								name="description"
								value={bundle.description}
								placeholder="Optional — what this bundle is for."
								aria-describedby={describedBy}
								{...BUNDLE_LIMITS.description}
							/>
						{/snippet}
					</Field>
				</div>

				<div class="mt-5 flex justify-end">
					<Button type="submit" loading={saving} disabled={saving}>
						<Icon icon={FloppyDiskIcon} class="size-4" />
						Save details
					</Button>
				</div>
			</div>
		</form>
	</section>

	<!-- ------------------------------------------------------------- courses -->
	<section class="mt-8">
		<div class="rounded-card border border-border bg-surface-raised p-5 sm:p-6">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 class="text-lg font-semibold">Courses</h2>
					<p class="mt-1 text-sm text-muted">
						The courses this bundle sells, in the order a buyer sees them.
					</p>
				</div>
				<form
					method="POST"
					action="?/setCourses"
					use:enhance={() => {
						savingCourses = true;
						return async ({ result, update }) => {
							await update({ invalidateAll: false });
							savingCourses = false;
							if (result.type !== 'success') return;
							const saved = result.data?.savedCourses as Bundle | undefined;
							if (saved) {
								savedIds = [...(saved.course_ids ?? [])];
								orderedIds = [...savedIds];
								toast.success('The course list has been saved.');
							}
						};
					}}
				>
					<input type="hidden" name="course_ids" value={orderedIds.join(',')} />
					<Button type="submit" loading={savingCourses} disabled={savingCourses || !dirty}>
						<Icon icon={FloppyDiskIcon} class="size-4" />
						Save courses
					</Button>
				</form>
			</div>

			<!-- add a course -->
			<div class="mt-5 flex flex-wrap items-end gap-3">
				<div class="w-full sm:w-80">
					<Field id="add-course" label="Add a course">
						{#snippet children({ id })}
							<Select {id} name="add" bind:value={picked} disabled={available.length === 0}>
								<option value="">
									{available.length === 0 ? 'Every course is in the bundle' : 'Choose a course…'}
								</option>
								{#each available as course (course.id)}
									<option value={course.id}>{course.title}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>
				</div>
				<Button variant="secondary" onclick={addCourse} disabled={!picked}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Add
				</Button>
			</div>

			<!-- the ordered list -->
			<div class="mt-6">
				{#if orderedIds.length === 0}
					<EmptyState
						icon={BookOpen01Icon}
						title="No courses in this bundle"
						description="Add a course above, then Save. A bundle with no courses sells nothing."
					/>
				{:else}
					<ol class="grid gap-2">
						{#each orderedIds as id, index (id)}
							<li
								class="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3"
							>
								<div class="flex min-w-0 items-center gap-3">
									<span class="numeral text-sm text-muted tabular-nums">{index + 1}</span>
									<span class="min-w-0 truncate font-medium">{titleFor(id)}</span>
								</div>
								<div class="flex shrink-0 items-center gap-1">
									<Button
										size="sm"
										variant="ghost"
										onclick={() => move(index, -1)}
										disabled={index === 0}
										aria-label="Move {titleFor(id)} up"
									>
										<Icon icon={ArrowUp01Icon} class="size-4" />
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onclick={() => move(index, 1)}
										disabled={index === orderedIds.length - 1}
										aria-label="Move {titleFor(id)} down"
									>
										<Icon icon={ArrowDown01Icon} class="size-4" />
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onclick={() => removeCourse(id)}
										aria-label="Remove {titleFor(id)}"
									>
										<Icon icon={RemoveCircleIcon} class="size-4" />
									</Button>
								</div>
							</li>
						{/each}
					</ol>

					{#if dirty}
						<p class="mt-3 text-xs text-muted">
							Unsaved changes to the course list. Save courses to keep them.
						</p>
					{/if}
				{/if}
			</div>
		</div>
	</section>
</Page>
