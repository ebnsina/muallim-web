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

	type Props = { enabled?: boolean; lessonTitle: string; lessonContent?: string };
	let { enabled = false, lessonTitle, lessonContent = '' }: Props = $props();

	const chat = createChat({ connection: fetchServerSentEvents('/ai/generate') });
	onDestroy(() => chat.stop());

	type GenOption = { content?: string; correct?: boolean };
	type GenQuestion = {
		type?: string;
		prompt?: string;
		points?: number;
		options?: GenOption[];
		answers?: string[];
	};

	type TextPart = { type: string; content?: string; text?: string };
	const draft = $derived.by(() => {
		const last = [...chat.messages].reverse().find((m) => m.role === 'assistant');
		const parts = (last?.parts ?? []) as TextPart[];
		return parts
			.filter((p) => p.type === 'text')
			.map((p) => p.content ?? p.text ?? '')
			.join('');
	});

	let count = $state('5');
	let open = $state(false);
	let parsed = $state<GenQuestion[]>([]);
	let picked = $state<boolean[]>([]);
	let parseError = $state('');

	// Parse once the stream settles — the model returns a JSON array; slice to the
	// outermost brackets in case a stray word slips in front of it.
	$effect(() => {
		if (!open || chat.isLoading || !draft) return;
		const start = draft.indexOf('[');
		const end = draft.lastIndexOf(']');
		try {
			const arr = JSON.parse(start >= 0 && end > start ? draft.slice(start, end + 1) : draft);
			if (Array.isArray(arr) && arr.length) {
				parsed = arr as GenQuestion[];
				picked = arr.map(() => true);
				parseError = '';
			} else {
				parseError = 'No questions came back. Please try again.';
			}
		} catch {
			parseError = 'These questions didn’t come out right. Please try again.';
		}
	});

	const selected = $derived(parsed.filter((_, i) => picked[i]));

	function label(q: GenQuestion): string {
		return (q.type ?? 'question').replace(/_/g, ' ');
	}

	function generate() {
		if (chat.isLoading) return;
		parsed = [];
		parseError = '';
		open = true;
		chat.clear();
		chat.sendMessage(
			[
				`Write ${count} varied quiz questions for a lesson titled "${lessonTitle}".`,
				lessonContent ? `Base them on this lesson:\n${lessonContent.slice(0, 4000)}` : '',
				'Return ONLY a JSON array — no prose, no code fences. Each element is one of:',
				'{"type":"single_choice","prompt":"…","points":1,"options":[{"content":"…","correct":true},{"content":"…","correct":false},{"content":"…","correct":false},{"content":"…","correct":false}]} with exactly one correct option',
				'{"type":"true_false","prompt":"…","points":1,"options":[{"content":"True","correct":true},{"content":"False","correct":false}]}',
				'{"type":"short_answer","prompt":"…","points":1,"answers":["primary answer","acceptable alternative"]}',
				'Keep each prompt self-contained.'
			]
				.filter(Boolean)
				.join('\n')
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
		<div class="flex flex-wrap items-end gap-3">
			<div>
				<p class="font-medium">Generate with AI</p>
				<p class="mt-0.5 text-sm text-muted">
					Draft questions from this lesson, then pick what to keep.
				</p>
			</div>
			<div class="ml-auto flex items-end gap-2">
				<label class="text-sm">
					<span class="mb-1 block text-muted">Count</span>
					<Select bind:value={count} class="w-20">
						<option value="3">3</option>
						<option value="5">5</option>
						<option value="10">10</option>
					</Select>
				</label>
				<Button type="button" onclick={generate} disabled={chat.isLoading}>
					<Icon icon={SparklesIcon} class="size-4" />
					{chat.isLoading ? 'Generating…' : 'Generate'}
				</Button>
			</div>
		</div>

		{#if open}
			<div class="mt-4 border-t border-border pt-4">
				{#if chat.isLoading}
					<p class="text-sm text-muted">Writing questions…</p>
				{:else if parseError}
					<Alert tone="warning" role="alert">{parseError}</Alert>
				{:else if parsed.length}
					<ul class="space-y-2">
						{#each parsed as q, i (i)}
							<li class="flex items-start gap-3 rounded-control border border-border p-3">
								<input type="checkbox" bind:checked={picked[i]} class="mt-1" />
								<div class="min-w-0">
									<p class="text-sm font-medium text-pretty">{q.prompt}</p>
									<p class="mt-0.5 text-xs text-muted capitalize">{label(q)}</p>
								</div>
							</li>
						{/each}
					</ul>

					<form
						method="POST"
						action="?/addFromAi"
						class="mt-4 flex flex-wrap gap-2"
						use:enhance={() =>
							async ({ update }) => {
								await update();
								dismiss();
							}}
					>
						<input type="hidden" name="questions" value={JSON.stringify(selected)} />
						<Button type="submit" disabled={selected.length === 0}>
							Add {selected.length}
							{selected.length === 1 ? 'question' : 'questions'}
						</Button>
						<Button type="button" variant="ghost" onclick={dismiss}>Discard</Button>
					</form>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<div class="rounded-card border border-border bg-surface-raised p-5">
		<p class="font-medium">Generate with AI</p>
		<p class="mt-0.5 text-sm text-muted">
			Draft questions from this lesson, then pick what to keep.
		</p>
		<div class="mt-3">
			<AiOff label="Generate" />
		</div>
	</div>
{/if}
