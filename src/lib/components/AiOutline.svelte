<script lang="ts">
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { createChat, fetchServerSentEvents } from '@tanstack/ai-svelte';
	import { SparklesIcon } from '@hugeicons/core-free-icons';
	import AiOff from './AiOff.svelte';
	import Alert from './Alert.svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import Select from './Select.svelte';
	import Textarea from './Textarea.svelte';

	type Props = { enabled?: boolean; courseTitle: string };
	let { enabled = false, courseTitle }: Props = $props();

	type Section = { title?: string; lessons?: unknown };

	const chat = createChat({ connection: fetchServerSentEvents('/ai/generate') });
	onDestroy(() => chat.stop());

	type TextPart = { type: string; content?: string; text?: string };
	const draft = $derived.by(() => {
		const last = [...chat.messages].reverse().find((m) => m.role === 'assistant');
		const parts = (last?.parts ?? []) as TextPart[];
		return parts
			.filter((p) => p.type === 'text')
			.map((p) => p.content ?? p.text ?? '')
			.join('');
	});

	// Empty by default (the course title seeds it as a placeholder / fallback), so
	// there is no reactive prop captured into initial state.
	let brief = $state('');
	const effectiveBrief = $derived(brief.trim() || courseTitle);
	let count = $state('4');
	let open = $state(false);
	let parsed = $state<Section[]>([]);
	let picked = $state<boolean[]>([]);
	let parseError = $state('');

	$effect(() => {
		if (!open || chat.isLoading || !draft) return;
		const start = draft.indexOf('[');
		const end = draft.lastIndexOf(']');
		try {
			const arr = JSON.parse(start >= 0 && end > start ? draft.slice(start, end + 1) : draft);
			if (Array.isArray(arr) && arr.length) {
				parsed = arr as Section[];
				picked = arr.map(() => true);
				parseError = '';
			} else {
				parseError = 'No outline came back. Please try again.';
			}
		} catch {
			parseError = 'This outline didn’t come out right. Please try again.';
		}
	});

	const selected = $derived(parsed.filter((_, i) => picked[i]));

	function lessonTitles(s: Section): string[] {
		return (Array.isArray(s.lessons) ? s.lessons : [])
			.map((l) => (typeof l === 'string' ? l : ((l as { title?: string })?.title ?? '')))
			.filter(Boolean);
	}

	function generate() {
		if (chat.isLoading || !effectiveBrief) return;
		parsed = [];
		parseError = '';
		open = true;
		chat.clear();
		chat.sendMessage(
			[
				`Draft a course outline of ${count} sections for a course about: ${effectiveBrief}.`,
				'Each section has a short title and 3–5 lesson titles that build in order.',
				'Return ONLY a JSON array — no prose, no code fences — of the shape:',
				'[{"title":"Section title","lessons":["Lesson one","Lesson two","Lesson three"]}]'
			].join('\n')
		);
	}

	function dismiss() {
		chat.stop();
		chat.clear();
		parsed = [];
		open = false;
	}
</script>

{#if enabled}
	<div class="rounded-card border border-border bg-surface-raised p-5">
		<p class="font-medium">Draft an outline with AI</p>
		<p class="mt-0.5 text-sm text-muted">
			Describe the course; get sections and lessons to start from, then keep what fits.
		</p>

		<div class="mt-3 space-y-3">
			<Textarea
				rows={2}
				bind:value={brief}
				placeholder={courseTitle || 'What is this course about?'}
			/>
			<div class="flex flex-wrap items-end gap-2">
				<label class="text-sm">
					<span class="mb-1 block text-muted">Sections</span>
					<Select bind:value={count} class="w-20">
						<option value="3">3</option>
						<option value="4">4</option>
						<option value="5">5</option>
						<option value="6">6</option>
					</Select>
				</label>
				<Button type="button" onclick={generate} disabled={chat.isLoading || !effectiveBrief}>
					<Icon icon={SparklesIcon} class="size-4" />
					{chat.isLoading ? 'Generating…' : 'Generate'}
				</Button>
			</div>
		</div>

		{#if open}
			<div class="mt-4 border-t border-border pt-4">
				{#if chat.isLoading}
					<p class="text-sm text-muted">Sketching the outline…</p>
				{:else if parseError}
					<Alert tone="warning" role="alert">{parseError}</Alert>
				{:else if parsed.length}
					<ul class="space-y-2">
						{#each parsed as section, i (i)}
							<li class="flex items-start gap-3 rounded-control border border-border p-3">
								<input type="checkbox" bind:checked={picked[i]} class="mt-1" />
								<div class="min-w-0">
									<p class="font-medium">{section.title}</p>
									<ul class="mt-1 list-disc pl-5 text-sm text-muted">
										{#each lessonTitles(section) as lesson (lesson)}
											<li>{lesson}</li>
										{/each}
									</ul>
								</div>
							</li>
						{/each}
					</ul>

					<form
						method="POST"
						action="?/addOutline"
						class="mt-4 flex flex-wrap gap-2"
						use:enhance={() =>
							async ({ update }) => {
								await update();
								dismiss();
							}}
					>
						<input type="hidden" name="outline" value={JSON.stringify(selected)} />
						<Button type="submit" disabled={selected.length === 0}>
							Add {selected.length}
							{selected.length === 1 ? 'section' : 'sections'}
						</Button>
						<Button type="button" variant="ghost" onclick={dismiss}>Discard</Button>
					</form>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<div class="rounded-card border border-border bg-surface-raised p-5">
		<p class="font-medium">Draft an outline with AI</p>
		<p class="mt-0.5 text-sm text-muted">
			Describe the course; get sections and lessons to start from, then keep what fits.
		</p>
		<div class="mt-3">
			<AiOff label="Draft outline" />
		</div>
	</div>
{/if}
