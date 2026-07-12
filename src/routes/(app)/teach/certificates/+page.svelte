<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Delete02Icon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		Certificate,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Sheet,
		Textarea
	} from '$lib/components';
	import { renderPreview, SAMPLE } from '$lib/certificate-preview';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const crumbs = [{ label: 'Teach', href: resolve('/teach') }, { label: 'Certificate templates' }];

	// The default wording is the starting point, so an author edits from something
	// that already works. It is the description only — the learner's name, the
	// course, the date and the number are printed in their own places, so a body
	// that repeated them would say everything twice.
	const DEFAULT_BODY =
		'Awarded in recognition of dedication and the successful completion of every lesson and assessment this course requires.';

	let title = $state('Certificate of Completion');
	let body = $state(DEFAULT_BODY);
	let signatory = $state('');

	// Rendered against sample values, the same way the server renders the real
	// thing at issue. Unknown placeholders show through, so a typo is visible here.
	const previewBody = $derived(renderPreview(body, SAMPLE));
</script>

<svelte:head><title>Certificate templates — Muallim</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<PageHeader
		class="mt-4"
		title="Certificate templates"
		description="The words a certificate carries. A course prints the workspace default until you give it one of these."
	/>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{:else if form?.created}
		<Alert tone="success" class="mt-6" role="status">Saved “{form.created}”.</Alert>
	{/if}

	<!-- --------------------------------------------------- existing templates -->
	<section class="mt-8">
		<h2 class="text-sm font-medium tracking-wide uppercase">In this workspace</h2>

		<ul class="mt-4 space-y-2">
			{#each data.templates as template (template.id ?? 'builtin')}
				<li>
					<!-- Float: a list of templates sitting on the page, not a panel in it. The
					     form below is where an author works, and it keeps its border. -->
					<Card float class="flex flex-wrap items-start justify-between gap-4 p-4">
						<div class="min-w-0">
							<p class="flex items-center gap-2 font-medium">
								{template.name}
								{#if template.builtin}<Badge tone="neutral">Built in</Badge>{/if}
							</p>
							<p class="text-muted mt-1 text-sm">{template.title}</p>
						</div>

						{#if !template.builtin && template.id}
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={template.id} />
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

	<!-- ------------------------------------------------------------ new one -->
	<section class="mt-12">
		<!--
			The form sits above the preview, not beside it. A certificate is landscape,
			and a landscape thing in a half-width column is a cramped thing; below the
			form it has the whole page to be the shape it is.
		-->
		<div class="max-w-2xl">
			<form method="POST" action="?/create" use:enhance>
				<Sheet>
					{#snippet header()}
						<h2 class="font-medium">New template</h2>
						<p class="text-muted mt-0.5 text-sm">The words a certificate carries.</p>
					{/snippet}

					<div class="space-y-5">
						<Field id="name" label="Name" hint="For your own list. Not printed.">
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="name"
									aria-describedby={describedBy}
									required
									maxlength={100}
								/>
							{/snippet}
						</Field>

						<Field id="title" label="Heading">
							{#snippet children({ id, invalid })}
								<Input {id} {invalid} name="title" bind:value={title} required maxlength={200} />
							{/snippet}
						</Field>

						<Field
							id="body"
							label="Body"
							hint="Use {'{{learner}}'}, {'{{course}}'}, {'{{date}}'} and {'{{serial}}'}. Anything else prints exactly as written."
						>
							{#snippet children({ id, describedBy, invalid })}
								<Textarea
									{id}
									{invalid}
									name="body"
									rows={7}
									aria-describedby={describedBy}
									required
									maxlength={4000}
									bind:value={body}
								/>
							{/snippet}
						</Field>

						<Field
							id="signatory"
							label="Signed by"
							hint="Optional. A certificate signed by nobody is a receipt."
						>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="signatory"
									aria-describedby={describedBy}
									maxlength={200}
									bind:value={signatory}
									placeholder="The Registrar"
								/>
							{/snippet}
						</Field>
					</div>

					{#snippet footer()}
						<Button type="submit">Create template</Button>
					{/snippet}
				</Sheet>
			</form>
		</div>

		<!--
			The certificate as it will print, drawn with the same component the real one
			uses, against sample values. What an author sees here is what a learner
			frames — the only difference is the name and the number.
		-->
		<div class="mt-10">
			<p class="text-sm font-medium">Preview</p>
			<p class="text-muted mt-1 text-xs">Shown for a sample learner and course.</p>
			<div class="mt-3">
				<Certificate
					{title}
					learnerName={SAMPLE.learner}
					courseTitle={SAMPLE.course}
					issuedAt={SAMPLE.date}
					body={previewBody}
					{signatory}
					serial={SAMPLE.serial}
				/>
			</div>
		</div>
	</section>
</Page>
