<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Add01Icon, Delete02Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		Checkbox,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Sheet
	} from '$lib/components';
	import { bandTone } from '$lib/grades';
	import {
		generalProblems,
		problemFor,
		scaleProblems,
		sortedBands,
		type DraftBand
	} from '$lib/scale-editor';
	import { LIMITS, scaleNameSchema } from '$lib/schemas';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const crumbs = [{ label: 'Teach', href: resolve('/teach') }, { label: 'Grading scales' }];

	// A new scale starts as pass/fail, the smallest valid scale, so the preview and
	// the validation both have something to say from the first render.
	let name = $state('');
	let bands = $state<DraftBand[]>([
		{ label: 'Pass', min: 50, isPass: true },
		{ label: 'Fail', min: 0, isPass: false }
	]);

	// The name is one field, so it is a schema like every other field on the app. The
	// bands are rules about each other, which is why they are not.
	let errors = $state<FieldErrors>({});
	const nameError = $derived(errors.name ?? form?.errors?.name);

	const problems = $derived(scaleProblems(bands));
	const general = $derived(generalProblems(problems));
	const preview = $derived(sortedBands(bands));
	const canSave = $derived(problems.length === 0);

	function addBand() {
		bands = [...bands, { label: '', min: '', isPass: false }];
	}

	function removeBand(index: number) {
		bands = bands.filter((_, i) => i !== index);
	}
</script>

<svelte:head><title>Grading scales — Muallim</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<PageHeader
		class="mt-4"
		title="Grading scales"
		description="Turn a percentage into a letter. A course grades by the workspace default until you point it at one of these."
	/>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{:else if form?.created}
		<Alert tone="success" class="mt-6" role="status">Saved “{form.created}”.</Alert>
	{/if}

	<!-- ------------------------------------------------------- existing scales -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold">In this workspace</h2>

		<ul class="mt-4 space-y-2">
			{#each data.scales as scale (scale.id ?? 'builtin')}
				<li>
					<!-- Float: these sit *on* the page as a scatter of scales. The editor below is
					     a working surface, and it keeps its border. -->
					<Card float class="flex flex-wrap items-center justify-between gap-4 p-4">
						<div class="min-w-0">
							<p class="flex items-center gap-2 font-medium">
								{scale.name}
								{#if scale.builtin}<Badge tone="neutral">Built in</Badge>{/if}
							</p>
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each scale.bands ?? [] as band (band.label)}
									<Badge tone={bandTone(band)}>
										{band.label}
										<span class="numeral ml-1 opacity-70">{band.min_percent}%+</span>
									</Badge>
								{/each}
							</div>
						</div>

						{#if !scale.builtin && scale.id}
							<!--
								Deleting is safe: courses grading by it fall back to the default, and
								grades already given keep the letters they were given. Two clicks all
								the same, because it is one fewer thing to undo by hand.
							-->
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={scale.id} />
								<Button type="submit" variant="ghost" size="sm">
									<span class="flex items-center gap-1.5">
										<Icon icon={Delete02Icon} class="size-4" /> Remove
									</span>
								</Button>
							</form>
						{/if}
					</Card>
				</li>
			{/each}
		</ul>
	</section>

	<!-- ------------------------------------------------------------ new scale -->
	<section class="mt-12">
		<form
			method="POST"
			action="?/create"
			use:enhance={validated(scaleNameSchema, (next) => (errors = next))}
			class="grid gap-8 lg:grid-cols-2"
		>
			<Sheet class="lg:self-start">
				{#snippet header()}
					<h2 class="font-medium">New scale</h2>
					<p class="text-muted mt-0.5 text-sm">Turn a range of percentages into a letter.</p>
				{/snippet}

				<Field id="scale-name" label="Name" error={nameError}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="name"
							bind:value={name}
							placeholder="Honours"
							{...LIMITS.scaleName}
							aria-describedby={describedBy}
						/>
					{/snippet}
				</Field>

				<div class="mt-6 space-y-3">
					<div class="flex items-baseline justify-between">
						<p class="text-sm font-medium">Bands</p>
						<span class="text-muted text-xs">Highest first, and one must start at 0%.</span>
					</div>

					{#each bands as band, index (index)}
						{@const bandProblem = problemFor(problems, index)}
						<div class="rounded-control border border-border p-3">
							<div class="flex flex-wrap items-end gap-3">
								<div class="min-w-0 flex-1">
									<label for="label-{index}" class="text-muted mb-1 block text-xs">Label</label>
									<Input id="label-{index}" name="label.{index}" bind:value={band.label} />
								</div>

								<div class="w-24">
									<label for="min-{index}" class="text-muted mb-1 block text-xs">From %</label>
									<Input
										id="min-{index}"
										name="min.{index}"
										type="number"
										min={0}
										max={100}
										class="numeral"
										bind:value={band.min}
									/>
								</div>

								<label class="flex items-center gap-1.5 pb-2.5 text-sm">
									<Checkbox name="pass.{index}" bind:checked={band.isPass} />
									Pass
								</label>

								<button
									type="button"
									class="text-muted hover:text-danger-text pb-2 transition-colors disabled:opacity-40"
									aria-label="Remove this band"
									disabled={bands.length <= 1}
									onclick={() => removeBand(index)}
								>
									<Icon icon={Delete02Icon} class="size-4" />
								</button>
							</div>

							{#if bandProblem}
								<p class="text-danger-text mt-2 text-xs">{bandProblem}</p>
							{/if}
						</div>
					{/each}

					<Button variant="secondary" size="sm" onclick={addBand}>
						<span class="flex items-center gap-1.5"
							><Icon icon={Add01Icon} class="size-4" /> Add band</span
						>
					</Button>
				</div>

				{#if general.length > 0}
					<ul class="mt-5 space-y-1">
						{#each general as message (message)}
							<li class="text-danger-text text-sm">{message}</li>
						{/each}
					</ul>
				{/if}

				{#snippet footer()}
					<Button type="submit" disabled={!canSave}>
						<Icon icon={PlusSignIcon} class="size-4" />
						Create scale
					</Button>
				{/snippet}
			</Sheet>

			<!--
				The scale, drawn as a learner will see it. Reordered to the highest floor
				first, because that is the order a scale is read in, whatever order the
				bands were typed.
			-->
			<div>
				<p class="text-sm font-medium">Preview</p>
				<Card float class="mt-2 p-5">
					<ul class="space-y-2">
						{#each preview as band, index (index)}
							<li class="flex items-center justify-between gap-3">
								<Badge tone={band.isPass ? 'success' : 'danger'}>
									{band.label || 'Untitled'}
								</Badge>
								<span class="text-muted numeral text-sm"
									>{band.min === '' ? '—' : band.min}% and up</span
								>
							</li>
						{/each}
					</ul>
				</Card>
				<p class="text-muted mt-3 text-xs">
					A score lands in the highest band it reaches. The API checks these rules too, and refuses
					a scale that breaks them.
				</p>
			</div>
		</form>
	</section>
</Page>
