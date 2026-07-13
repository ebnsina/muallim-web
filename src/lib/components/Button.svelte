<script lang="ts" module>
	export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
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
		/** Fully round, for the marketing site; the app uses the default rounded-xl. */
		pill?: boolean;
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
		pill = false,
		class: className,
		children,
		...rest
	}: Props = $props();

	/*
		Hover and active are steps 10 and 5 of the ramp rather than an opacity
		change. `bg-accent/80` is a color nobody chose, whose contrast nobody
		checked, and which lands somewhere different over every background.
	*/
	const VARIANTS: Record<ButtonVariant, string> = {
		primary: 'bg-accent text-on-solid hover:bg-accent-hover',
		secondary:
			'border border-border bg-surface-raised text-text hover:bg-surface-hover active:bg-surface-active',
		ghost: 'text-text hover:bg-surface-hover active:bg-surface-active',
		danger: 'bg-danger text-on-solid hover:bg-danger-hover',

		/*
			For a button standing on the aurora, and nowhere else.

			A white slab on the brand's own light is a hole punched in it — the eye reads
			the paper, not the button. This is the surface's own ink at a low alpha, with
			a hairline of it for an edge: the light shows through, so the button belongs to
			the card instead of sitting on top of it. It is what the pills in the band are,
			and for the same reason.

			Alpha rather than a chosen color, deliberately: the aurora is five gradients
			and there is no one hex it is. A translucent white is correct over all of them.
		*/
		glass:
			'bg-on-solid/15 text-on-solid backdrop-blur-sm hover:bg-on-solid/25 active:bg-on-solid/30'
	};

	/*
		`md` is the field's own height, and a button standing beside an Input or a Select
		must be one — a 32px button against a 40px field is two things that were meant to
		be one control row and are not.

		`sm` is for a button on its own: a row action, a card footer, a toolbar. If there
		is a field beside it, it is the wrong size.
	*/
	const SIZES: Record<ButtonSize, string> = {
		sm: 'h-8 gap-1.5 px-3 text-sm',
		md: 'h-10 gap-2 px-4 text-sm',
		lg: 'h-12 gap-2 px-6 text-base'
	};

	/*
		rounded-xl, matching the field radius so button and input read as one family.
		The marketing site opts into a full pill via `pill`.

		The press is the whole point of the transform here. A button that does not
		move under the pointer is a button the interface did not admit to hearing —
		three percent is not visible so much as *felt*, and it is the cheapest way an
		app has of feeling like it is listening. `scale` takes the label and the icon
		down with the box, which is what makes it read as the button depressing rather
		than the box resizing.

		Gated on `motion-safe`, so a reader who asked for less motion keeps the color
		change and loses the movement — and disabled/busy buttons drop pointer events
		before `:active` can ever fire.

		The property list spells out `scale` because it is a *hand-written* list, and a
		hand-written list is literal: Tailwind 4 compiles `scale-*` to the standalone
		`scale` property, so a list that says `transform` would not cover it and the
		press would jump rather than ease. (Tailwind's own `transition-transform`
		utility expands to `transform, translate, scale, rotate` and is perfectly safe —
		the hazard is only in arbitrary lists like this one. Which is why this one also
		restates the colors `transition-colors` would have given us for free.)
	*/
	const base =
		'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap ' +
		'transition-[scale,color,background-color,border-color,outline-color,text-decoration-color] ' +
		'duration-(--duration-press) ease-out motion-safe:active:scale-[0.97] ' +
		'select-none disabled:pointer-events-none disabled:opacity-50 ' +
		'aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4';

	const classes = $derived(
		cn(base, pill ? 'rounded-pill' : 'rounded-control', VARIANTS[variant], SIZES[size], className)
	);

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
			<!-- 0.6s, not Tailwind's 1s. A spinner's speed is read as the app's speed:
			     the same wait behind a faster spinner is reported as a shorter one. -->
			<span
				class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent [animation-duration:0.6s]"
				aria-hidden="true"
			></span>
		{/if}
		{@render children()}
	</button>
{/if}
