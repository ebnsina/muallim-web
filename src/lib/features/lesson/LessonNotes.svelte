<script lang="ts">
	import { enhance } from '$app/forms';
	import { FloppyDiskIcon } from '@hugeicons/core-free-icons';
	import { Button, Icon, Textarea } from '$lib/components';
	import { toast } from '$lib/toast.svelte';

	type Props = {
		/** The note as the server last knew it. The difference is what Save means. */
		savedNote: string;
	};

	let { savedNote }: Props = $props();

	let saving = $state(false);

	// A writable derived: it resettles from the server after every load, so walking
	// to the next lesson cannot carry the last one's note along and offer to save it.
	let draft = $derived(savedNote);
	const changed = $derived(draft !== savedNote);
</script>

<!--
	A private margin. Only a signed-in reader has one — it is theirs, kept against the
	lesson and shown to nobody else. The whole note is sent on save; emptying it clears
	it, which is why there is nothing to delete.
-->
<div id="panel-notes" role="tabpanel" aria-labelledby="tab-notes" class="mt-5 max-w-2xl">
	<p class="text-muted text-xs">Private to you. Nobody else can read them.</p>

	<form
		method="POST"
		action="?/saveNote"
		class="mt-3"
		use:enhance={() => {
			/*
				The outcome is a toast, not a word beside the button. "Saved." in grey text
				under a form is a thing you have to be looking at to see, and a reader who
				just pressed the button is looking at the button.
			*/
			const cleared = draft.trim() === '';
			saving = true;

			return async ({ result, update }) => {
				await update({ reset: false });
				saving = false;

				if (result.type === 'failure') {
					toast.danger(String(result.data?.noteMessage ?? 'Your note could not be saved.'));
					return;
				}
				if (result.type === 'error') {
					toast.danger('Your note could not be saved.');
					return;
				}

				toast.success(cleared ? 'Note cleared.' : 'Note saved.');
			};
		}}
	>
		<Textarea
			name="body"
			rows={5}
			maxlength={10000}
			bind:value={draft}
			aria-label="Your notes on this lesson"
			placeholder="Jot something down as you read…"
		/>

		<!--
			The commit sits at the end of the form, where the eye leaves it: a button under
			the left edge of a box is a button you pass on the way in.
		-->
		<div class="mt-2 flex items-center justify-end gap-3">
			{#if changed}
				<span class="text-muted text-xs">Unsaved changes</span>
			{/if}

			<!--
				Nothing to save is not an act. Saving an unchanged note answered "Saved." to
				a reader who had changed nothing, which is a lie told politely.
			-->
			<Button type="submit" variant="secondary" size="sm" loading={saving} disabled={!changed}>
				<Icon icon={FloppyDiskIcon} class="size-4" />
				{saving ? 'Saving…' : draft.trim() === '' && savedNote ? 'Clear note' : 'Save note'}
			</Button>
		</div>
	</form>
</div>
