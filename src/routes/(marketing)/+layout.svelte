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

<div class="rd">
	{@render children()}
</div>

<style>
	/*
		The marketing design system, in tokens. Light only.

		Brand is berry — premium, and clear of the success/correct green a quiz app
		already spends. Gold is the warm second accent. The icon spectrum gives chips
		variety. Neutrals are faintly warm to sit with the berry. Surfaces are frosted
		glass over a fixed aurora; radii are named once.
	*/
	.rd {
		--brand: #9d174d;
		--brand-strong: #831843;
		--brand-tint: #fbe3ee;

		--gold: #b7791f;
		--gold-tint: #f7efda;

		--indigo: #4f46e5;
		--indigo-tint: #e8e7fb;
		--teal: #0d9488;
		--teal-tint: #d8f2ee;
		--violet: #7c3aed;
		--violet-tint: #efe8fd;
		--amber: #c2620c;
		--amber-tint: #fbebd9;
		--rose: #be185d;
		--rose-tint: #fbe4ee;

		--ink: #211820;
		--muted: #6b5f66;
		--line: #ece7ea;
		--bg: #faf7f9;
		--surface: #ffffff;
		--surface-2: #f4eff2;

		--r-sm: 12px;
		--r: 16px;
		--r-lg: 22px;

		/* Frosted glass, named once so a card and a panel agree. */
		--glass: color-mix(in oklab, var(--surface) 55%, transparent);
		--glass-border: color-mix(in oklab, #ffffff 60%, transparent);
		--glass-blur: blur(22px) saturate(1.4);
		--glass-shadow:
			0 14px 36px -30px rgba(33, 24, 32, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.5);
		--tint: color-mix(in oklab, #ffffff 45%, transparent);
		--tint-border: color-mix(in oklab, #ffffff 55%, transparent);

		color: var(--ink);
	}
</style>
