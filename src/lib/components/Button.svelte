<script lang="ts" module>
	export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
	export type ButtonSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type Props = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		/** Renders an anchor. The e2e suite depends on this being a link, not a button. */
		href?: string;
		loading?: boolean;
		class?: string;
		children: Snippet;
	} & Omit<HTMLButtonAttributes, 'class'> &
		Omit<HTMLAnchorAttributes, 'class'>;

	let {
		variant = 'primary',
		size = 'md',
		href,
		type = 'button',
		disabled = false,
		loading = false,
		class: className,
		children,
		...rest
	}: Props = $props();

	/*
		Hover and active are steps 10 and 5 of the ramp rather than an opacity
		change. `bg-accent/80` is a colour nobody chose, whose contrast nobody
		checked, and which lands somewhere different over every background.
	*/
	const VARIANTS: Record<ButtonVariant, string> = {
		primary: 'bg-accent text-on-solid hover:bg-accent-hover',
		secondary:
			'border border-border bg-surface-raised text-text hover:bg-surface-hover active:bg-surface-active',
		ghost: 'text-text hover:bg-surface-hover active:bg-surface-active',
		danger: 'bg-danger text-on-solid hover:bg-danger-hover'
	};

	const SIZES: Record<ButtonSize, string> = {
		sm: 'h-8 gap-1.5 px-3 text-sm',
		md: 'h-10 gap-2 px-4 text-sm',
		lg: 'h-12 gap-2 px-6 text-base'
	};

	// rounded-xl, matching the field radius so button and input read as one family.
	const base =
		'inline-flex shrink-0 items-center justify-center rounded-control font-medium whitespace-nowrap ' +
		'transition-colors select-none disabled:pointer-events-none disabled:opacity-50 ' +
		'aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4';

	const classes = $derived(cn(base, VARIANTS[variant], SIZES[size], className));

	// A busy button is not a disabled one — it keeps its focus, so a screen reader
	// stays where the user put it — but it must not fire twice.
	const inert = $derived(disabled || loading);
</script>

{#if href}
	<!--
		A disabled link is not a thing HTML has. Dropping the href is what actually
		stops the navigation; aria-disabled is what tells assistive tech about it.

		The `no-navigation-without-resolve` rule wants `resolve()` at every href. It
		cannot be called here: a component receives an href it did not build, and
		resolving an already-resolved path is not a thing to do twice. Callers
		resolve; this renders. The rule is switched off for this one file.
	-->
	<a
		href={inert ? undefined : href}
		aria-disabled={inert ? 'true' : undefined}
		role={inert ? 'link' : undefined}
		tabindex={inert ? -1 : undefined}
		class={classes}
		{...rest}
	>
		{@render children()}
	</a>
{:else}
	<button {type} disabled={inert} aria-busy={loading || undefined} class={classes} {...rest}>
		{#if loading}
			<span
				class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
				aria-hidden="true"
			></span>
		{/if}
		{@render children()}
	</button>
{/if}
