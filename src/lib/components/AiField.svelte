<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createChat, fetchServerSentEvents } from '@tanstack/ai-svelte';
	import { SparklesIcon } from '@hugeicons/core-free-icons';
	import AiOff from './AiOff.svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	type Props = {
		/** Builds the instruction sent to the model from the current form values. */
		prompt: () => string;
		/** Fills the target field with the accepted draft. */
		onaccept: (text: string) => void;
		/** Off unless the server has a provider key; then the control says so. */
		enabled?: boolean;
		label?: string;
	};

	let { prompt, onaccept, enabled = false, label = 'Draft with AI' }: Props = $props();

	// The endpoint is a muallim-web server route, not `/api` (which proxies to muallim-api).
	const chat = createChat({ connection: fetchServerSentEvents('/ai/generate') });
	// No auto-cleanup in Svelte; stop a stream still running when we unmount.
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

	let open = $state(false);

	function generate() {
		const p = prompt().trim();
		if (!p || chat.isLoading) return;
		chat.clear();
		open = true;
		chat.sendMessage(p);
	}

	function dismiss() {
		chat.stop();
		chat.clear();
		open = false;
	}

	function accept() {
		onaccept(draft);
		dismiss();
	}
</script>

{#if enabled}
	<div class="mt-2">
		<Button type="button" variant="ghost" size="sm" onclick={generate} disabled={chat.isLoading}>
			<Icon icon={SparklesIcon} class="size-4" />
			{label}
		</Button>

		{#if open}
			<div class="mt-2 rounded-control border border-border bg-surface-raised p-3">
				<p class="text-sm whitespace-pre-wrap text-pretty text-muted">
					{draft || 'Thinking…'}
				</p>
				<div class="mt-3 flex flex-wrap gap-2">
					<Button type="button" size="sm" onclick={accept} disabled={chat.isLoading || !draft}>
						Use this
					</Button>
					{#if chat.isLoading}
						<Button type="button" size="sm" variant="secondary" onclick={() => chat.stop()}>
							Stop
						</Button>
					{:else}
						<Button type="button" size="sm" variant="secondary" onclick={generate}>Retry</Button>
					{/if}
					<Button type="button" size="sm" variant="ghost" onclick={dismiss}>Dismiss</Button>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="mt-2">
		<AiOff {label} />
	</div>
{/if}
