<script lang="ts">
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { Delete02Icon, Download01Icon, File01Icon } from '@hugeicons/core-free-icons';
	import { DURATION, easeOut } from '$lib/motion';
	import { formatBytes } from '$lib/upload';
	import { toast } from '$lib/toast.svelte';
	import Icon from './Icon.svelte';

	type UploadedFile = {
		id: string;
		filename: string;
		bytes: number;
		content_type?: string;
	};

	type Props = {
		files: UploadedFile[];
		/** Only a draft's files may be taken away, and only by whoever uploaded them. */
		removable?: boolean;
	};

	let { files, removable = false }: Props = $props();
</script>

<!--
	Every file here is one somebody uploaded, and its name is a string they chose.
	Svelte escapes it, and lms-api has already stripped the characters that end a
	`Content-Disposition` header early — but the name is a label and nothing more.
	The file is addressed by its id, and fetched through a URL the server signs.
-->
<ul class="divide-y divide-border rounded-card border border-border">
	{#each files as file (file.id)}
		<li
			class="flex items-center gap-3 px-4 py-3"
			transition:slide={{ duration: DURATION.instant, easing: easeOut }}
		>
			<Icon icon={File01Icon} class="size-4 shrink-0 text-muted" />

			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium" title={file.filename}>{file.filename}</p>
				<p class="numeral text-muted text-xs">{formatBytes(file.bytes)}</p>
			</div>

			<!--
				A download is a POST because it mints a signed URL, and minting one is not
				something a link preview, a prefetch, or a crawler should do on the reader's
				behalf. Without JavaScript the action's result renders as a link to click.
			-->
			<form
				method="POST"
				action="?/download"
				use:enhance={() =>
					async ({ result }) => {
						if (result.type === 'success' && typeof result.data?.url === 'string') {
							// The URL always serves `Content-Disposition: attachment`, so this
							// downloads the file rather than navigating away from the page.
							window.location.href = result.data.url;
						} else {
							toast.danger('That file could not be downloaded.');
						}
					}}
			>
				<input type="hidden" name="file_id" value={file.id} />
				<button
					type="submit"
					class="rounded-control p-2 text-muted transition-colors hover:bg-surface-sunken hover:text-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					aria-label="Download {file.filename}"
				>
					<Icon icon={Download01Icon} />
				</button>
			</form>

			{#if removable}
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="file_id" value={file.id} />
					<button
						type="submit"
						class="rounded-control p-2 text-muted transition-colors hover:bg-danger-surface hover:text-danger-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						aria-label="Remove {file.filename}"
					>
						<Icon icon={Delete02Icon} />
					</button>
				</form>
			{/if}
		</li>
	{/each}
</ul>
