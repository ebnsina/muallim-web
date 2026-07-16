<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { ArrowDown01Icon, Megaphone01Icon, SentIcon } from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Field,
		Icon,
		Input,
		Numeral,
		Select,
		Sheet,
		Textarea
	} from '$lib/components';
	import {
		AUDIENCES,
		CHANNELS,
		NOTICE_LIMITS,
		audienceLabel,
		audienceNeedsTarget,
		channelLabel,
		postNoticeSchema,
		type Audience,
		type Channel,
		type Notice
	} from '$lib/notices';
	import { appendPage, canLoadMore, type Paged } from '$lib/paging';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $state<FieldErrors>({});
	const problem = (field: string) => errors[field] ?? form?.errors?.[field];

	const noticeKey = (notice: Notice) => notice.id;

	// The rows on screen. Seeded by the server's first page; "Load more" appends the
	// next, and a fresh post goes to the head.
	let notices = $derived(data.notices as Paged<Notice>);

	// The names behind the ids a notice targets, so a class/section audience reads as a
	// name and not a UUID.
	const classMap = $derived(new Map(data.classes.map((klass) => [klass.id, klass.name])));
	const sectionMap = $derived(
		new Map(
			Object.values(data.sectionsByClass)
				.flat()
				.map((section) => [section.id, section.name])
		)
	);

	function targetLabel(notice: Notice): string {
		if (!notice.target_id) return '—';
		return classMap.get(notice.target_id) ?? sectionMap.get(notice.target_id) ?? '—';
	}

	let posting = $state(false);
	let loadingMore = $state(false);

	// The compose form's audience drives the target picker: a class for class_guardians,
	// a class then a section for section_guardians, and nothing for all_guardians. The
	// hidden `target_id` is derived from whichever picker the audience calls for.
	let audience = $state<Audience>('all_guardians');
	let channel = $state<Channel>('email');
	let pickedClass = $state('');
	let pickedSection = $state('');

	const needsTarget = $derived(audienceNeedsTarget(audience));
	const isSection = $derived(audience === 'section_guardians');
	const sections = $derived(pickedClass ? (data.sectionsByClass[pickedClass] ?? []) : []);

	// Changing the class drops a section that no longer belongs to it.
	$effect(() => {
		void pickedClass;
		pickedSection = '';
	});

	const targetId = $derived(!needsTarget ? '' : isSection ? pickedSection : pickedClass);
</script>

<svelte:head><title>Notices — Muallim</title></svelte:head>

<div class="flex flex-col gap-2">
	<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Notices</h1>
	<p class="max-w-2xl text-muted">Reach guardians by email or SMS, all at once or by class.</p>
</div>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

<div class="mt-8 grid items-start gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
	<!-- --------------------------------------------------------------- compose -->
	<form
		method="POST"
		action="?/post"
		use:enhance={validated(
			postNoticeSchema,
			(next) => (errors = next),
			() => {
				posting = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false, reset: false });
					posting = false;

					if (result.type !== 'success') return;

					const posted = result.data?.posted as Notice | undefined;
					if (posted) {
						notices = { ...notices, rows: [posted, ...notices.rows] };
						toast.success(`Notice sent to ${posted.recipient_count} recipients.`);
					}
				};
			}
		)}
	>
		<Sheet>
			{#snippet header()}
				<h2 class="font-medium">Post a notice</h2>
				<p class="mt-0.5 text-sm text-muted">
					It reaches every guardian in the audience you choose, in the channel you pick.
				</p>
			{/snippet}

			<div class="space-y-5">
				<Field id="title" label="Title" error={problem('title')}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="title"
							placeholder="School closed on Friday"
							aria-describedby={describedBy}
							{...NOTICE_LIMITS.title}
						/>
					{/snippet}
				</Field>

				<Field id="body" label="Message" error={problem('body')}>
					{#snippet children({ id, describedBy, invalid })}
						<Textarea
							{id}
							{invalid}
							name="body"
							rows={5}
							placeholder="Write the notice…"
							aria-describedby={describedBy}
							{...NOTICE_LIMITS.body}
						/>
					{/snippet}
				</Field>

				<Field id="audience" label="Audience" error={problem('audience')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="audience"
							bind:value={audience}
							aria-describedby={describedBy}
						>
							{#each AUDIENCES as option (option)}
								<option value={option}>{audienceLabel(option)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				{#if needsTarget}
					<Field
						id="target_class"
						label="Class"
						error={isSection ? undefined : problem('target_id')}
					>
						{#snippet children({ id, describedBy, invalid })}
							<Select {id} {invalid} bind:value={pickedClass} aria-describedby={describedBy}>
								<option value="">Choose a class</option>
								{#each data.classes as klass (klass.id)}
									<option value={klass.id}>{klass.name}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>
				{/if}

				{#if isSection}
					<Field id="target_section" label="Section" error={problem('target_id')}>
						{#snippet children({ id, describedBy, invalid })}
							<Select
								{id}
								{invalid}
								bind:value={pickedSection}
								disabled={sections.length === 0}
								aria-describedby={describedBy}
							>
								<option value="">{pickedClass ? 'Choose a section' : 'Choose a class first'}</option
								>
								{#each sections as section (section.id)}
									<option value={section.id}>{section.name}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>
				{/if}

				<!-- The target the audience calls for, derived from the pickers above. -->
				<input type="hidden" name="target_id" value={targetId} />

				<Field id="channel" label="Channel" error={problem('channel')}>
					{#snippet children({ id, describedBy, invalid })}
						<Select
							{id}
							{invalid}
							name="channel"
							bind:value={channel}
							aria-describedby={describedBy}
						>
							{#each CHANNELS as option (option)}
								<option value={option}>{channelLabel(option)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>

			{#snippet footer()}
				<Button type="submit" loading={posting} disabled={posting}>
					<Icon icon={SentIcon} class="size-4" />
					Post notice
				</Button>
			{/snippet}
		</Sheet>
	</form>

	<!-- ----------------------------------------------------------------- board -->
	<section>
		{#if notices.rows.length === 0}
			<div
				class="flex flex-col items-center rounded-card border border-dashed border-border px-6 py-12 text-center"
			>
				<Icon icon={Megaphone01Icon} class="size-8 text-muted" />
				<p class="mt-3 font-medium">No notices yet</p>
				<p class="mt-1 max-w-sm text-sm text-muted">
					Post your first notice and it will appear here with how many it reached.
				</p>
			</div>
		{:else}
			<ul class="space-y-3">
				{#each notices.rows as notice (notice.id)}
					<li class="rounded-card border border-border bg-surface-raised p-5">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="min-w-0">
								<h3 class="font-medium">{notice.title}</h3>
								<p class="mt-1 text-sm whitespace-pre-line text-muted">{notice.body}</p>
							</div>
							<span class="shrink-0 text-sm text-muted">
								<Numeral value={notice.recipient_count} /> reached
							</span>
						</div>

						<div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
							<Badge tone="accent">{audienceLabel(notice.audience)}</Badge>
							{#if notice.target_id}
								<Badge tone="neutral">{targetLabel(notice)}</Badge>
							{/if}
							<Badge tone="neutral">{channelLabel(notice.channel as Channel)}</Badge>
							<span class="text-muted">
								{new Date(notice.created_at).toLocaleDateString(undefined, {
									dateStyle: 'medium'
								})}
							</span>
						</div>
					</li>
				{/each}
			</ul>

			{#if canLoadMore(notices)}
				<form
					method="POST"
					action="?/more"
					class="mt-4 flex justify-center"
					use:enhance={() => {
						loadingMore = true;
						return async ({ result }) => {
							loadingMore = false;
							if (result.type !== 'success') return applyAction(result);

							const next = result.data?.more as Paged<Notice> | undefined;
							if (next) notices = appendPage(notices, next, noticeKey);
						};
					}}
				>
					<input type="hidden" name="cursor" value={notices.cursor} />
					<Button type="submit" variant="secondary" loading={loadingMore} disabled={loadingMore}>
						<Icon icon={ArrowDown01Icon} class="size-4" />
						Load more notices
					</Button>
				</form>
			{/if}
		{/if}
	</section>
</div>
