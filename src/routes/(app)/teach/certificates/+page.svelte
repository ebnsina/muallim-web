<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Delete02Icon,
		PlusSignIcon,
		Search01Icon,
		UnavailableIcon
	} from '@hugeicons/core-free-icons';
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
	import {
		LIMITS,
		certificateLookupSchema,
		certificateTemplateSchema,
		revokeCertificateSchema
	} from '$lib/schemas';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const crumbs = [{ label: 'Teach', href: resolve('/teach') }, { label: 'Certificates' }];

	const found = $derived(data.lookup?.certificate ?? null);

	// Withdrawing is asked about before it is done, in the panel itself. `window.confirm`
	// is blocked, and a dialog for a decision this size is a dialog nobody reads.
	let confirming = $state(false);
	let revoking = $state(false);
	let searching = $state(false);

	const issued = $derived(
		found
			? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(found.issued_at))
			: ''
	);

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

<svelte:head><title>Certificates — Muallim</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<PageHeader
		class="mt-4"
		title="Certificates"
		description="The words a certificate carries, and the way to withdraw one that should not stand."
	/>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{:else if form?.created}
		<Alert tone="success" class="mt-6" role="status">Saved “{form.created}”.</Alert>
	{/if}

	<!-- --------------------------------------------------- existing templates -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold">In this workspace</h2>

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
			<form
				method="POST"
				action="?/create"
				use:enhance={validated(certificateTemplateSchema, (next) => (errors = next))}
			>
				<Sheet>
					{#snippet header()}
						<h2 class="font-medium">New template</h2>
						<p class="text-muted mt-0.5 text-sm">The words a certificate carries.</p>
					{/snippet}

					<div class="space-y-5">
						<Field
							id="name"
							label="Name"
							error={problem('name')}
							hint="For your own list. Not printed."
						>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="name"
									aria-describedby={describedBy}
									{...LIMITS.templateName}
								/>
							{/snippet}
						</Field>

						<Field id="title" label="Heading" error={problem('title')}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="title"
									aria-describedby={describedBy}
									{...LIMITS.templateHeading}
									bind:value={title}
								/>
							{/snippet}
						</Field>

						<Field
							id="body"
							label="Body"
							error={problem('body')}
							hint="Use {'{{learner}}'}, {'{{course}}'}, {'{{date}}'} and {'{{serial}}'}. Anything else prints exactly as written."
						>
							{#snippet children({ id, describedBy, invalid })}
								<Textarea
									{id}
									{invalid}
									name="body"
									rows={7}
									aria-describedby={describedBy}
									{...LIMITS.templateBody}
									bind:value={body}
								/>
							{/snippet}
						</Field>

						<Field
							id="signatory"
							label="Signed by"
							error={problem('signatory')}
							hint="Optional. A certificate signed by nobody is a receipt."
						>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="signatory"
									aria-describedby={describedBy}
									{...LIMITS.templateSignatory}
									bind:value={signatory}
									placeholder="The Registrar"
								/>
							{/snippet}
						</Field>
					</div>

					{#snippet footer()}
						<Button type="submit">
							<Icon icon={PlusSignIcon} class="size-4" />
							Create template
						</Button>
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

	<!-- --------------------------------------------------- withdraw a certificate -->
	<section class="mt-12 max-w-2xl">
		<h2 class="text-lg font-semibold">Withdraw a certificate</h2>
		<p class="text-muted mt-1 text-sm">
			A certificate is found by its number — the one printed on it. Nothing lists what a workspace
			has issued.
		</p>

		<form
			method="POST"
			action="?/find"
			class="mt-4"
			use:enhance={validated(
				certificateLookupSchema,
				(next) => (errors = next),
				() => {
					searching = true;
					return async ({ update }) => {
						await update();
						searching = false;
					};
				}
			)}
		>
			<Sheet>
				<Field
					id="serial"
					label="Certificate number"
					error={problem('serial')}
					hint="Printed at the foot of the certificate."
				>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="serial"
							value={data.lookup?.serial ?? ''}
							aria-describedby={describedBy}
							{...LIMITS.certificateSerial}
						/>
					{/snippet}
				</Field>

				{#snippet footer()}
					<Button type="submit" variant="secondary" loading={searching} disabled={searching}>
						<Icon icon={Search01Icon} class="size-4" />
						Find it
					</Button>
				{/snippet}
			</Sheet>
		</form>

		{#if data.lookup?.message}
			<Alert tone="warning" class="mt-4" role="status">{data.lookup.message}</Alert>
		{/if}

		{#if found}
			<Card float class="mt-4 p-5">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="font-medium">{found.learner_name}</p>
						<p class="text-muted mt-0.5 text-sm">{found.course_title}</p>
					</div>

					<Badge
						tone={found.revoked ? 'danger' : 'success'}
						icon={found.revoked ? UnavailableIcon : undefined}
					>
						{found.revoked ? 'Withdrawn' : 'Valid'}
					</Badge>
				</div>

				<dl class="text-muted mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
					<dt class="font-medium text-text">Issued</dt>
					<dd class="numeral">{issued}</dd>

					<dt class="font-medium text-text">Number</dt>
					<dd class="numeral">{found.serial}</dd>

					{#if found.revoked && found.revoked_reason}
						<dt class="font-medium text-danger-text">Reason</dt>
						<dd>{found.revoked_reason}</dd>
					{/if}
				</dl>

				{#if found.revoked}
					<p class="text-muted mt-4 text-xs">
						The number still answers, and tells whoever asks that this certificate was withdrawn. A
						withdrawal cannot be undone here.
					</p>
				{:else}
					<!-- The reason is not a formality: it is what the number will say from now on. -->
					<form
						method="POST"
						action="?/revoke"
						class="mt-5 border-t border-border pt-5"
						use:enhance={validated(
							revokeCertificateSchema,
							(next) => (errors = next),
							() => {
								revoking = true;
								return async ({ result, update }) => {
									await update();
									revoking = false;
									confirming = false;

									if (result.type === 'failure' || result.type === 'error') return;
									toast.success('Withdrawn. The number now says so.');
								};
							}
						)}
					>
						<input type="hidden" name="serial" value={found.serial} />

						<Field
							id="reason"
							label="Reason"
							error={problem('reason')}
							hint="Shown to anyone who checks the number."
						>
							{#snippet children({ id, describedBy, invalid })}
								<Textarea
									{id}
									{invalid}
									name="reason"
									rows={2}
									aria-describedby={describedBy}
									{...LIMITS.revokeReason}
								/>
							{/snippet}
						</Field>

						<!-- The caution stands whether or not the question has been asked, so asking it
					     swaps the buttons and moves nothing else. -->
						<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
							<p class="text-muted max-w-xs text-xs">
								The certificate is not deleted. The number keeps answering, and says it was
								withdrawn.
							</p>

							<div class="flex items-center gap-2">
								{#if confirming}
									<Button type="submit" variant="danger" loading={revoking} disabled={revoking}>
										<Icon icon={UnavailableIcon} class="size-4" />
										Yes, withdraw
									</Button>
									<Button type="button" variant="ghost" onclick={() => (confirming = false)}>
										Keep
									</Button>
								{:else}
									<Button type="button" variant="secondary" onclick={() => (confirming = true)}>
										<Icon icon={UnavailableIcon} class="size-4" />
										Withdraw this certificate
									</Button>
								{/if}
							</div>
						</div>
					</form>
				{/if}
			</Card>
		{/if}
	</section>
</Page>
