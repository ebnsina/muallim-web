/**
 * The sliding pill: one fill that moves to whichever item is current, rather than
 * one fill per item, lit and unlit.
 *
 * Six backgrounds fading in and out say "that one stopped, this one started",
 * which is the same information and none of the continuity. A mark that travels
 * carries the eye from where it was to where it went — and that is the whole of
 * what a selected tab has to say.
 *
 * It measures the element rather than computing from labels, because label widths
 * depend on a font that arrives after the markup does. A layout that guesses is a
 * layout that is wrong for one frame on every cold load.
 *
 * Used by the band's nav and by the lesson's tabs. Anything else with a row of
 * mutually-exclusive choices should use it too.
 */
export class Pill {
	/** The row. It is the pill's offset parent, so it must be `relative`. */
	track = $state<HTMLElement>();

	/** Every item, by its key. Bind each one: `bind:this={pill.items[key]}`. */
	items = $state<Record<string, HTMLElement | undefined>>({});

	/**
	 * Where the fill is, and how wide.
	 *
	 * `measured` stays false until the first measurement lands, so a server-rendered
	 * row can light its active item the old way instead of showing a pill sitting at
	 * zero width in the corner.
	 */
	pos = $state({ x: 0, w: 0, measured: false });

	/**
	 * Point it at the current item. Call it when the selection or the layout changes.
	 *
	 * It writes only when the answer has changed, and that is not a micro-optimisation:
	 * this runs inside an effect that *reads* `pos` to draw the fill, so an
	 * unconditional assignment is an effect writing the state it depends on — which
	 * Svelte rightly kills as an infinite loop. It took a page with no current item at
	 * all (Notifications is in no nav) to expose it, because there the "nothing to
	 * measure" branch re-assigned on every pass, forever.
	 */
	measure(key: string | null | undefined) {
		const el = key ? this.items[key] : undefined;

		if (!el || !this.track) {
			if (this.pos.measured) this.pos = { ...this.pos, measured: false };
			return;
		}

		// `offsetLeft` is relative to the track, which is the offset parent — the pill
		// is absolutely positioned inside it, so that number *is* the translation.
		const x = el.offsetLeft;
		const w = el.offsetWidth;
		if (this.pos.measured && this.pos.x === x && this.pos.w === w) return;

		this.pos = { x, w, measured: true };
	}

	/** The inline style for the fill. */
	get style(): string {
		return `transform: translateX(${this.pos.x}px); width: ${this.pos.w}px`;
	}
}
