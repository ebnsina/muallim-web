<script lang="ts">
	import { AppHeader, AppRail } from '$lib/components';
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
	/>

	<!--
		The rail sits inside the sheet, beside the page rather than above it: it is a
		shortcut, not a section, and a signed-out visitor reading the catalogue has
		nowhere it could take them. Hidden below `lg`, where the width is the page's.
	-->
	<div class="flex flex-1 gap-2 rounded-t-2xl bg-surface pl-4 lg:gap-4 lg:pl-6">
		{#if data.user}
			<div class="hidden pt-6 lg:block">
				<AppRail />
			</div>
		{/if}

		<div class="min-w-0 flex-1">
			{@render children()}
		</div>
	</div>
</div>
