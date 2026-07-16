<script lang="ts">
	/*
		The marketing shell.

		Marketing pages are grouped under (marketing), apart from the app under (app),
		so the two never share chrome. Marketing does not theme — it is light, always —
		so the design tokens live here, on one wrapper, and every marketing component
		inherits them (CSS custom properties cascade). The look is locked in the tokens
		below and the components under $lib/features/marketing/ui; pages compose those,
		not raw CSS.
	*/
	let { children } = $props();
</script>

<div class="marketing">
	{@render children()}
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

		/* The second voice, for when one accent is not enough to separate two ideas. */
		--lav: #dedbf6;
		--lav-ink: #5b4fc4;

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

		color: var(--ink);
	}
</style>
