// The landing's card tones, in tokens rather than its literals — three quiet, two
// loud. A grid that cycles them reads as rhythm; a grid of identical white cards
// reads as a spreadsheet, which is what the rest of the site had.
//
// Spend `dark` and `photo` once per screen. They are the loudest things on a page,
// and two of them arguing is the same as none. Lime is never a card background:
// it is the accent, and the accent is rationed.

export type CardTone = {
	/** The card's own surface. */
	card: string;
	/** The icon chip: it has to lift off the card, not sink into it. */
	icon: string;
	title: string;
	body: string;
	/** The "read more" affordance, and any tick. */
	more: string;
};

const mint: CardTone = {
	card: 'border border-[var(--line)] bg-[radial-gradient(120%_90%_at_30%_0%,var(--accent-tint),var(--surface)_75%)]',
	icon: 'bg-[var(--surface)] text-[var(--brand)]',
	title: 'text-[var(--ink)]',
	body: 'text-[var(--muted)]',
	more: 'text-[var(--brand)]'
};

const lav: CardTone = {
	card: 'bg-[var(--lav)]',
	icon: 'bg-[var(--surface)] text-[var(--lav-ink)]',
	title: 'text-[var(--ink)]',
	body: 'text-[var(--ink)]/70',
	more: 'text-[var(--lav-ink)]'
};

const sage: CardTone = {
	card: 'bg-[var(--teal-tint)]',
	icon: 'bg-[var(--surface)] text-[var(--teal)]',
	title: 'text-[var(--ink)]',
	body: 'text-[var(--ink)]/70',
	more: 'text-[var(--teal)]'
};

const dark: CardTone = {
	card: 'bg-[var(--brand)]',
	icon: 'bg-[var(--accent)] text-[var(--brand)]',
	title: 'text-[var(--accent)]',
	body: 'text-[var(--on-brand)]/75',
	more: 'text-[var(--accent)]'
};

/** Image-backed: the photograph is the background, so the copy needs a scrim over
    it and white to sit on. `bg-[var(--brand)]` shows while the image loads. */
const photo: CardTone = {
	card: 'relative overflow-hidden bg-[var(--brand)]',
	icon: 'bg-[var(--accent)] text-[var(--brand)]',
	title: 'text-white',
	body: 'text-white/85',
	more: 'text-[var(--accent)]'
};

export const TONES = { mint, lav, sage, dark, photo };

/** The body of a grid: quiet tones only, so the lead card stays the loud one. */
export const QUIET: CardTone[] = [mint, lav, sage];

/** A lead card's tone, rotated by section so all four get used across a page and
    the dark one lands about once. */
export const LEAD: CardTone[] = [mint, lav, sage, dark];

/** The scrim under copy on an image-backed card. Heavier than the landing's fees
    panel (from-black/20): that sits over a photograph, and this sits over a
    screenshot, whose own type would otherwise argue with the card's. */
export const SCRIM = 'absolute inset-0 bg-gradient-to-b from-black/60 to-black/90';
