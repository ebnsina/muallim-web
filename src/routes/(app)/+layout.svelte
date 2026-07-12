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
<div class="flex min-h-dvh flex-col">
	<AppHeader
		user={data.user ?? undefined}
		canAuthor={canAuthor(data.user)}
		unread={data.unread ?? 0}
	/>

	<div class="flex-1">
		{@render children()}
	</div>
</div>
