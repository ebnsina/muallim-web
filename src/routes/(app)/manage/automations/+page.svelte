<script lang="ts">
	import { tick } from 'svelte';
	import { applyAction, enhance } from '$app/forms';
	import {
		Cancel01Icon,
		Delete02Icon,
		Edit02Icon,
		MailSend01Icon,
		PlusSignIcon
	} from '@hugeicons/core-free-icons';
	import {
		Alert,
		Badge,
		Button,
		Checkbox,
		EmptyState,
		Field,
		Icon,
		Input,
		Label,
		PageHeader,
		Select,
		Sheet,
		Textarea
	} from '$lib/components';
	import {
		AUTOMATION_LIMITS,
		automationCreateSchema,
		automationEditSchema,
		eventDescription,
		eventLabel,
		placeholderHint,
		placeholderToken,
		placeholdersFor,
		unknownPlaceholders,
		type Automation
	} from '$lib/automations';
	import { toast } from '$lib/toast.svelte';
	import { validated, type FieldErrors } from '$lib/validation';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The rows on screen, seeded by the server and mutated in place as rules are
	// written, switched, and deleted.
	let rules = $derived(data.rules as Automation[]);

	const SUBJECT_ID = 'automation-subject';
	const BODY_ID = 'automation-body';

	let sheetOpen = $state(false);
	let editing = $state<Automation | null>(null);
	let eventKey = $state('');
	let subjectValue = $state('');
	let bodyValue = $state('');
	let enabledValue = $state(false);
	let errors = $state<FieldErrors>({});
	let saving = $state(false);
	let toggling = $state<string | null>(null);
	let confirming = $state<string | null>(null);
	let removing = $state<string | null>(null);

	// Which box a placeholder lands in: the one the author last had a caret in.
	let lastFocused = $state<'subject' | 'body'>('body');

	const canWrite = $derived(data.events.length > 0);

	// What the chosen event offers a template. muallim-api holds this list; a name
	// outside it is refused when the rule is saved.
	const allowed = $derived(placeholdersFor(data.events, eventKey));
	const unknown = $derived(unknownPlaceholders(`${subjectValue}\n${bodyValue}`, allowed));

	function openNew() {
		editing = null;
		eventKey = data.events[0]?.event ?? '';
		subjectValue = '';
		bodyValue = '';
		enabledValue = false;
		errors = {};
		lastFocused = 'body';
		sheetOpen = true;
	}

	function openEdit(rule: Automation) {
		editing = rule;
		eventKey = rule.event;
		subjectValue = rule.subject;
		bodyValue = rule.body;
		enabledValue = rule.enabled;
		errors = {};
		lastFocused = 'body';
		confirming = null;
		sheetOpen = true;
	}

	/*
		Drop a placeholder where the author was typing, rather than at the end: a
		subject is written around the name, not after it.
	*/
	async function insert(name: string) {
		const el = document.getElementById(lastFocused === 'subject' ? SUBJECT_ID : BODY_ID) as
			HTMLInputElement | HTMLTextAreaElement | null;
		if (!el) return;

		const token = placeholderToken(name);
		const start = el.selectionStart ?? el.value.length;
		const end = el.selectionEnd ?? start;
		const next = el.value.slice(0, start) + token + el.value.slice(end);

		if (lastFocused === 'subject') subjectValue = next;
		else bodyValue = next;

		await tick();
		el.focus();
		el.setSelectionRange(start + token.length, start + token.length);
	}

	function replace(rule: Automation) {
		rules = rules.map((r) => (r.id === rule.id ? rule : r));
	}
</script>

<svelte:head><title>Automations — Muallim</title></svelte:head>

<PageHeader
	title="Automations"
	description="Emails your workspace sends by itself — a welcome the moment a learner enrols, a word of congratulation when they finish. Each one waits, switched off, until you switch it on."
>
	{#snippet actions()}
		<Button onclick={openNew} disabled={!canWrite}>
			<Icon icon={PlusSignIcon} class="size-4" />
			New automation
		</Button>
	{/snippet}
</PageHeader>

{#if form?.message}
	<Alert tone="danger" class="mt-6" role="alert">{form.message}</Alert>
{/if}

{#if data.eventsError}
	<Alert tone="warning" class="mt-6">{data.eventsError}</Alert>
{/if}

<!-- ---------------------------------------------------------------- the form -->
{#if sheetOpen}
	<form
		method="POST"
		action={editing ? '?/update' : '?/create'}
		use:enhance={validated(
			editing ? automationEditSchema : automationCreateSchema,
			(next) => (errors = next),
			() => {
				saving = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: false });
					saving = false;
					if (result.type !== 'success') return;

					const created = result.data?.created as Automation | undefined;
					const updated = result.data?.updated as Automation | undefined;

					if (created) {
						rules = [created, ...rules];
						toast.success('Your automation has been saved.');
					} else if (updated) {
						replace(updated);
						toast.success('Your changes have been saved.');
					}

					if (created || updated) sheetOpen = false;
				};
			}
		)}
	>
		<Sheet open={sheetOpen} onClose={() => (sheetOpen = false)}>
			{#snippet header()}
				<h2 class="font-medium">{editing ? 'Edit automation' : 'A new automation'}</h2>
				<p class="text-muted mt-0.5 text-sm">Choose what sets the email off, then write it.</p>
			{/snippet}

			<div class="space-y-5">
				{#if editing}
					<!-- The event is fixed once the rule is written: one that fires on something
					     else is a different rule, so it is told, not asked. -->
					<input type="hidden" name="id" value={editing.id} />
					<div>
						<Label for="automation-event-fixed">Sent</Label>
						<p id="automation-event-fixed" class="mt-2 font-medium">
							{eventLabel(editing.event)}
						</p>
						<p class="text-muted mt-1 text-sm">
							{eventDescription(editing.event)} To send for something else, write a second automation.
						</p>
					</div>
				{:else}
					<Field
						id="automation-event"
						label="Send this"
						hint={eventDescription(eventKey)}
						error={errors.event}
					>
						{#snippet children({ id, describedBy, invalid })}
							<Select
								{id}
								{invalid}
								name="event"
								bind:value={eventKey}
								aria-describedby={describedBy}
							>
								{#each data.events as option (option.event)}
									<option value={option.event}>{eventLabel(option.event)}</option>
								{/each}
							</Select>
						{/snippet}
					</Field>
				{/if}

				<Field id={SUBJECT_ID} label="Subject" error={errors.subject}>
					{#snippet children({ id, describedBy, invalid })}
						<Input
							{id}
							{invalid}
							name="subject"
							bind:value={subjectValue}
							onfocus={() => (lastFocused = 'subject')}
							placeholder="Your place is confirmed"
							aria-describedby={describedBy}
							{...AUTOMATION_LIMITS.subject}
						/>
					{/snippet}
				</Field>

				<Field id={BODY_ID} label="Message" error={errors.body}>
					{#snippet children({ id, describedBy, invalid })}
						<Textarea
							{id}
							{invalid}
							name="body"
							rows={8}
							bind:value={bodyValue}
							onfocus={() => (lastFocused = 'body')}
							aria-describedby={describedBy}
							{...AUTOMATION_LIMITS.body}
						/>
					{/snippet}
				</Field>

				<!-- The whole reason the events list exists: the author is shown what this
				     event can fill in, rather than guessing and being refused on save. -->
				{#if allowed.length > 0}
					<div class="border-border bg-surface-sunken/40 rounded-card border p-4">
						<p class="text-sm font-medium">Words the email fills in for you</p>
						<p class="text-muted mt-1 text-sm">
							Choose one and it drops into whichever box you were typing in — {placeholderToken(
								allowed[0]
							)} becomes {placeholderHint(allowed[0])}.
						</p>
						<div class="mt-3 flex flex-wrap gap-2">
							{#each allowed as name (name)}
								<button
									type="button"
									onclick={() => insert(name)}
									title="Becomes {placeholderHint(name)}"
									class="border-border bg-surface-raised hover:border-border-strong hover:bg-surface-hover focus-visible:ring-ring rounded-control border px-2.5 py-1 font-mono text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
								>
									{placeholderToken(name)}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if unknown.length > 0}
					<Alert tone="warning">
						This email asks for {unknown.map(placeholderToken).join(', ')}, which
						{unknown.length === 1 ? 'is not something' : 'are not things'} we can fill in here. Use one
						of the words above, or take it out — it will be refused otherwise.
					</Alert>
				{/if}

				<div class="flex items-start gap-3">
					<Checkbox id="automation-enabled" name="enabled" bind:checked={enabledValue} />
					<div class="min-w-0">
						<Label for="automation-enabled">Switch it on now</Label>
						<p class="text-muted mt-1 text-sm">
							While it is off, nothing is sent. On, and the next person this applies to gets it.
						</p>
					</div>
				</div>
			</div>

			{#snippet footer()}
				<Button type="button" variant="secondary" onclick={() => (sheetOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" loading={saving} disabled={saving}>
					<Icon icon={editing ? Edit02Icon : PlusSignIcon} class="size-4" />
					{editing ? 'Save changes' : 'Save automation'}
				</Button>
			{/snippet}
		</Sheet>
	</form>
{/if}

<!-- ---------------------------------------------------------------- the rules -->
<div class="mt-8">
	{#if rules.length === 0}
		<EmptyState
			icon={MailSend01Icon}
			title="No automations yet"
			description="An automation writes the email once and sends it every time — welcoming each learner who enrols, or congratulating each one who finishes a course. You never have to remember."
		>
			{#snippet action()}
				<Button onclick={openNew} disabled={!canWrite}>
					<Icon icon={PlusSignIcon} class="size-4" />
					Write your first one
				</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<ul class="max-w-4xl space-y-3">
			{#each rules as rule (rule.id)}
				<li class="border-border bg-surface-raised rounded-card border p-4">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<p class="font-medium">{eventLabel(rule.event)}</p>
								<Badge tone={rule.enabled ? 'success' : 'neutral'}>
									{rule.enabled ? 'On' : 'Off'}
								</Badge>
							</div>
							<p class="mt-1 truncate text-sm">{rule.subject}</p>
							<p class="text-muted mt-1 line-clamp-2 text-sm">{rule.body}</p>
						</div>

						<div class="flex shrink-0 items-center gap-2">
							<!-- On and off is the state that decides whether mail goes out, so it is
							     one click from the list rather than three from a form. -->
							<form
								method="POST"
								action="?/toggle"
								use:enhance={() => {
									toggling = rule.id;
									return async ({ result }) => {
										toggling = null;
										if (result.type !== 'success') return applyAction(result);
										const updated = result.data?.updated as Automation | undefined;
										if (!updated) return;
										replace(updated);
										toast.success(
											updated.enabled
												? 'That automation is on. It will be sent from now on.'
												: 'That automation is off. Nothing more will be sent.'
										);
									};
								}}
							>
								<input type="hidden" name="id" value={rule.id} />
								<input type="hidden" name="enabled" value={String(!rule.enabled)} />
								<button
									type="submit"
									role="switch"
									aria-checked={rule.enabled}
									aria-label="{rule.enabled ? 'Switch off' : 'Switch on'} the email for {eventLabel(
										rule.event
									).toLowerCase()}"
									disabled={toggling === rule.id}
									class={[
										'focus-visible:ring-ring relative inline-flex h-6 w-11 items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50',
										rule.enabled
											? 'border-accent bg-accent'
											: 'border-border-control bg-surface-sunken'
									]}
								>
									<span
										class={[
											'size-4 rounded-full bg-white shadow-sm transition-transform',
											rule.enabled ? 'translate-x-6' : 'translate-x-1'
										]}
									></span>
								</button>
							</form>

							<Button variant="secondary" size="sm" onclick={() => openEdit(rule)}>
								<Icon icon={Edit02Icon} class="size-4" />
								Edit
							</Button>

							{#if confirming === rule.id}
								<form
									method="POST"
									action="?/remove"
									class="flex items-center gap-2"
									use:enhance={() => {
										removing = rule.id;
										return async ({ result }) => {
											removing = null;
											confirming = null;
											if (result.type !== 'success') return applyAction(result);
											rules = rules.filter((r) => r.id !== rule.id);
											toast.success('That automation has been deleted.');
										};
									}}
								>
									<input type="hidden" name="id" value={rule.id} />
									<Button
										type="submit"
										variant="danger"
										size="sm"
										loading={removing === rule.id}
										disabled={removing === rule.id}
									>
										Delete for good
									</Button>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onclick={() => (confirming = null)}
									>
										<Icon icon={Cancel01Icon} class="size-4" />
										Keep
									</Button>
								</form>
							{:else}
								<Button variant="secondary" size="sm" onclick={() => (confirming = rule.id)}>
									<Icon icon={Delete02Icon} class="size-4" />
									Delete
								</Button>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
