<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import {
		ArrowDown01Icon,
		Certificate01Icon,
		CheckmarkCircle02Icon,
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
		EmptyState,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Sheet,
		Textarea
	} from '$lib/components';
	import { renderPreview, SAMPLE } from '$lib/certificate-preview';
	import { appendPage, canLoadMore, replaceRow, type Paged } from '$lib/paging';
	import { DURATION, easeOut } from '$lib/motion';
	import {
		LIMITS,
		certificateLookupSchema,
		certificateTemplateSchema,
		revokeCertificateSchema
	} from '$lib/schemas';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { components } from '$lib/api/schema';
	import type { PageProps } from './$types';

	type CertificateView = components['schemas']['CertificateView'];

	let { data, form }: PageProps = $props();

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const crumbs = [{ label: 'Teach', href: resolve('/teach') }, { label: 'Certificates' }];

	const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
	const key = (certificate: CertificateView) => certificate.serial;

	/* The rows on screen: the server's first page, plus whatever "Load more" appended.
	   A withdrawal replaces its row where it stands, so nothing under the reader moves. */
	let certificates = $derived(data.certificates as Paged<CertificateView>);

	// Withdrawing is asked about in the row itself. `window.confirm` is blocked, and a
	// dialog for a decision this size is a dialog nobody reads.
	let confirming = $state<string | null>(null);
	let revoking = $state<string | null>(null);
	let searching = $state(false);
	let loadingMore = $state(false);

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
		description="Every certificate this workspace has issued, and the words the next one will carry."
	/>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{:else if form?.created}
		<Alert tone="success" class="mt-6" role="status">Saved “{form.created}”.</Alert>
	{/if}

	<!-- ----------------------------------------------------------------- issued -->
	<section class="mt-8">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h2 class="text-lg font-semibold">Issued</h2>
				<p class="text-muted mt-1 text-sm">Newest first. A certificate is earned, not granted.</p>
			</div>

			<!-- Secondary: the list leads, but a registrar holding the number should not
			     have to page to it. It narrows the list to that one certificate. -->
			<form
				method="POST"
				action="?/find"
				class="flex items-start gap-2"
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
				<div class="w-56">
					<Input
						name="serial"
						value={data.serial ?? ''}
						invalid={Boolean(problem('serial'))}
						aria-label="Find a certificate by its number"
						placeholder="CERT-…"
						{...LIMITS.certificateSerial}
					/>
				</div>

				<Button type="submit" variant="secondary" loading={searching} disabled={searching}>
					<Icon icon={Search01Icon} class="size-4" />
					Find
				</Button>
			</form>
		</div>

		{#if problem('serial')}
			<p class="mt-2 text-right text-sm text-danger-text">{problem('serial')}</p>
		{/if}

		{#if data.serial}
			<div class="mt-4 flex flex-wrap items-center gap-3">
				<p class="text-muted text-sm">
					Showing the certificate numbered <span class="numeral text-text">{data.serial}</span>.
				</p>
				<Button href={resolve('/teach/certificates')} variant="ghost" size="sm">Show all</Button>
			</div>
		{/if}

		{#if data.notFound}
			<Alert tone="warning" class="mt-4" role="status">{data.notFound}</Alert>
		{:else if certificates.rows.length === 0}
			<div class="mt-4">
				<EmptyState
					icon={Certificate01Icon}
					title="Nothing issued yet"
					description="A certificate is issued when a learner completes a course that awards one. They will appear here, newest first."
				/>
			</div>
		{:else}
			<div class="mt-4 overflow-x-auto rounded-card bg-surface-raised shadow-card">
				<table class="w-full border-collapse text-sm">
					<caption class="sr-only">
						Every certificate: its number, who earned it, which course, when it was issued, and
						whether it still stands.
					</caption>

					<thead>
						<tr class="border-b border-border bg-surface-sunken text-left">
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Number</th>
							<th scope="col" class="px-4 py-3 font-medium">Learner</th>
							<th scope="col" class="px-4 py-3 font-medium">Course</th>
							<th scope="col" class="px-4 py-3 font-medium whitespace-nowrap">Issued</th>
							<th scope="col" class="px-4 py-3 font-medium">Status</th>
							<!-- Wide enough for the question the button turns into: asking must not
							     widen the table under the reader. -->
							<th scope="col" class="w-56 px-4 py-3 text-right font-medium">
								<span class="sr-only">Withdraw</span>
							</th>
						</tr>
					</thead>

					<tbody>
						{#each certificates.rows as certificate (certificate.serial)}
							<!-- No rule under a row whose reason or question is the next row: the two are
							     one thing, and a line between them would say they were two. -->
							<tr
								class="border-b border-border hover:bg-surface-sunken"
								class:border-0={confirming === certificate.serial ||
									(certificate.revoked && Boolean(certificate.revoked_reason))}
							>
								<th scope="row" class="numeral px-4 py-3 text-left font-medium whitespace-nowrap">
									<a
										class="underline-grow"
										href={resolve(`/verify/${certificate.serial}`)}
										target="_blank"
										rel="noopener"
									>
										{certificate.serial}
									</a>
								</th>

								<td class="px-4 py-3">{certificate.learner_name}</td>
								<td class="text-muted px-4 py-3">{certificate.course_title}</td>

								<td class="text-muted numeral px-4 py-3 whitespace-nowrap">
									{when.format(new Date(certificate.issued_at))}
								</td>

								<td class="px-4 py-3">
									<Badge
										tone={certificate.revoked ? 'danger' : 'success'}
										icon={certificate.revoked ? UnavailableIcon : CheckmarkCircle02Icon}
									>
										{certificate.revoked ? 'Withdrawn' : 'Valid'}
									</Badge>
								</td>

								<td class="px-4 py-3 text-right whitespace-nowrap">
									{#if certificate.revoked}
										<span class="text-muted numeral text-xs">
											{certificate.revoked_at ? when.format(new Date(certificate.revoked_at)) : ''}
										</span>
									{:else if confirming !== certificate.serial}
										<Button
											variant="secondary"
											size="sm"
											onclick={() => (confirming = certificate.serial)}
											aria-label="Withdraw certificate {certificate.serial}, {certificate.learner_name}"
										>
											<Icon icon={UnavailableIcon} class="size-4" />
											Withdraw
										</Button>
									{/if}
								</td>
							</tr>

							{#if certificate.revoked && certificate.revoked_reason}
								<tr class="border-b border-border last:border-0">
									<td colspan="6" class="px-4 pb-3">
										<p class="text-muted text-xs">
											<span class="font-medium text-danger-text">Withdrawn:</span>
											{certificate.revoked_reason}
										</p>
									</td>
								</tr>
							{/if}

							{#if confirming === certificate.serial}
								<!-- The reason is not a formality: it is what the number will say from now on. -->
								<tr class="border-b border-border last:border-0 bg-surface-sunken">
									<td colspan="6" class="px-4 py-0">
										<div transition:slide={{ duration: DURATION.base, easing: easeOut }}>
											<form
												method="POST"
												action="?/revoke"
												class="py-4"
												use:enhance={validated(
													revokeCertificateSchema,
													(next) => (errors = next),
													() => {
														revoking = certificate.serial;
														return async ({ result }) => {
															revoking = null;

															if (result.type !== 'success') {
																await applyAction(result);
																return;
															}

															confirming = null;

															// The row as the API now reads it back — not a guess at it.
															const after = result.data?.revoked as CertificateView | undefined;
															if (after) {
																certificates = replaceRow(
																	certificates,
																	key,
																	certificate.serial,
																	after
																);
															}
															toast.success('Withdrawn. The number now says so.');
														};
													}
												)}
											>
												<input type="hidden" name="serial" value={certificate.serial} />

												<div class="flex flex-wrap items-start justify-between gap-4">
													<div class="w-full max-w-md">
														<Field
															id="reason-{certificate.serial}"
															label="Why is it being withdrawn?"
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
													</div>

													<div class="flex items-center gap-2 pt-7">
														<Button
															type="submit"
															variant="danger"
															loading={revoking === certificate.serial}
															disabled={revoking === certificate.serial}
															aria-label="Yes, withdraw certificate {certificate.serial}"
														>
															<Icon icon={UnavailableIcon} class="size-4" />
															Yes, withdraw
														</Button>
														<Button
															type="button"
															variant="ghost"
															onclick={() => (confirming = null)}
														>
															Keep
														</Button>
													</div>
												</div>

												<p class="text-muted mt-3 max-w-md text-xs">
													The certificate is not deleted. The number keeps answering, and says it
													was withdrawn.
												</p>
											</form>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			<!-- No total: muallim-api runs no COUNT(*), so nothing here may claim one. The
			     button is the only thing that knows there is more, and it goes when there is not. -->
			{#if canLoadMore(certificates)}
				<form
					method="POST"
					action="?/more"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingMore = true;
						return async ({ result }) => {
							loadingMore = false;

							// Not `update()`: re-running the load would drop every page but the first.
							if (result.type !== 'success') return applyAction(result);

							const next = result.data?.more as Paged<CertificateView> | undefined;
							if (next) certificates = appendPage(certificates, next, key);
						};
					}}
				>
					<input type="hidden" name="cursor" value={certificates.cursor} />
					<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more certificates
					</Button>
				</form>
			{/if}
		{/if}
	</section>

	<!-- --------------------------------------------------- existing templates -->
	<section class="mt-12">
		<h2 class="text-lg font-semibold">Templates</h2>
		<p class="text-muted mt-1 text-sm">
			The words a certificate carries. A certificate already issued keeps the words it was issued
			with.
		</p>

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
</Page>
