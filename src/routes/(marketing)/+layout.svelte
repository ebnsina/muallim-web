<script lang="ts">
	/*
		The marketing shell: the tokens, the header, the footer.

		Marketing pages are grouped under (marketing), apart from the app under (app),
		so the two never share chrome. Marketing does not theme — it is light, always —
		so the design tokens live here, on one wrapper, and every marketing component
		inherits them (CSS custom properties cascade).

		The header and footer live here too, which is the whole point of a layout. They
		used to live inside the landing: every other page then grew its own header, none
		of them agreed, and /solutions and /features had no footer at all. A page's job
		is its content. The chrome is the shell's.

		Every page opens on the same light hero gradient — the landing's and PageHero's
		are the same recipe — so the one dark header pill floats over all of them.
	*/
	import { SiteFooter, SiteHeader } from '$lib/features/marketing/ui';

	let { children } = $props();
</script>

<div class="marketing">
	<SiteHeader />
	{@render children()}
	<SiteFooter />
</div>

<style>
	/*
		The Muallim marketing design system, in tokens. Light only.

		Warm and grown rather than corporate: cream paper, ink that is almost black
		but not quite, dark olive for anything that carries weight, and lime for the
		one thing on a screen that should catch the eye. Lavender is the second voice.
		It is the same olive the product itself wears — `--brand-hue: 128` in
		src/lib/design/tokens.css — so the site and the thing it sells agree.

		This block is the whole system, and the only place these values live. The
		landing kept its own copy for a while and the rest of marketing drifted into a
		different look entirely: two palettes, one product, and no way to tell which
		was current. A token defined twice is a token that disagrees with itself.

		The spectrum exists to give icon chips variety without leaving the family —
		sage, clay, gold, lavender — all of them warm, none of them shouting over the
		lime.
	*/
	.marketing {
		/* Olive carries weight: buttons, dark panels, anything decisive. */
		--brand: #2e3320;
		--brand-strong: #1f2416;
		--brand-tint: #eaf5cf;
		--brand-soft: #3a4029;

		/* Lime is the accent, and rationed. Everything cannot be the loudest thing. */
		--accent: #c4e84b;
		--accent-tint: #eaf5cf;
		--accent-ink: #4a5f10;
		/* The band the footer sits in, and the ink that reads on olive. */
		--accent-band: #dfeaa6;
		--on-brand: #eef0e6;

		/* The second voice, for when one accent is not enough to separate two ideas. */
		--lav: #dedbf6;
		--lav-ink: #5b4fc4;

		/* The hero gradient, shared by the landing and every PageHero: near-white where
		   the dark pill sits, warming toward the bottom. One recipe, one token, so the
		   two can never drift apart again. */
		--hero-backdrop:
			/* Lime rises behind the call to action and spills around the screenshot;
			   lavender sits out at the shoulders, beside the headline. Anchored to the
			   bottom edge it was all hidden behind the shot — colour nobody could see. */
			radial-gradient(
				135% 86% at 50% 78%,
				color-mix(in oklab, var(--accent) 50%, transparent),
				transparent 64%
			),
			radial-gradient(
				70% 86% at -10% 38%,
				color-mix(in oklab, var(--lav-ink) 34%, transparent),
				transparent 66%
			),
			radial-gradient(
				70% 86% at 110% 38%,
				color-mix(in oklab, var(--lav-ink) 34%, transparent),
				transparent 66%
			),
			linear-gradient(0deg, var(--cream), var(--surface) 26%);

		/* The closing CTA's gradient runs cream → this → --accent-band, landing on the
		   band the footer sits in. Only the middle stop needed a name. */
		--cta-mid: #eef2d4;
		/* The pane the hero's screenshot sits in: paper, mostly see-through, so the
		   gradient carries on behind it. */
		--frame: color-mix(in oklab, var(--surface) 22%, transparent);
		--frame-line: color-mix(in oklab, var(--surface) 60%, transparent);
		/* Body copy on that gradient: olive, but lighter than --ink-soft under lime. */
		--cta-ink: #4a4d38;

		/* Placeholder faces. Warm and deliberately off-palette — they stand in for
		   photographs, not for the system's colours. */
		--face-1: #c9b7a4;
		--face-2: #8fae7a;
		--face-3: #b9a0c6;

		/* The spectrum, warm. Names kept from the old berry system so a page that
		   asks for one still gets a colour, but every value now sits on cream. */
		--indigo: #5b4fc4;
		--indigo-tint: #dedbf6;
		--teal: #4b7a5e;
		--teal-tint: #dfeee4;
		--violet: #7a5fd3;
		--violet-tint: #e5e0f8;
		--amber: #b4762a;
		--amber-tint: #f7efda;
		--rose: #b4653a;
		--rose-tint: #f5e4d9;
		--gold: #b7791f;
		--gold-tint: #f7efda;

		--ink: #17170f;
		--ink-soft: #3f4a2b;
		--muted: #6b6a5e;
		--line: #e7e4d8;
		--bg: #f3f1ea;
		--cream: #f3f1ea;
		--surface: #ffffff;
		--surface-2: #f7f5ef;

		/* Generous. A 24px corner is the one that reads as this product. */
		--r-sm: 12px;
		--r: 18px;
		--r-lg: 24px;
		--radius: 24px;

		/* Paper, not glass. The old system frosted everything over an aurora; this one
		   puts flat cards on cream and lets the type do the work. The names survive so
		   nothing that asks for them breaks, and they now resolve to paper.
		*/
		--glass: var(--surface);
		--glass-border: var(--line);
		--glass-blur: none;
		--glass-shadow: 0 12px 30px -28px rgba(23, 23, 15, 0.18);
		--tint: var(--surface-2);
		--tint-border: var(--line);

		/* The shell paints the paper. Without this every page that did not paint its
		   own showed the app's dark root through — which is what a layout is for. */
		position: relative;
		min-height: 100vh;
		background: var(--bg);

		color: var(--ink);
	}
</style>
