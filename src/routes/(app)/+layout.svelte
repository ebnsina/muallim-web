<script lang="ts">
	import { AppHeader } from '$lib/components';
	import { canAuthor } from '$lib/roles';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<!--
	The chrome, for every page a signed-in person can reach.

	A route group, so none of these URLs changed. The alternative — an `<AppHeader>`
	at the top of each page — is a header that exists on whichever pages somebody
	remembered, which is how this app ended up navigable only from the dashboard.

	`canAuthor` decides whether "Teach" is drawn. It is a courtesy and not a
	control: muallim-api refuses a student who types the URL, and it is the one that
	knows.
-->
<!--
	The band, and the page as a sheet lying on it.

	A column, so the sheet takes whatever height the band leaves: `100dvh minus a
	guessed header height` leaves a sliver of the band showing at the bottom the
	moment the guess is off by a pixel, and it is off on every screen where the nav
	wraps.
-->
<div class="aurora aurora-frame flex min-h-dvh flex-col">
	<AppHeader
		user={data.user ?? undefined}
		canAuthor={canAuthor(data.user)}
		unread={data.unread ?? 0}
		notifications={data.notifications ?? []}
	/>

	<!--
		One navigation, in the band. A rail beside the page offering the same places was
		two navigations disagreeing about which is the way to them — so the destinations
		went up into the band and the rail went away.

		The sheet still runs edge to edge; the page inside it does not. Text with no
		gutter runs into the window, and a line of it 1400px long is a line nobody can
		find their way back across.
	-->
	<!--
		`text-text`, said out loud. The band above is an aurora and an aurora paints its
		ink white; the sheet is white paper, and anything on it that did not name its own
		color inherited that and vanished. It is the same trap the notification panel
		fell into, and the sheet is where it costs a whole page rather than one row.
	-->
	<div class="flex-1 bg-surface text-text">
		<!--
			The sheet's top edge, pinned under the band.

			The radius used to belong to the sheet itself, and the sheet scrolls: four
			lines down, the curve had gone up under the header and the page met the band
			as a hard square edge. So the edge is its own sticky strip — the aurora behind
			it, the sheet's own white in front of it, curved. It rides under the header at
			every scroll position, and the page passes beneath it.

			`aurora-frame` is what makes it invisible: the gradient is fixed to the
			viewport, so this strip's slice of it lines up exactly with the band's.
		-->
		<div class="aurora aurora-frame sticky top-20 z-20 h-4 sm:top-24">
			<div class="h-4 rounded-t-2xl bg-surface"></div>
		</div>

		{@render children()}
	</div>
</div>
