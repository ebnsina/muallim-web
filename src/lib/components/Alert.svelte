<script lang="ts" module>
	export type AlertTone = 'info' | 'success' | 'warning' | 'danger';
</script>

<script lang="ts">
	import {
		Alert02Icon,
		CheckmarkCircle02Icon,
		CancelCircleIcon,
		InformationCircleIcon
	} from '@hugeicons/core-free-icons';
	import Icon from './Icon.svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { rise } from '$lib/motion';

	type Props = {
		tone?: AlertTone;
		/** The visually-hidden word that names the tone for a screen reader. */
		label?: string;
		title?: string;
		class?: string;
		children: Snippet;
		/** `alert` interrupts; `status` is announced politely. Errors interrupt. */
		role?: 'alert' | 'status';
	};

	let { tone = 'info', label, title, class: className, children, role }: Props = $props();

	const TONES = {
		info: {
			icon: InformationCircleIcon,
			word: 'Information',
			class: 'border-info-border bg-info-surface text-info-text'
		},
		success: {
			icon: CheckmarkCircle02Icon,
			word: 'Success',
			class: 'border-success-border bg-success-surface text-success-text'
		},
		warning: {
			icon: Alert02Icon,
			word: 'Warning',
			class: 'border-warning-border bg-warning-surface text-warning-text'
		},
		danger: {
			icon: CancelCircleIcon,
			word: 'Error',
			class: 'border-danger-border bg-danger-surface text-danger-text'
		}
	} as const;

	// An error interrupts; anything else waits its turn.
	const resolvedRole = $derived(role ?? (tone === 'danger' ? 'alert' : 'status'));
</script>

<!--
	Colour is never the only signal (WCAG 1.4.1). Every tone carries an icon *and*
	a word — the word is visually hidden because the icon and the copy already say
	it to a sighted reader, but a screen reader hears "Error:" before the message.
-->
<!--
	The transition lives here rather than at the call site, because `transition:` is
	a directive on elements and a component is not one. Every alert in the app is
	rendered behind an `{#if}`, so mounting this element *is* the moment the notice
	appears — and it rises four pixels to say so. `rise` returns a zero-duration
	config when the reader has asked for less motion.
-->
<div
	role={resolvedRole}
	transition:rise
	class={cn('flex gap-3 rounded-card border px-4 py-3 text-sm', TONES[tone].class, className)}
>
	<Icon icon={TONES[tone].icon} class="mt-0.5 size-4 shrink-0" />

	<!-- `flex-1`: the content column takes the width the icon leaves. Shrink-to-fit,
	     it ended wherever the text happened to end — so anything an alert puts on its
	     right margin (a date, a dismiss) sat in the middle of the box instead. -->
	<div class="min-w-0 flex-1">
		<span class="sr-only">{label ?? TONES[tone].word}:</span>
		{#if title}
			<p class="font-semibold">{title}</p>
		{/if}
		<div class={title ? 'mt-1' : undefined}>{@render children()}</div>
	</div>
</div>
