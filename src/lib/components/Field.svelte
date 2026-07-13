<script lang="ts">
	import type { Snippet } from 'svelte';
	import Label from './Label.svelte';

	type Props = {
		/** The control's own id. Everything else is wired to it. */
		id: string;
		label: string;
		hint?: string;
		/** When set, the field is in an error state and this is why. */
		error?: string;
		/** Receives the ids to put on the control: `aria-describedby`, `aria-invalid`. */
		children: Snippet<[{ id: string; describedBy: string | undefined; invalid: boolean }]>;
	};

	let { id, label, hint, error, children }: Props = $props();

	// $derived, not const: a caller may pass a reactive id, and captured-once ids
	// would point the aria-describedby at a field that has since been replaced.
	const hintId = $derived(`${id}-hint`);
	const errorId = $derived(`${id}-error`);

	/*
		The error is described *first*. A screen reader reads describedby in order,
		and hearing "must be a whole number" before "counted from each learner's own
		enrollment" is the right way round — the correction matters more than the
		explanation.
	*/
	const describedBy = $derived(
		[error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined
	);
</script>

<div class="space-y-2">
	<Label for={id}>{label}</Label>

	{@render children({ id, describedBy, invalid: Boolean(error) })}

	{#if error}
		<!--
			GOV.UK's pattern: the message names the field's own language and leads with
			the word "Error" for anyone who cannot see that it is red.
			https://design-system.service.gov.uk/components/error-message/
		-->
		<p id={errorId} class="text-xs font-medium text-danger-text">
			<span class="sr-only">Error:</span>
			{error}
		</p>
	{/if}

	{#if hint}
		<p id={hintId} class="text-xs text-muted">{hint}</p>
	{/if}
</div>
