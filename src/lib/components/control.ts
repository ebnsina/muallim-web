/**
 * Everything a text-entry control has in common.
 *
 * The border is `border-control`, not `border`: our fields sit on a surface a
 * shade off the page, so the edge is the only thing that says "this is a field",
 * and WCAG 1.4.11 asks for 3:1 exactly there. `contrast.spec.ts` holds it.
 *
 * `text-base` and not `text-sm`: at 14px iOS Safari zooms the page when a field
 * takes focus. Sixteen pixels is the price of not doing that.
 */
export const controlClass =
	'w-full min-w-0 rounded-control border border-border-control bg-surface-raised px-3 text-base ' +
	'text-text transition-colors placeholder:text-muted ' +
	'hover:border-border-strong ' +
	// Two pixels of the brand color, offset by two. The offset is what keeps the
	// ring off the border, where it would read as a thicker border and not a ring.
	'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
	'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60 ' +
	'aria-invalid:border-danger aria-invalid:focus-visible:outline-danger';
