<script lang="ts">
	import { SparklesIcon } from '@hugeicons/core-free-icons';
	import AiOff from './AiOff.svelte';
	import Alert from './Alert.svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import Input from './Input.svelte';

	type Props = {
		/** Hands the accepted image to the page, which uploads it through the same
		 *  presign → PUT → confirm flow the file picker uses. */
		onaccept: (file: File) => void | Promise<void>;
		/** Off unless the server has an image-provider key; then the control says so. */
		enabled?: boolean;
	};

	let { onaccept, enabled = false }: Props = $props();

	let open = $state(false);
	let description = $state('');
	let generating = $state(false);
	let accepting = $state(false);
	let error = $state('');
	// The returned image, as a data URL or a hosted URL — both work as an <img> src.
	let preview = $state('');

	const busy = $derived(generating || accepting);

	async function generate() {
		const prompt = description.trim();
		if (!prompt || busy) return;

		generating = true;
		error = '';
		preview = '';
		try {
			const response = await fetch('/ai/image', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ prompt })
			});

			if (!response.ok) {
				// The route answers 501 when unconfigured and 502 when the provider
				// failed; its message is written for this reader, so it is shown.
				const problem = await response.json().catch(() => null);
				error =
					problem?.message ||
					(response.status === 501
						? 'AI isn’t set up yet. Ask your administrator to turn it on.'
						: 'That image could not be generated. Try again.');
				return;
			}

			const data = await response.json();
			if (typeof data.image !== 'string') {
				error = 'No image came back. Please try again.';
				return;
			}
			preview = data.image;
		} catch {
			error = 'Couldn’t connect. Check your connection and try again.';
		} finally {
			generating = false;
		}
	}

	async function accept() {
		if (!preview || busy) return;
		accepting = true;
		error = '';
		try {
			// Turn the data URL (or hosted URL) into a File the upload flow can sign for.
			const blob = await (await fetch(preview)).blob();
			const file = new File([blob], 'thumbnail.png', { type: blob.type || 'image/png' });
			await onaccept(file);
			reset();
		} catch {
			error = 'That image couldn’t be saved. Please try again.';
		} finally {
			accepting = false;
		}
	}

	function reset() {
		open = false;
		description = '';
		preview = '';
		error = '';
	}
</script>

{#if enabled}
	{#if !open}
		<Button type="button" variant="secondary" onclick={() => (open = true)}>
			<Icon icon={SparklesIcon} class="size-4" />
			Generate with AI
		</Button>
	{:else}
		<div
			class="w-full max-w-md rounded-card border border-border bg-surface-raised p-4"
			aria-busy={busy}
		>
			<label class="block text-sm font-medium" for="thumbnail-prompt">
				Describe the thumbnail
			</label>
			<p class="mt-0.5 text-xs text-muted">
				A short brief — the subject, a mood, a colour. No text is drawn on the image.
			</p>

			<div class="mt-2 flex flex-wrap items-center gap-2">
				<Input
					id="thumbnail-prompt"
					bind:value={description}
					placeholder="A calm study of Arabic calligraphy in deep berry tones"
					maxlength={500}
					disabled={busy}
					class="min-w-0 flex-1"
					onkeydown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							generate();
						}
					}}
				/>
				<Button
					type="button"
					onclick={generate}
					loading={generating}
					disabled={busy || !description.trim()}
				>
					<Icon icon={SparklesIcon} class="size-4" />
					{generating ? 'Generating…' : 'Generate'}
				</Button>
			</div>

			{#if error}
				<Alert tone="danger" class="mt-3" role="alert">{error}</Alert>
			{/if}

			{#if preview}
				<div class="mt-3">
					<img
						src={preview}
						alt="Generated thumbnail preview"
						class="size-40 rounded-xl border border-border object-cover"
					/>
					<div class="mt-3 flex flex-wrap gap-2">
						<Button type="button" onclick={accept} loading={accepting} disabled={busy}>
							Use this image
						</Button>
						<Button type="button" variant="secondary" onclick={generate} disabled={busy}>
							Regenerate
						</Button>
						<Button type="button" variant="ghost" onclick={reset} disabled={busy}>Cancel</Button>
					</div>
				</div>
			{:else}
				<div class="mt-3">
					<Button type="button" variant="ghost" size="sm" onclick={reset} disabled={busy}>
						Cancel
					</Button>
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<AiOff label="Generate with AI" />
{/if}
