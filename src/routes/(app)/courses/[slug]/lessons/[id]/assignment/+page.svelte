<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Alert02Icon, Clock01Icon, SentIcon, Upload01Icon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		Card,
		EmptyState,
		FileList,
		Icon,
		Page,
		PageHeader,
		Score
	} from '$lib/components';
	import { lessonTitle, lessonTrail } from '$lib/breadcrumbs';
	import { actionMessage, callAction } from '$lib/form';
	import { toast } from '$lib/toast.svelte';
	import {
		deadlineState,
		formatBytes,
		putToStore,
		rejectFile,
		type SignedUpload
	} from '$lib/upload';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const crumbs = $derived(
		lessonTrail(
			data.slug,
			data.course.title,
			data.lessonId,
			lessonTitle(data.topics, data.lessonId),
			{
				label: 'Assignment'
			}
		)
	);

	const assignment = $derived(data.assignment);
	const submission = $derived(data.submission);
	const files = $derived(submission?.files ?? []);

	const handedIn = $derived(submission?.status === 'submitted' || submission?.status === 'graded');
	const graded = $derived(submission?.status === 'graded');

	/*
		The deadline as it stands right now, evaluated once per render rather than on
		a ticking clock. A page left open across midnight shows a stale word until
		something else changes; the API is the one that decides, when work is handed
		in, and it will refuse what this page thinks is still open.
	*/
	const deadline = $derived(deadlineState(assignment.due_at, assignment.allow_late, new Date()));

	// Handing in is refused past a hard deadline, so the button says so rather than
	// waiting for a 409 to explain it.
	const closed = $derived(deadline === 'closed' && !handedIn);

	let uploading = $state(false);
	let input = $state<HTMLInputElement | null>(null);

	const dateFormat = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	/**
	 * Sign, upload, confirm — for each chosen file, one after another.
	 *
	 * In sequence and not in parallel: the API counts attached files against the
	 * limit as it signs, and two signatures issued before either was confirmed
	 * would both believe there was room. The store would take them and the second
	 * confirm would be refused, leaving an object nobody has a row for.
	 */
	async function upload(chosen: File[]) {
		uploading = true;

		try {
			for (const file of chosen) {
				const refusal = rejectFile(file, {
					maxBytes: assignment.max_bytes,
					maxFiles: assignment.max_files,
					attached: files.length
				});

				if (refusal) {
					toast.danger(refusal);
					// One bad file does not cancel the rest of a selection.
					continue;
				}

				const signed = await callAction('?/presign', { filename: file.name, bytes: file.size });
				if (signed.type !== 'success') {
					toast.danger(actionMessage(signed, `${file.name} could not be uploaded.`));
					continue;
				}

				await putToStore(signed.data?.upload as SignedUpload, file);

				const confirmed = await callAction('?/confirm', {
					key: (signed.data?.upload as SignedUpload).key,
					filename: file.name
				});
				if (confirmed.type !== 'success') {
					toast.danger(actionMessage(confirmed, `${file.name} could not be attached.`));
					continue;
				}

				// The row now exists. Re-running the loader is what puts it on the page,
				// and it is also what keeps `files.length` honest for the next iteration.
				await invalidateAll();
				toast.success(`${file.name} attached.`);
			}
		} catch (problem) {
			toast.danger(problem instanceof Error ? problem.message : 'That upload failed.');
		} finally {
			uploading = false;
			// Clearing it lets the same file be chosen again after a failure; a file
			// input fires no change event when its value has not changed.
			if (input) input.value = '';
		}
	}
</script>

<svelte:head><title>{assignment.title} — Muallim</title></svelte:head>

<Page>
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title={assignment.title}>
		{#snippet meta()}
			{#if graded}
				<Badge tone="success">Marked</Badge>
			{:else if handedIn}
				<Badge tone="accent">Handed in</Badge>
			{/if}

			{#if submission?.late}
				<Badge tone="warning">Late</Badge>
			{/if}

			<span class="text-muted">
				Worth <span class="numeral">{assignment.points}</span> points · pass at
				<span class="numeral">{assignment.passing_points}</span>
			</span>
		{/snippet}
	</PageHeader>

	{#if assignment.due_at}
		<p class="text-muted mt-3 flex items-center gap-2 text-sm">
			<Icon icon={Clock01Icon} />
			{#if deadline === 'open'}
				Due {dateFormat.format(new Date(assignment.due_at))}
			{:else if deadline === 'late'}
				<span class="text-warning-text">
					Was due {dateFormat.format(new Date(assignment.due_at))}. Late work is accepted.
				</span>
			{:else}
				<span class="text-danger-text">
					Closed {dateFormat.format(new Date(assignment.due_at))}
				</span>
			{/if}
		</p>
	{/if}

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<!--
		The download action's result, for a reader with no JavaScript. `FileList`
		normally consumes it and navigates; when it cannot, the URL lands here.
	-->
	{#if form?.url}
		<Alert class="mt-6" role="status">
			<a class="underline-grow" href={form.url} rel="noreferrer">Your download is ready.</a>
			It expires in five minutes.
		</Alert>
	{/if}

	{#if assignment.instructions}
		<div class="prose mt-8 whitespace-pre-wrap">{assignment.instructions}</div>
	{/if}

	{#if !data.signedIn}
		<Alert class="mt-10">Sign in and enrol on this course to hand work in.</Alert>
	{:else if graded}
		<Card float class="mt-10 p-6">
			<Score
				points={submission?.points ?? 0}
				maxPoints={assignment.points}
				passed={(submission?.points ?? 0) >= assignment.passing_points}
			/>

			{#if submission?.feedback}
				<div class="mt-6 border-t border-border pt-6">
					<h2 class="text-sm font-medium">Feedback</h2>
					<p class="text-muted mt-2 text-sm whitespace-pre-wrap">{submission.feedback}</p>
				</div>
			{/if}
		</Card>

		<h2 class="mt-10 text-sm font-medium">What you handed in</h2>
		<div class="mt-3"><FileList {files} /></div>
	{:else if handedIn}
		<Alert tone="success" class="mt-10" role="status">
			Handed in{#if submission?.submitted_at}
				on {dateFormat.format(new Date(submission.submitted_at))}{/if}. It is waiting to be marked.
		</Alert>

		<h2 class="mt-8 text-sm font-medium">What you handed in</h2>
		<div class="mt-3"><FileList {files} /></div>
	{:else}
		<section class="mt-10">
			<div class="flex items-baseline justify-between">
				<h2 class="text-sm font-medium">Your files</h2>
				<p class="text-muted numeral text-xs">
					{files.length} of {assignment.max_files} · up to {formatBytes(assignment.max_bytes)} each
				</p>
			</div>

			<div class="mt-3">
				{#if files.length > 0}
					<FileList {files} removable />
				{:else}
					<EmptyState
						icon={Upload01Icon}
						title="Nothing attached yet"
						description="Add your work, then hand it in."
					/>
				{/if}
			</div>

			{#if closed}
				<Alert tone="danger" class="mt-6">
					The deadline has passed and this assignment does not accept late work.
				</Alert>
			{:else}
				<div class="mt-6 flex flex-wrap items-center gap-4">
					<!--
						A real file input, kept off-screen rather than hidden: `display: none`
						takes it out of the tab order, and then the only way to reach it is a
						mouse. A label pointing at it is the button.
					-->
					<input
						bind:this={input}
						id="assignment-files"
						type="file"
						multiple
						class="sr-only"
						disabled={uploading || files.length >= assignment.max_files}
						onchange={(event) => {
							const chosen = event.currentTarget.files;
							if (chosen && chosen.length > 0) upload(Array.from(chosen));
						}}
					/>

					<label
						for="assignment-files"
						class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-sunken focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
						aria-disabled={uploading || files.length >= assignment.max_files}
					>
						<Icon icon={Upload01Icon} />
						{uploading ? 'Uploading…' : 'Add files'}
					</label>

					<form method="POST" action="?/submit" use:enhance>
						<Button type="submit" disabled={files.length === 0 || uploading}>
							<Icon icon={SentIcon} class="size-4" />
							{deadline === 'late' ? 'Hand in late' : 'Hand in'}
						</Button>
					</form>
				</div>

				<p class="text-muted mt-4 flex items-start gap-2 text-xs">
					<Icon icon={Alert02Icon} class="mt-0.5 size-3.5 shrink-0" />
					Once you hand in, your files are frozen and you cannot change them.
				</p>
			{/if}
		</section>
	{/if}
</Page>
