<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		ArrowDown01Icon,
		ArrowUpRight01Icon,
		Clock01Icon,
		Delete02Icon,
		LiveStreaming02Icon,
		PencilEdit02Icon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Breadcrumbs,
		Button,
		EmptyState,
		Field,
		Icon,
		Input,
		Page,
		PageHeader,
		Sheet,
		Textarea
	} from '$lib/components';
	import {
		SESSION_LIMITS,
		formatSessionWhen,
		isUpcoming,
		scheduleSessionSchema,
		toDatetimeLocal,
		type Session
	} from '$lib/liveclass';
	import { appendPage, canLoadMore, removeRow, replaceRow, type Paged } from '$lib/paging';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const sessionKey = (session: Session) => session.id;

	// Seeded by the server and mutated in place as sessions are scheduled, edited and
	// deleted — the same pattern the fees desk uses.
	let sessions = $derived(data.sessions as Paged<Session>);

	const crumbs = $derived([
		{ label: 'Teaching', href: resolve('/teach') },
		{ label: data.course.title, href: resolve(`/teach/${data.course.slug}`) },
		{ label: 'Live sessions' }
	]);

	let scheduleOpen = $state(false);
	// The session being edited, or null for a brand-new one. The one dialog does both.
	let editing = $state<Session | null>(null);
	let formErrors = $state<FieldErrors>({});
	let saving = $state(false);
	let acting = $state<string | null>(null);
	let loadingMore = $state(false);

	// Remounts the fields when the dialog switches between new and a given session, so
	// the inputs pick up the seeded values rather than keeping the last ones.
	const dialogKey = $derived(editing?.id ?? 'new');

	function openSchedule() {
		editing = null;
		formErrors = {};
		scheduleOpen = true;
	}

	function openEdit(session: Session) {
		editing = session;
		formErrors = {};
		scheduleOpen = true;
	}

	function closeDialog() {
		scheduleOpen = false;
	}
</script>

<svelte:head><title>Live sessions — {data.course.title} — Muallim</title></svelte:head>

<Page width="full">
	<Breadcrumbs {crumbs} />

	<PageHeader class="mt-4" title="Live sessions">
		{#snippet actions()}
			<Button href={resolve(`/teach/${data.course.slug}`)} variant="secondary" size="sm">
				<Icon icon={ArrowUpRight01Icon} class="size-4" />
				Back to course
			</Button>
			<Button size="sm" onclick={openSchedule}>
				<Icon icon={PlusSignIcon} class="size-4" />
				Schedule session
			</Button>
		{/snippet}

		{#snippet meta()}
			<span class="text-muted">
				A meeting on {data.course.title}. Paste the link; enrolled learners join from it.
			</span>
		{/snippet}
	</PageHeader>

	{#if form?.message}
		<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
	{/if}

	<!-- ---------------------------------------------------------- schedule / edit -->
	{#if scheduleOpen}
		{#key dialogKey}
			<form
				method="POST"
				action={editing ? '?/update' : '?/schedule'}
				class="mt-6"
				use:enhance={validated(
					scheduleSessionSchema,
					(next) => (formErrors = next),
					() => {
						saving = true;
						return async ({ result, update }) => {
							await update({ invalidateAll: false });
							saving = false;
							if (result.type !== 'success') return;

							const created = result.data?.scheduledSession as Session | undefined;
							if (created) {
								sessions = { ...sessions, rows: [created, ...sessions.rows] };
								closeDialog();
								toast.success(`“${created.title}” has been scheduled.`);
								return;
							}

							const updated = result.data?.updatedSession as Session | undefined;
							if (updated) {
								sessions = replaceRow(sessions, sessionKey, updated.id, updated);
								closeDialog();
								toast.success(`“${updated.title}” has been updated.`);
							}
						};
					}
				)}
			>
				{#if editing}<input type="hidden" name="id" value={editing.id} />{/if}

				<Sheet open={scheduleOpen} onClose={closeDialog}>
					{#snippet header()}
						<h2 class="font-medium">{editing ? 'Edit session' : 'Schedule a session'}</h2>
						<p class="text-muted mt-0.5 text-sm">
							A live meeting on this course. Paste the link from Zoom, Meet or anywhere else —
							Muallim only holds the link and the time.
						</p>
					{/snippet}

					<div class="grid gap-5">
						<Field id="session-title" label="Title" error={formErrors.title}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="title"
									value={editing?.title ?? ''}
									placeholder="Week 1 live"
									aria-describedby={describedBy}
									{...SESSION_LIMITS.title}
								/>
							{/snippet}
						</Field>

						<Field id="session-url" label="Join link" error={formErrors.join_url}>
							{#snippet children({ id, describedBy, invalid })}
								<Input
									{id}
									{invalid}
									name="join_url"
									value={editing?.join_url ?? ''}
									aria-describedby={describedBy}
									{...SESSION_LIMITS.joinUrl}
								/>
							{/snippet}
						</Field>

						<div class="grid gap-5 sm:grid-cols-2">
							<Field id="session-start" label="Starts" error={formErrors.starts_at}>
								{#snippet children({ id, describedBy, invalid })}
									<Input
										{id}
										{invalid}
										name="starts_at"
										value={toDatetimeLocal(editing?.starts_at)}
										aria-describedby={describedBy}
										{...SESSION_LIMITS.startsAt}
									/>
								{/snippet}
							</Field>

							<Field id="session-end" label="Ends (optional)" error={formErrors.ends_at}>
								{#snippet children({ id, describedBy, invalid })}
									<Input
										{id}
										{invalid}
										name="ends_at"
										value={toDatetimeLocal(editing?.ends_at)}
										aria-describedby={describedBy}
										{...SESSION_LIMITS.endsAt}
									/>
								{/snippet}
							</Field>
						</div>

						<Field
							id="session-description"
							label="Description (optional)"
							error={formErrors.description}
						>
							{#snippet children({ id, describedBy, invalid })}
								<Textarea
									{id}
									{invalid}
									name="description"
									value={editing?.description ?? ''}
									placeholder="What this session covers, what to bring…"
									aria-describedby={describedBy}
									{...SESSION_LIMITS.description}
								/>
							{/snippet}
						</Field>
					</div>

					{#snippet footer()}
						<Button type="submit" loading={saving} disabled={saving}>
							<Icon icon={editing ? PencilEdit02Icon : PlusSignIcon} class="size-4" />
							{editing ? 'Save changes' : 'Schedule session'}
						</Button>
					{/snippet}
				</Sheet>
			</form>
		{/key}
	{/if}

	<!-- ------------------------------------------------------------------ list -->
	<section class="mt-10">
		{#if data.sessionsError && sessions.rows.length === 0}
			<Alert tone="warning" role="alert">{data.sessionsError}</Alert>
		{:else if sessions.rows.length === 0}
			<EmptyState
				icon={LiveStreaming02Icon}
				title="No live sessions yet"
				description="Schedule one above and it will appear here for every enrolled learner."
			/>
		{:else}
			<ul class="grid gap-3">
				{#each sessions.rows as session (session.id)}
					<li
						class="rounded-card border-border bg-surface-raised flex flex-wrap items-start justify-between gap-4 border p-4"
					>
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<p class="font-medium">{session.title}</p>
								{#if !isUpcoming(session)}
									<Badge tone="neutral">Ended</Badge>
								{/if}
							</div>
							<p class="text-muted mt-1 flex items-center gap-1.5 text-sm">
								<Icon icon={Clock01Icon} class="size-3.5 shrink-0" />
								{formatSessionWhen(session)}
							</p>
							{#if session.description}
								<p class="text-muted mt-1.5 max-w-2xl text-sm">{session.description}</p>
							{/if}
						</div>

						<div class="flex shrink-0 items-center gap-1">
							{#if session.join_url}
								<Button
									href={session.join_url}
									target="_blank"
									rel="noopener"
									variant="secondary"
									size="sm"
								>
									<Icon icon={ArrowUpRight01Icon} class="size-4" />
									Join
								</Button>
							{/if}
							<Button size="sm" variant="ghost" onclick={() => openEdit(session)}>
								<Icon icon={PencilEdit02Icon} class="size-4" />
								Edit
							</Button>
							<form
								method="POST"
								action="?/delete"
								use:enhance={() => {
									acting = session.id;
									return async ({ result }) => {
										acting = null;
										if (result.type !== 'success') return applyAction(result);
										sessions = removeRow(sessions, sessionKey, session.id);
										toast.success(`“${session.title}” has been deleted.`);
									};
								}}
							>
								<input type="hidden" name="id" value={session.id} />
								<Button
									type="submit"
									size="sm"
									variant="ghost"
									loading={acting === session.id}
									disabled={acting === session.id}
									aria-label="Delete {session.title}"
								>
									<Icon icon={Delete02Icon} class="size-4" />
								</Button>
							</form>
						</div>
					</li>
				{/each}
			</ul>

			{#if canLoadMore(sessions)}
				<form
					method="POST"
					action="?/more"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingMore = true;
						return async ({ result }) => {
							loadingMore = false;
							if (result.type !== 'success') return applyAction(result);
							const next = result.data?.more as Paged<Session> | undefined;
							if (next) sessions = appendPage(sessions, next, sessionKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={sessions.cursor} />
					<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more
					</Button>
				</form>
			{/if}
		{/if}
	</section>
</Page>
