<script lang="ts">
	/*
		The marketing shell.

		Marketing pages are grouped under (marketing), apart from the app under (app),
		so the two never share chrome: a landing page has a nav and a footer and no
		sidebar, and the app is the reverse. This is the seam.

		Marketing does not theme. It is light, always — the public face is one look, not
		the visitor's app preference — so this layout does not carry the dark wrapper the
		app honours. Shared marketing chrome (a nav, a footer) can move here later; for
		now each page owns its own, and this is the place that will hold them.
	*/
	let { children } = $props();
</script>

{@render children()}
