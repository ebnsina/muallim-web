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
<div class="flex min-h-dvh flex-col bg-accent">
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
	<div class="flex-1 rounded-t-2xl bg-surface">
		{@render children()}
	</div>
</div>
